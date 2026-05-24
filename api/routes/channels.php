<?php

use App\Models\User;
use Illuminate\Support\Facades\Broadcast;

// Each user listens on their own private channel for order + KYC updates.
Broadcast::channel('users.{userId}', function (User $user, int $userId) {
    return $user->id === $userId;
});

// Vendors listen for new orders / low-stock alerts.
Broadcast::channel('vendors.{vendorId}', function (User $user, int $vendorId) {
    return $user->id === $vendorId && $user->isVendor();
});

// Admins listen for the KYC queue stream.
Broadcast::channel('admin.kyc', function (User $user) {
    return $user->isStaff();
});
