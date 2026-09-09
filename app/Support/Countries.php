<?php

namespace App\Support;

class Countries
{
    public const PH = 'PH';

    /**
     * @return array<string, string>
     */
    public static function all(): array
    {
        return config('countries', [self::PH => 'Philippines']);
    }

    /**
     * Philippines first, then A–Z.
     *
     * @return array<string, string>
     */
    public static function options(): array
    {
        $all = self::all();
        $ph = [self::PH => $all[self::PH] ?? 'Philippines'];
        $rest = $all;
        unset($rest[self::PH]);
        asort($rest);

        return $ph + $rest;
    }

    public static function normalize(?string $code): string
    {
        $code = strtoupper(trim((string) $code));

        return $code !== '' ? $code : self::PH;
    }

    public static function name(?string $code): string
    {
        $code = self::normalize($code);

        return self::all()[$code] ?? $code;
    }

    public static function isDomestic(?string $code): bool
    {
        return self::normalize($code) === self::PH;
    }

    public static function isKnown(?string $code): bool
    {
        return array_key_exists(self::normalize($code), self::all());
    }
}
