<?php

namespace App\Services\Push;

use App\Models\PushToken;
use App\Models\User;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Minishlink\WebPush\Subscription;
use Minishlink\WebPush\WebPush;

/**
 * PushService — unified send for Web Push (browser) + Expo (React Native).
 *
 * The PushToken row's `platform` field decides the transport. Web Push uses
 * VAPID-signed POSTs to the browser's push endpoint; Expo uses a single REST
 * call to exp.host. Both surface the same { title, body, data } shape so
 * callers don't care which device the user is on.
 *
 * Stale subscriptions (410 Gone for Web Push, `DeviceNotRegistered` for
 * Expo) are pruned automatically — keeps the table clean and avoids paying
 * for sends that will never be delivered.
 */
class PushService
{
    public function notify(User $user, array $payload): void
    {
        $tokens = PushToken::where('user_id', $user->id)->get();
        if ($tokens->isEmpty()) return;

        [$webTokens, $expoTokens] = $tokens->partition(fn($t) => $t->platform === 'web');

        if ($webTokens->isNotEmpty()) {
            $this->sendWebPush($webTokens, $payload);
        }
        if ($expoTokens->isNotEmpty()) {
            $this->sendExpo($expoTokens, $payload);
        }
    }

    private function sendWebPush($tokens, array $payload): void
    {
        $vapid = config('push.vapid');
        if (!$vapid['public'] || !$vapid['private']) {
            Log::info('[Push/web/dev] would notify', ['count' => $tokens->count(), 'payload' => $payload]);
            return;
        }

        $webPush = new WebPush([
            'VAPID' => [
                'subject' => $vapid['subject'],
                'publicKey' => $vapid['public'],
                'privateKey' => $vapid['private'],
            ],
        ]);

        foreach ($tokens as $t) {
            // Web Push subs are persisted as JSON in `token` (full subscription
            // JSON) or split across `token`+`keys` columns. Support both.
            $sub = json_decode($t->token, true);
            if (!is_array($sub) || !isset($sub['endpoint'])) {
                $sub = [
                    'endpoint' => $t->token,
                    'keys' => $t->keys ?? [],
                ];
            }
            $webPush->queueNotification(
                Subscription::create($sub),
                json_encode($payload),
            );
        }

        foreach ($webPush->flush() as $report) {
            if (!$report->isSuccess()) {
                $endpoint = $report->getRequest()->getUri()->__toString();
                $isGone = $report->getResponse()?->getStatusCode() === 410;
                if ($isGone) {
                    PushToken::where('token', 'like', '%' . substr($endpoint, -50) . '%')->delete();
                }
            }
        }
    }

    private function sendExpo($tokens, array $payload): void
    {
        $messages = $tokens->map(fn($t) => [
            'to' => $t->token,
            'title' => $payload['title'] ?? 'Mkulima',
            'body' => $payload['body'] ?? '',
            'data' => $payload['data'] ?? [],
            'sound' => 'default',
        ])->values()->all();

        $resp = Http::acceptJson()->asJson()->post(config('push.expo.endpoint'), $messages);
        if (!$resp->ok()) {
            Log::warning('Expo push failed', ['status' => $resp->status(), 'body' => $resp->body()]);
            return;
        }
        // Prune any token Expo reports as no-longer-valid.
        foreach ($resp->json('data', []) as $i => $row) {
            if (($row['status'] ?? '') !== 'ok') {
                $code = $row['details']['error'] ?? '';
                if ($code === 'DeviceNotRegistered') {
                    PushToken::where('token', $tokens[$i]->token)->delete();
                }
            }
        }
    }
}
