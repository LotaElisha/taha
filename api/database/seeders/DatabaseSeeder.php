<?php

namespace Database\Seeders;

use App\Models\KycSubmission;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\Review;
use App\Models\Tool;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Spatie\Permission\Models\Role;
use Throwable;

/**
 * DatabaseSeeder — opinionated, realistic dev data for Mkulima.
 *
 * Each step is wrapped in a try/catch + console echo so a partial failure
 * doesn't take the whole run down silently. The seeder prints progress
 * lines like
 *      → seedStaff (2 created)
 *      → seedVendors (7 created)
 * so you can see exactly how far it got if something throws.
 */
class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([RolePermissionSeeder::class]);

        $this->step('staff', fn() => $this->seedStaff());
        $vendors = $this->step('vendors', fn() => $this->seedVendors(), []);
        $this->step('agronomists+logistics', fn() => $this->seedAgronomistsAndLogistics());
        $farmers = $this->step('farmers', fn() => $this->seedFarmers(20), []);
        $products = $this->step('products', fn() => $this->seedProducts($vendors), []);
        $this->step('orders', fn() => $this->seedOrders($farmers, $products));
        $this->step('reviews', fn() => $this->seedReviews($farmers, $vendors));
        $this->step('tools', fn() => $this->seedTools($vendors));
    }

    /**
     * Run one seeder step; print progress; never crash the whole run.
     * Returns whatever the closure returned, or `$default` on failure.
     */
    private function step(string $label, callable $fn, mixed $default = null): mixed
    {
        $this->command?->getOutput()?->write("  → {$label}: ");
        try {
            $result = $fn();
            $count = is_countable($result) ? count($result) : '';
            $this->command?->getOutput()?->writeln("<info>ok</info>" . ($count !== '' ? " ({$count})" : ''));
            return $result ?? $default;
        } catch (Throwable $e) {
            $this->command?->getOutput()?->writeln("<error>FAILED</error>");
            $this->command?->getOutput()?->writeln("    " . $e::class . ': ' . $e->getMessage());
            $this->command?->getOutput()?->writeln("    at " . $e->getFile() . ':' . $e->getLine());
            return $default;
        }
    }

    private function seedStaff(): void
    {
        $admin = User::create([
            'name' => 'System Administrator',
            'email' => 'admin@mkulima.com',
            'password' => Hash::make('password'),
            'role' => 'SuperAdmin',
            'kyc_status' => 'Verified',
            'region' => 'TZ',
        ]);
        $admin->syncRoles(['SuperAdmin']);

        $kyc = User::create([
            'name' => 'KYC Officer',
            'email' => 'kyc@mkulima.app',
            'password' => Hash::make('password'),
            'role' => 'KYCOfficer',
            'kyc_status' => 'Verified',
            'region' => 'TZ',
        ]);
        $kyc->syncRoles(['KYCOfficer']);
    }

    /** @return array<User> */
    private function seedVendors(): array
    {
        $cities = [
            ['name' => 'Kibo Agri Supplies', 'role' => 'Agrodealer', 'city' => 'Arusha', 'lat' => -3.3869, 'lon' => 36.6829],
            ['name' => 'Moshi Farm Supply', 'role' => 'Agrodealer', 'city' => 'Moshi', 'lat' => -3.3473, 'lon' => 37.3398],
            ['name' => 'Dodoma Tools & Seeds', 'role' => 'Agrodealer', 'city' => 'Dodoma', 'lat' => -6.1730, 'lon' => 35.7419],
            ['name' => 'Mbeya Highland Agri', 'role' => 'Agrodealer', 'city' => 'Mbeya', 'lat' => -8.9094, 'lon' => 33.4607],
            ['name' => 'Dar Coastal Inputs', 'role' => 'Agrodealer', 'city' => 'Dar es Salaam', 'lat' => -6.7924, 'lon' => 39.2083],
            ['name' => 'Iringa Agrovet', 'role' => 'Agrovet', 'city' => 'Iringa', 'lat' => -7.7700, 'lon' => 35.6900],
            ['name' => 'Mwanza Animal Health', 'role' => 'Agrovet', 'city' => 'Mwanza', 'lat' => -2.5167, 'lon' => 32.9000],
        ];

        $out = [];
        foreach ($cities as $i => $c) {
            $u = User::create([
                'name' => $c['name'],
                'phone' => sprintf('+25575500%04d', $i + 1),
                'role' => $c['role'],
                'kyc_status' => 'Verified',
                'region' => 'TZ',
                'location' => $c['city'],
                'lat' => $c['lat'],
                'lon' => $c['lon'],
                'business_description' => "Trusted {$c['role']} serving the {$c['city']} region with quality agricultural inputs.",
                'operating_hours' => 'Mon-Sat 7 AM - 6 PM',
                'specialties' => $c['role'] === 'Agrovet'
                    ? ['Vaccinations', 'Dewormers', 'Vitamins']
                    : ['Hybrid seeds', 'Fertilizer', 'Pesticides', 'Hand tools'],
                'rating' => mt_rand(40, 49) / 10,
                'phone_verified_at' => now(),
            ]);
            $u->syncRoles([$c['role']]);
            $out[] = $u;
        }
        return $out;
    }

    private function seedAgronomistsAndLogistics(): void
    {
        foreach (range(1, 3) as $i) {
            $u = User::create([
                'name' => "Agronomist {$i}",
                'phone' => sprintf('+25575501%04d', $i),
                'role' => 'Agronomist',
                'kyc_status' => 'Verified',
                'region' => 'TZ',
                'specialties' => ['Soil health', 'Pest management', 'Irrigation'],
                'phone_verified_at' => now(),
            ]);
            $u->syncRoles(['Agronomist']);
        }
        foreach (range(1, 2) as $i) {
            $u = User::create([
                'name' => "Logistics Partner {$i}",
                'phone' => sprintf('+25575502%04d', $i),
                'role' => 'LogisticsProvider',
                'kyc_status' => 'Verified',
                'region' => 'TZ',
                'phone_verified_at' => now(),
            ]);
            $u->syncRoles(['LogisticsProvider']);
        }
    }

    /** @return array<User> */
    private function seedFarmers(int $count): array
    {
        $regions = ['Arusha', 'Moshi', 'Dodoma', 'Mbeya', 'Iringa', 'Tabora', 'Morogoro'];
        $out = [];
        foreach (range(1, $count) as $i) {
            $u = User::create([
                'name' => "Farmer " . Str::random(5),
                'phone' => sprintf('+255712%06d', $i),
                'role' => 'Farmer',
                'kyc_status' => $i % 7 === 0 ? 'Pending' : ($i % 5 === 0 ? 'Not Submitted' : 'Verified'),
                'region' => 'TZ',
                'location' => $regions[array_rand($regions)],
                'phone_verified_at' => now(),
                'nin' => $i % 5 === 0 ? null : sprintf('19850601-%05d-67890-12', $i),
            ]);
            $u->syncRoles(['Farmer']);
            $out[] = $u;
        }
        return $out;
    }

    /** @return array<Product> */
    private function seedProducts(array $vendors): array
    {
        if (empty($vendors)) return [];

        $catalog = [
            'Seeds' => [
                ['DK 8033 Hybrid Maize Seed 2 kg', 12500],
                ['SC Duma 43 Maize Seed 2 kg', 11800],
                ['KSC 627 Maize Seed 2 kg', 13200],
                ['Beans Lyamungu 90 1 kg', 3200],
                ['Sunflower Hysun 33 1 kg', 4800],
                ['Tomato Anna F1 25 g', 12000],
            ],
            'Fertilizers' => [
                ['YaraMila Cereal 25 kg', 95000],
                ['DAP 50 kg', 110000],
                ['Urea 50 kg', 85000],
                ['Minjingu Mazao 50 kg', 78000],
                ['Foliar Zinc + Boron 1 L', 4500],
            ],
            'Pesticides' => [
                ['Karate 5 EC 1 L', 8200],
                ['Roundup 1 L', 14000],
                ['Confidor 1 L', 16500],
                ['Dudu-Acelamectin 250 mL', 6200],
            ],
            'Tools' => [
                ['Knapsack Sprayer 16 L', 48000],
                ['Hand Hoe', 6800],
                ['Panga (Machete)', 4500],
                ['Wheelbarrow', 62000],
            ],
            'Animal Medicine' => [
                ['Newcastle Vaccine 100 doses', 5500],
                ['Albendazole 100 mL', 4200],
                ['Coopers Acaricide 500 mL', 12500],
                ['Vitamin AD3E injection 100 mL', 6800],
            ],
            'Agrovet Services' => [
                ['Cattle Pregnancy Check', 8000],
                ['Pet Vaccination Visit', 15000],
            ],
        ];

        $out = [];
        foreach ($vendors as $v) {
            $matchingCategories = $v->role === 'Agrovet'
                ? ['Animal Medicine', 'Agrovet Services']
                : array_keys($catalog);

            foreach ($matchingCategories as $cat) {
                foreach ($catalog[$cat] as $i => [$name, $price]) {
                    $p = Product::create([
                        'vendor_id' => $v->id,
                        'name' => $name,
                        'description' => "{$name} — supplied by {$v->name}. Stocked locally for fast delivery.",
                        'price' => $price,
                        'currency' => 'TZS',
                        'category' => $cat,
                        'stock' => $i % 4 === 0 ? mt_rand(0, 9) : mt_rand(20, 150),
                        'barcode' => sprintf('5901234%07d', $v->id * 1000 + $i),
                        'is_featured' => $i === 0,
                    ]);
                    $out[] = $p;
                }
            }
        }
        return $out;
    }

    private function seedOrders(array $farmers, array $products): void
    {
        if (empty($farmers) || empty($products)) return;

        $statuses = ['Processing', 'Shipped', 'Delivered', 'Delivered', 'Completed'];
        foreach (range(1, 80) as $i) {
            $farmer = $farmers[array_rand($farmers)];
            $picks = (array) array_rand($products, min(mt_rand(1, 4), count($products)));

            $subtotal = 0;
            $items = [];
            foreach ($picks as $idx) {
                /** @var Product $p */
                $p = $products[$idx];
                $qty = mt_rand(1, 3);
                $lineTotal = (float) $p->price * $qty;
                $subtotal += $lineTotal;
                $items[] = [
                    'product_id' => $p->id,
                    'vendor_id' => $p->vendor_id,
                    'product_name' => $p->name,
                    'quantity' => $qty,
                    'unit_price' => $p->price,
                    'line_total' => $lineTotal,
                ];
            }

            $order = Order::create([
                'user_id' => $farmer->id,
                'subtotal' => $subtotal,
                'delivery_cost' => 5000,
                'total' => $subtotal + 5000,
                'currency' => 'TZS',
                'status' => $statuses[array_rand($statuses)],
                'channel' => 'online',
                'delivery_option_id' => 'standard',
                'payment_method_id' => ['mpesa', 'card', 'cod'][array_rand(['mpesa', 'card', 'cod'])],
                'created_at' => now()->subDays(mt_rand(0, 30))->subHours(mt_rand(0, 23)),
            ]);
            foreach ($items as $row) {
                OrderItem::create(array_merge(['order_id' => $order->id], $row));
            }
        }
    }

    private function seedReviews(array $farmers, array $vendors): void
    {
        if (empty($farmers) || empty($vendors)) return;

        $comments = [
            'Germination was excellent and yield was strong even with the dry spell.',
            'Fast delivery and the agronomist even called to follow up. Will buy again.',
            'Good prices but the staff at the counter could be friendlier.',
            'Best agrovet in the region. Always has stock when others run out.',
            'Used their fertilizer this season and my maize is the best on the road.',
        ];
        foreach (range(1, 60) as $_) {
            $vendor = $vendors[array_rand($vendors)];
            $farmer = $farmers[array_rand($farmers)];
            Review::create([
                'vendor_id' => $vendor->id,
                'user_id' => $farmer->id,
                'user_name' => $farmer->name,
                'rating' => mt_rand(3, 5),
                'comment' => $comments[array_rand($comments)],
                'created_at' => now()->subDays(mt_rand(0, 90)),
            ]);
        }
    }

    private function seedTools(array $vendors): void
    {
        if (empty($vendors)) return;

        $tools = [
            ['Tractor John Deere 5050D', 60000, 'Tractor'],
            ['Power Tiller 13 HP', 25000, 'Tillage'],
            ['Maize Sheller', 15000, 'Harvester'],
            ['Seed Drill', 12000, 'Seeding'],
            ['Disc Plough 3-disc', 18000, 'Tillage'],
            ['Combine Harvester (rental)', 120000, 'Harvester'],
            ['Knapsack Sprayer', 1500, 'Other'],
            ['Hand Cultivator', 800, 'Tillage'],
        ];
        $availability = ['Available', 'Available', 'Available', 'Rented Out'];
        foreach ($tools as [$name, $rate, $cat]) {
            $owner = $vendors[array_rand($vendors)];
            Tool::create([
                'owner_id' => $owner->id,
                'name' => $name,
                'description' => "{$name} available for short-term rental, on-site pickup or delivery.",
                'daily_rate' => $rate,
                'availability' => $availability[array_rand($availability)],
                'category' => $cat,
            ]);
        }
    }
}
