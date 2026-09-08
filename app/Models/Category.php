<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

class Category extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'parent_id', 'name', 'slug', 'description', 'image', 'meta_title', 'meta_description', 'sort_order', 'is_active',
    ];

    protected function casts(): array
    {
        return ['is_active' => 'boolean'];
    }

    protected static function booted(): void
    {
        static::creating(function (Category $category) {
            $category->slug ??= Str::slug($category->name);
        });
    }

    public function parent(): BelongsTo
    {
        return $this->belongsTo(self::class, 'parent_id');
    }

    public function children(): HasMany
    {
        return $this->hasMany(self::class, 'parent_id')->orderBy('sort_order');
    }

    public function products(): HasMany
    {
        return $this->hasMany(Product::class);
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public static function uniqueSlug(string $name, ?int $ignoreId = null): string
    {
        $base = Str::slug($name) ?: 'category';
        $slug = $base;
        $n = 2;
        while (static::withTrashed()
            ->where('slug', $slug)
            ->when($ignoreId, fn ($q, $id) => $q->where('id', '!=', $id))
            ->exists()) {
            $slug = $base.'-'.$n;
            $n++;
        }

        return $slug;
    }

    /**
     * @return array<int, int>
     */
    public function subtreeIds(): array
    {
        $ids = [$this->id];
        if (! $this->parent_id) {
            $ids = array_merge($ids, static::query()->where('parent_id', $this->id)->pluck('id')->all());
        }

        return $ids;
    }

    public function storePath(): string
    {
        if ($this->parent_id) {
            $parent = $this->relationLoaded('parent') ? $this->parent : $this->parent()->first();
            if ($parent?->is_active) {
                return '/shop/'.$parent->slug.'/'.$this->slug;
            }
        }

        return '/shop/'.$this->slug;
    }

    public function imageUrl(): ?string
    {
        return $this->image ? asset('storage/'.$this->image) : null;
    }

    /**
     * @return array<int, int>
     */
    public function descendantAndSelfIds(): array
    {
        $ids = [$this->id];
        if (! $this->parent_id) {
            $ids = array_merge($ids, static::query()->active()->where('parent_id', $this->id)->pluck('id')->all());
        }

        return $ids;
    }
}
