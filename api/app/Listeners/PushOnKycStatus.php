<?php

namespace App\Listeners;

use App\Events\KycStatusUpdated;
use App\Models\User;
use App\Services\Push\PushService;
use Illuminate\Contracts\Queue\ShouldQueue;

class PushOnKycStatus implements ShouldQueue
{
    public function __construct(private readonly PushService $push) {}

    public function handle(KycStatusUpdated $event): void
    {
        $sub = $event->submission;
        $user = User::find($sub->user_id);
        if (!$user) return;
        $this->push->notify($user, [
            'title' => match ($sub->status) {
                'Verified' => 'Your ID is verified',
                'Rejected' => 'KYC needs another look',
                default => 'KYC update',
            },
            'body' => match ($sub->status) {
                'Verified' => 'Financial services are now unlocked.',
                'Rejected' => 'Please resubmit with clearer photos.',
                default => 'Your submission status changed.',
            },
            'data' => ['type' => 'kyc', 'status' => $sub->status],
        ]);
    }
}
