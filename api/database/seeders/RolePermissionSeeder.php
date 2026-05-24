<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;

class RolePermissionSeeder extends Seeder
{
    public function run(): void
    {
        $roles = [
            'Farmer',
            'Agrodealer',
            'Agrovet',
            'Agronomist',
            'LogisticsProvider',
            'Admin',
            'SuperAdmin',
            'KYCOfficer',
            'CatalogManager',
            'SupportAgent',
            'FinancialAuditor',
        ];

        foreach ($roles as $r) {
            Role::firstOrCreate(['name' => $r, 'guard_name' => 'web']);
        }
    }
}
