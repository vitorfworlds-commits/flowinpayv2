<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Rede de segurança: reconcilia cobranças com a Woovi (webhooks perdidos) a cada 5 min.
Schedule::command('flowinpay:reconcile')->everyFiveMinutes()->withoutOverlapping();
