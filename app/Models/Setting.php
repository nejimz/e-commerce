<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Cache;

class Setting extends Model
{
    public $timestamps = false;

    protected $fillable = ['key', 'value', 'type', 'group'];

    public static function get(string $key, mixed $default = null): mixed
    {
        $settings = Cache::remember('shop.settings', 60, function () {
            return static::query()->pluck('value', 'key')->all();
        });

        if (! array_key_exists($key, $settings)) {
            return $default;
        }

        $raw = $settings[$key];

        return match (true) {
            $raw === '1' || $raw === 'true' => true,
            $raw === '0' || $raw === 'false' => false,
            is_numeric($raw) && ! str_contains((string) $raw, '.') => (int) $raw,
            is_numeric($raw) => (float) $raw,
            default => $raw,
        };
    }

    public static function put(string $key, mixed $value, string $type = 'string', string $group = 'general'): void
    {
        if (is_bool($value)) {
            $value = $value ? '1' : '0';
            $type = 'boolean';
        }

        static::query()->updateOrCreate(
            ['key' => $key],
            ['value' => (string) $value, 'type' => $type, 'group' => $group],
        );

        Cache::forget('shop.settings');
    }
}
