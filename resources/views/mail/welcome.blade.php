<x-mail::message>
# Welcome, {{ $user->name }}

Your account is ready. You can save addresses and reorder from your account.

<x-mail::button :url="url('/shop')">
Start shopping
</x-mail::button>

Thanks,<br>
{{ config('app.name') }}
</x-mail::message>
