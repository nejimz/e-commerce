<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DashboardTest extends TestCase
{
    use RefreshDatabase;

    public function test_guests_are_redirected_to_the_login_page(): void
    {
        $this->get('/dashboard')->assertRedirect('/login');
    }

    public function test_customers_are_redirected_home_from_dashboard(): void
    {
        $this->actingAs(User::factory()->create());

        $this->get('/dashboard')->assertRedirect(route('home'));
    }

    public function test_staff_are_redirected_to_admin(): void
    {
        $this->actingAs(User::factory()->staff()->create());

        $this->get('/dashboard')->assertRedirect(route('admin.dashboard'));
    }
}
