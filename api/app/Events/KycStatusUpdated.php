<?php

namespace App\Events;

use App\Models\KycSubmission;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/**
 * Pushed when an admin decides on a KYC submission. The farmer's KYC
 * "pending review" screen reacts in real time and switches to verified.
 */
class KycStatusUpdated implements ShouldBroadcast
{
    use Dispatchable;
    use InteractsWithSockets;
    use SerializesModels;

    public function __construct(public readonly KycSubmission $submission) {}

    public function broadcastOn(): array
    {
        return [new PrivateChannel("users.{$this->submission->user_id}")];
    }

    public function broadcastWith(): array
    {
        return [
            'id' => $this->submission->id,
            'status' => $this->submission->status,
            'reviewed_at' => $this->submission->reviewed_at,
        ];
    }
}
