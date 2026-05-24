<?php

return [
    'mailgun' => [
        'domain' => env('MAILGUN_DOMAIN'),
        'secret' => env('MAILGUN_SECRET'),
        'endpoint' => env('MAILGUN_ENDPOINT', 'api.mailgun.net'),
    ],

    'postmark' => [
        'token' => env('POSTMARK_TOKEN'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'sms' => [
        'default' => env('SMS_DEFAULT_DRIVER', 'africas-talking'),
    ],

    'africas_talking' => [
        'username' => env('AFRICAS_TALKING_USERNAME', 'sandbox'),
        'api_key' => env('AFRICAS_TALKING_API_KEY'),
        'sender_id' => env('AFRICAS_TALKING_SENDER_ID', 'Mkulima'),
    ],

    'twilio' => [
        'sid' => env('TWILIO_SID'),
        'token' => env('TWILIO_TOKEN'),
        'from' => env('TWILIO_FROM'),
    ],

    'gemini' => [
        'api_key' => env('GEMINI_API_KEY'),
        'base_url' => env('GEMINI_BASE_URL', 'https://generativelanguage.googleapis.com/v1beta'),
        'default_model' => env('GEMINI_DEFAULT_MODEL', 'gemini-2.5-flash'),
        'pro_model' => env('GEMINI_PRO_MODEL', 'gemini-2.5-pro'),
    ],

    'mpesa' => [
        'consumer_key' => env('MPESA_CONSUMER_KEY'),
        'consumer_secret' => env('MPESA_CONSUMER_SECRET'),
        'shortcode' => env('MPESA_SHORTCODE'),
        'passkey' => env('MPESA_PASSKEY'),
        // B2C — vendor/provider disbursement. Initiator is a separate
        // operator account; security credential is the password encrypted
        // with Safaricom's public cert (use their portal tool to generate).
        'initiator_name' => env('MPESA_INITIATOR_NAME'),
        'initiator_security_credential' => env('MPESA_INITIATOR_SECURITY_CREDENTIAL'),
        'env' => env('MPESA_ENV', 'sandbox'),
    ],

    'selcom' => [
        'api_key' => env('SELCOM_API_KEY'),
        'api_secret' => env('SELCOM_API_SECRET'),
        'vendor_id' => env('SELCOM_VENDOR_ID'),
    ],

    'whatsapp' => [
        'phone_number_id' => env('WHATSAPP_PHONE_NUMBER_ID'),
        'access_token' => env('WHATSAPP_ACCESS_TOKEN'),
    ],
];
