<?php

use Illuminate\Support\Facades\Route;

// Web routes are minimal — only the Sanctum CSRF endpoint matters for the SPA.
Route::get('/', fn() => response()->json(['app' => 'Mkulima API', 'docs' => '/api/v1']));
