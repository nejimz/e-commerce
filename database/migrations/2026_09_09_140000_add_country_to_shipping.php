<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        $legacyAreas = ! Schema::hasColumn('delivery_areas', 'country_code');
        if ($legacyAreas) {
            Schema::table('delivery_areas', function (Blueprint $table) {
                $table->char('country_code', 2)->default('PH')->after('id');
                $table->index('country_code');
            });
            Schema::table('delivery_areas', function (Blueprint $table) {
                $table->string('province')->nullable()->change();
                $table->string('city')->nullable()->change();
                $table->string('postal_code', 16)->nullable()->change();
            });
        }

        if (! Schema::hasColumn('delivery_areas', 'free_shipping_eligible')) {
            Schema::table('delivery_areas', function (Blueprint $table) {
                $table->boolean('free_shipping_eligible')->default(true)->after('delivery_fee');
            });
        }

        if (! Schema::hasColumn('addresses', 'country_code')) {
            Schema::table('addresses', function (Blueprint $table) {
                $table->char('country_code', 2)->default('PH')->after('line2');
                $table->string('postal_code', 16)->change();
                $table->string('province')->nullable()->change();
            });
        }

        if (! Schema::hasColumn('orders', 'shipping_country_code')) {
            Schema::table('orders', function (Blueprint $table) {
                $table->char('shipping_country_code', 2)->default('PH')->after('shipping_line2');
                $table->string('shipping_postal_code', 16)->change();
                $table->string('shipping_phone', 30)->change();
                $table->string('customer_phone', 30)->change();
                $table->string('shipping_province')->nullable()->change();
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('delivery_areas', 'country_code')) {
            Schema::table('delivery_areas', function (Blueprint $table) {
                $table->dropColumn('country_code');
            });
        }
        if (Schema::hasColumn('delivery_areas', 'free_shipping_eligible')) {
            Schema::table('delivery_areas', function (Blueprint $table) {
                $table->dropColumn('free_shipping_eligible');
            });
        }
        if (Schema::hasColumn('addresses', 'country_code')) {
            Schema::table('addresses', function (Blueprint $table) {
                $table->dropColumn('country_code');
            });
        }
        if (Schema::hasColumn('orders', 'shipping_country_code')) {
            Schema::table('orders', function (Blueprint $table) {
                $table->dropColumn('shipping_country_code');
            });
        }
    }
};
