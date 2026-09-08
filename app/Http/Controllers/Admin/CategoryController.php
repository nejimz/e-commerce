<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Product;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class CategoryController extends Controller
{
    public function index(): Response
    {
        $parents = Category::query()
            ->whereNull('parent_id')
            ->withCount('products')
            ->with(['children' => fn ($q) => $q->withCount('products')->orderBy('sort_order')->orderBy('name')])
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get();

        return Inertia::render('admin/categories/index', [
            'categories' => $parents,
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('admin/categories/form', [
            'category' => null,
            'parents' => $this->parentOptions(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $this->validated($request);
        $data['slug'] = Category::uniqueSlug($data['name']);
        $data['image'] = $this->storeImage($request);
        $category = Category::query()->create($data);

        return redirect()->route('admin.categories.edit', $category)->with('success', 'Category created.');
    }

    public function edit(Category $category): Response
    {
        return Inertia::render('admin/categories/form', [
            'category' => [
                ...$category->toArray(),
                'image_url' => $category->imageUrl(),
            ],
            'parents' => $this->parentOptions($category->id),
        ]);
    }

    public function update(Request $request, Category $category): RedirectResponse
    {
        $data = $this->validated($request, $category);
        if ($request->hasFile('image')) {
            $this->deleteStoredImage($category->image);
            $data['image'] = $this->storeImage($request);
        }
        $category->update($data);

        return back()->with('success', 'Category saved.');
    }

    public function destroy(Category $category): RedirectResponse
    {
        if ($category->children()->exists()) {
            return back()->with('error', $category->name.' has subcategories. Move or remove them first.');
        }

        $count = Product::query()->whereIn('category_id', $category->subtreeIds())->count();
        if ($count > 0) {
            return back()->with('error', $category->name.' still has products. Deactivate it or reassign those products first.');
        }

        $this->deleteStoredImage($category->image);
        $category->delete();

        return redirect()->route('admin.categories.index')->with('success', 'Category removed.');
    }

    public function move(Request $request, Category $category): RedirectResponse
    {
        $data = $request->validate([
            'direction' => 'required|in:up,down',
        ]);

        $siblings = Category::query()
            ->where('parent_id', $category->parent_id)
            ->orderBy('sort_order')
            ->orderBy('id')
            ->get();

        $ids = $siblings->pluck('id')->all();
        $index = array_search($category->id, $ids, true);
        $swap = $data['direction'] === 'up' ? $index - 1 : $index + 1;

        if ($index === false || ! isset($ids[$swap])) {
            return back();
        }

        [$ids[$index], $ids[$swap]] = [$ids[$swap], $ids[$index]];

        foreach ($ids as $order => $id) {
            Category::query()->whereKey($id)->update(['sort_order' => $order + 1]);
        }

        return back()->with('success', 'Category order updated.');
    }

    /**
     * @return list<array{id: int, name: string}>
     */
    private function parentOptions(?int $exceptId = null): array
    {
        return Category::query()
            ->whereNull('parent_id')
            ->when($exceptId, fn ($q) => $q->where('id', '!=', $exceptId))
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get(['id', 'name'])
            ->all();
    }

    /**
     * @return array<string, mixed>
     */
    private function validated(Request $request, ?Category $category = null): array
    {
        $data = $request->validate([
            'name' => 'required|string|min:2|max:100',
            'parent_id' => [
                'nullable',
                'integer',
                Rule::exists('categories', 'id')->where(fn ($q) => $q->whereNull('parent_id')->whereNull('deleted_at')),
            ],
            'description' => 'nullable|string|max:2000',
            'image' => 'nullable|image|mimes:jpg,jpeg,png,webp|max:2048',
            'sort_order' => 'nullable|integer|min:0|max:65535',
            'is_active' => 'boolean',
            'meta_title' => 'nullable|string|max:70',
            'meta_description' => 'nullable|string|max:160',
        ]);

        $data['parent_id'] = $data['parent_id'] ?? null;
        $data['is_active'] = $request->exists('is_active') ? $request->boolean('is_active') : true;

        if ($category && $data['parent_id'] && (int) $data['parent_id'] === $category->id) {
            throw ValidationException::withMessages([
                'parent_id' => 'A category cannot be its own parent.',
            ]);
        }

        if ($category && $data['parent_id'] && $category->children()->exists()) {
            throw ValidationException::withMessages([
                'parent_id' => 'Move or empty subcategories first. Categories are limited to two levels.',
            ]);
        }

        if (! $request->filled('sort_order')) {
            $data['sort_order'] = (int) Category::query()
                ->where('parent_id', $data['parent_id'])
                ->max('sort_order') + 1;
        } else {
            $data['sort_order'] = (int) $data['sort_order'];
        }

        unset($data['image']);

        return $data;
    }

    private function storeImage(Request $request): ?string
    {
        if (! $request->hasFile('image')) {
            return null;
        }

        return $request->file('image')->store('categories', 'public');
    }

    private function deleteStoredImage(?string $path): void
    {
        if ($path && Storage::disk('public')->exists($path)) {
            Storage::disk('public')->delete($path);
        }
    }
}
