<?php

return [
    'vapid' => [
        'subject' => env('VAPID_SUBJECT', 'mailto:hello@mkulima.app'),
        'public' => env('VAPID_PUBLIC_KEY'),
        'private' => env('VAPID_PRIVATE_KEY'),
    ],
    'expo' => [
        // Expo doesn't require auth for the public push endpoint.
        'endpoint' => env('EXPO_PUSH_ENDPOINT', 'https://exp.host/--/api/v2/push/send'),
    ],
];
