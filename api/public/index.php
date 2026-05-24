<?php

use Illuminate\Foundation\Application;
use Illuminate\Http\Request;

// PHP 8.5 deprecates the old PDO::MYSQL_ATTR_* constants in favour of
// Pdo\Mysql::ATTR_*. Laravel framework hasn't migrated those references
// yet (see vendor/laravel/framework/config/database.php), so on PHP 8.5
// the warnings leak into HTTP responses. We don't use MySQL — Postgres-only —
// so suppress those notices at the boundary instead of patching vendor code.
error_reporting(E_ALL & ~E_DEPRECATED & ~E_USER_DEPRECATED);
ini_set('display_errors', '0');
ini_set('log_errors', '1');

define('LARAVEL_START', microtime(true));

// Maintenance mode bypass.
if (file_exists($maintenance = __DIR__ . '/../storage/framework/maintenance.php')) {
    require $maintenance;
}

require __DIR__ . '/../vendor/autoload.php';

/** @var Application $app */
$app = require_once __DIR__ . '/../bootstrap/app.php';

$app->handleRequest(Request::capture());
