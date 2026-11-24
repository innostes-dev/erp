<?php

return [
    'paths' => ['*'],
    'allowed_methods' => ['*'],
    'allowed_origins' => array_values(array_filter(array_map(
        'trim',
        explode(',', (string) env('CORS_ORIGINS', 'http://localhost:4200,http://127.0.0.1:4200'))
    ))),
    'allowed_origins_patterns' => [],
    'allowed_headers' => ['*'],
    'exposed_headers' => ['Retry-After', 'ETag', 'X-Correlation-ID'],
    'max_age' => 600,
    'supports_credentials' => true,
];
