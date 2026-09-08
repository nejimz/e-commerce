<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Brand;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class BrandController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('admin/brands/index', [
            'brands' => Brand::query()
                ->withCount('products')
                ->orderBy('name')
                ->get(),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('admin/brands/form', [
            'brand' => null,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $this->validated($request);
        $data['slug'] = Brand::uniqueSlug($data['name']);
        $data['logo'] = $this->storeLogo($request);
        $brand = Brand::query()->create($data);

        return redirect()->route('admin.brands.edit', $brand)->with('success', 'Brand created.');
    }

    public function edit(Brand $brand): Response
    {
        return Inertia::render('admin/brands/form', [
            'brand' => [
                ...$brand->toArray(),
                'logo_url' => $brand->logoUrl(),
            ],
        ]);
    }

    public function update(Request $request, Brand $brand): RedirectResponse
    {
        $data = $this->validated($request);
        if ($request->hasFile('logo')) {
            $this->deleteStoredLogo($brand->logo);
            $data['logo'] = $this->storeLogo($request);
        }
        $brand->update($data);

        return back()->with('success', 'Brand saved.');
    }

    public function destroy(Brand $brand): RedirectResponse
    {
        if ($brand->products()->exists()) {
            return back()->with('error', $brand->name.' still has products. Deactivate it or reassign those products first.');
        }

        $this->deleteStoredLogo($brand->logo);
        $brand->delete();

        return redirect()->route('admin.brands.index')->with('success', 'Brand removed.');
    }

    /**
     * @return array<string, mixed>
     */
    private function validated(Request $request): array
    {
        $data = $request->validate([
            'name' => 'required|string|min:2|max:100',
            'description' => 'nullable|string|max:2000',
            'logo' => 'nullable|image|mimes:jpg,jpeg,png,webp|max:2048',
            'is_active' => 'boolean',
            'meta_title' => 'nullable|string|max:70',
            'meta_description' => 'nullable|string|max:160',
        ]);

        $data['is_active'] = $request->exists('is_active') ? $request->boolean('is_active') : true;
        unset($data['logo']);

        return $data;
    }

    private function storeLogo(Request $request): ?string
    {
        if (! $request->hasFile('logo')) {
            return null;
        }

        return $request->file('logo')->store('brands', 'public');
    }

    private function deleteStoredLogo(?string $path): void
    {
        if ($path && Storage::disk('public')->exists($path)) {
            Storage::disk('public')->delete($path);
        }
    }
}
