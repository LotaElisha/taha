<?php

namespace App\Http\Controllers\Api;

use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;

/**
 * Public product catalog.
 *
 * Search strategy (DESIGN_SPEC §13 carry-over):
 *
 *   1. Empty `q` → simple `category` filter + `latest()` order. Free.
 *   2. With `q`:
 *      a. Full-text — `search_vector @@ plainto_tsquery(...)`, ranked by
 *         ts_rank. Hits the GIN index, ~5 ms on a 100k-row table.
 *      b. If FTS returns zero rows, retry with trigram similarity for typo
 *         tolerance. Hits the trigram GIN index, ~10-50 ms.
 *   3. The caller decides whether to escalate to Gemini for semantic search
 *      (handled separately in AI/SearchController). The product list endpoint
 *      itself never calls Gemini — keeps latency predictable and costs zero.
 */
class ProductController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $vendorCols = ['id', 'name', 'role', 'location', 'lat', 'lon', 'logo_url', 'rating', 'kyc_status'];
        $category = (string) $request->query('category', '');
        $rawSearch = (string) $request->query('q', '');
        $search = trim($rawSearch);

        $baseQuery = fn () => Product::query()
            ->with(['vendor:' . implode(',', $vendorCols)])
            ->when($category && $category !== 'All', fn ($q) => $q->where('category', $category));

        // No search term — newest first.
        if (strlen($search) < 2) {
            return response()->json($baseQuery()->latest()->paginate(perPage: 24));
        }

        // 1. Full-text match, ranked by ts_rank.
        $fts = $baseQuery()
            ->whereRaw("search_vector @@ plainto_tsquery('simple', ?)", [$search])
            ->orderByRaw("ts_rank(search_vector, plainto_tsquery('simple', ?)) DESC", [$search])
            ->paginate(perPage: 24);

        if ($fts->total() > 0) {
            return response()->json($fts);
        }

        // 2. Trigram fuzzy fallback — handles "Karte" → "Karate", "Mais" → "Maize".
        // Similarity threshold 0.2 is tuned for short product names; raise toward
        // 0.4 if false positives become a problem in real traffic.
        $fuzzy = $baseQuery()
            ->whereRaw('similarity(name, ?) > 0.2', [$search])
            ->orderByRaw('similarity(name, ?) DESC', [$search])
            ->paginate(perPage: 24);

        return response()->json($fuzzy);
    }

    public function show(Product $product): JsonResponse
    {
        $product->load(['vendor:id,name,role,location,lat,lon,logo_url,rating,kyc_status']);
        return response()->json(['data' => $product]);
    }

    public function store(Request $request): JsonResponse
    {
        $user = $request->user();
        abort_unless($user, 401);

        $rules = [
            'name' => ['required', 'string', 'min:3', 'max:255'],
            'description' => ['nullable', 'string', 'max:5000'],
            'price' => ['required', 'numeric', 'min:0'],
            'currency' => ['nullable', 'string', 'max:10'],
            'category' => ['required', 'string', 'in:Seeds,Fertilizers,Pesticides,Tools,Animal Medicine,Agrovet Services'],
            'image_url' => ['nullable', 'string', 'max:1000'],
            'stock' => ['required', 'integer', 'min:0'],
            'barcode' => ['nullable', 'string', 'max:64'],
            'is_featured' => ['nullable', 'boolean'],
        ];

        // If the user has administrative privileges, they can specify the vendor.
        // Otherwise, the product belongs to the authenticated user (dealer).
        if ($user->hasRole(['Admin', 'SuperAdmin', 'CatalogManager'])) {
            $rules['vendor_id'] = ['required', 'integer', 'exists:users,id'];
        }

        $data = $request->validate($rules);

        if (!$user->hasRole(['Admin', 'SuperAdmin', 'CatalogManager'])) {
            $data['vendor_id'] = $user->id;
        }

        // Set default currency if not provided
        if (!isset($data['currency'])) {
            $data['currency'] = 'TZS';
        }

        $product = Product::create($data);

        // Load the vendor relationship for consistency
        $product->load(['vendor:id,name,role,location,lat,lon,logo_url,rating,kyc_status']);

        return response()->json(['data' => $product], 201);
    }

    public function update(Request $request, Product $product): JsonResponse
    {
        $user = $request->user();
        abort_unless($user, 401);

        // Policy boundary check: must be owner or administrative staff
        if ($product->vendor_id !== $user->id && !$user->hasRole(['Admin', 'SuperAdmin', 'CatalogManager'])) {
            return response()->json(['message' => 'You do not have permission to update this product.'], 403);
        }

        $rules = [
            'name' => ['sometimes', 'required', 'string', 'min:3', 'max:255'],
            'description' => ['nullable', 'string', 'max:5000'],
            'price' => ['sometimes', 'required', 'numeric', 'min:0'],
            'currency' => ['nullable', 'string', 'max:10'],
            'category' => ['sometimes', 'required', 'string', 'in:Seeds,Fertilizers,Pesticides,Tools,Animal Medicine,Agrovet Services'],
            'image_url' => ['nullable', 'string', 'max:1000'],
            'stock' => ['sometimes', 'required', 'integer', 'min:0'],
            'barcode' => ['nullable', 'string', 'max:64'],
            'is_featured' => ['nullable', 'boolean'],
        ];

        if ($user->hasRole(['Admin', 'SuperAdmin', 'CatalogManager'])) {
            $rules['vendor_id'] = ['sometimes', 'required', 'integer', 'exists:users,id'];
        }

        $data = $request->validate($rules);

        $product->update($data);

        $product->load(['vendor:id,name,role,location,lat,lon,logo_url,rating,kyc_status']);

        return response()->json(['data' => $product]);
    }

    public function destroy(Request $request, Product $product): JsonResponse
    {
        $user = $request->user();
        abort_unless($user, 401);

        // Policy boundary check: must be owner or administrative staff
        if ($product->vendor_id !== $user->id && !$user->hasRole(['Admin', 'SuperAdmin', 'CatalogManager'])) {
            return response()->json(['message' => 'You do not have permission to delete this product.'], 403);
        }

        $product->delete();

        return response()->json(['message' => 'Product deleted successfully.']);
    }
}

