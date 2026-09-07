<?php

namespace App\Enums;

enum PaymentMethod: string
{
    case Cod = 'cod';
    case Paymongo = 'paymongo';
}
