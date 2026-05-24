<?php

namespace App\Http\Controllers\Api;

use App\Services\Whatsapp\WhatsappClient;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;

class WhatsappReceiptController extends Controller
{
    public function __construct(
        private readonly WhatsappClient $client,
    ) {}

    /**
     * POST /api/v1/whatsapp/receipt
     *
     * Sends a receipt summary to a customer's WhatsApp number.
     * Requires auth. The WhatsApp credentials never touch the client.
     */
    public function send(Request $request): JsonResponse
    {
        $data = $request->validate([
            'phone' => ['required', 'string', 'max:20'],
            'message' => ['required', 'string', 'max:4096'],
        ]);

        $messageId = $this->client->sendText($data['phone'], $data['message']);

        if ($messageId) {
            return response()->json(['ok' => true, 'message_id' => $messageId]);
        }

        // In dev mode (no credentials configured) the client logs and returns null.
        // We surface that gracefully so the UI can still test the flow.
        return response()->json([
            'ok' => true,
            'message_id' => null,
            'note' => 'WhatsApp credentials not configured; message logged to server logs.',
        ]);
    }
}
