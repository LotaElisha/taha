<?php

return [
    // Sanctum's CSRF cookie + every /api/v1/* call needs CORS allowed for the
    // SPA origin in dev. In prod the frontend lives at the same site so this
    // becomes a no-op.
    'paths' => ['api/*', 'sanctum/csrf-cookie', 'broadcasting/auth'],

    'allowed_methods' => ['*'],

    'allowed_origins' => [
        env('FRONTEND_URL', 'http://localhost:3000'),
    ],

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    // Required so the browser sends the Sanctum session cookie cross-origin.
    'supports_credentials' => true,
];
