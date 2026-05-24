<?php

namespace App\Providers;

use Illuminate\Support\Facades\Gate;
use Laravel\Horizon\Horizon;
use Laravel\Horizon\HorizonApplicationServiceProvider;

class HorizonServiceProvider extends HorizonApplicationServiceProvider
{
    public function boot(): void
    {
        parent::boot();
    }

    /**
     * Horizon dashboard at /horizon — gate by role so only Admin + SuperAdmin
     * can see the queue, jobs, and failed jobs.
     */
    protected function gate(): void
    {
        Gate::define('viewHorizon', function ($user = null) {
            return $user && in_array($user->role, ['Admin', 'SuperAdmin'], true);
        });
    }
}
