<?php

use App\Jobs\PurgeExpiredCarts;
use App\Jobs\ReleaseUnpaidOrders;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Schedule::job(new ReleaseUnpaidOrders)->everyFiveMinutes();
Schedule::job(new PurgeExpiredCarts)->daily();
