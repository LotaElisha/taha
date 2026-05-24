<?php

namespace App\Providers;

use Illuminate\Foundation\Support\Providers\AuthServiceProvider as ServiceProvider;
use Illuminate\Support\Facades\Gate;

class AuthServiceProvider extends ServiceProvider
{
    protected $policies = [
        // Add domain policies here as we ship them.
    ];

    public function boot(): void
    {
        $this->registerPolicies();

        // Super-admins implicitly pass every Gate check.
        Gate::before(function ($user) {
            return $user->hasRole('SuperAdmin') ? true : null;
        });
    }
}
