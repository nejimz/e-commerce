<?php

namespace App\Enums;

enum UserRole: string
{
    case Customer = 'customer';
    case Staff = 'staff';
    case Admin = 'admin';

    public function isStaff(): bool
    {
        return $this === self::Staff || $this === self::Admin;
    }

    public function isAdmin(): bool
    {
        return $this === self::Admin;
    }
}
