<?php

use Illuminate\Support\Facades\Route;

// SPA routes — serve the same Blade template for all client-side routes
Route::get('/', fn () => view('welcome'));
Route::get('/dashboard', fn () => view('welcome'));
Route::get('/charges', fn () => view('welcome'));
Route::get('/charges/{id}', fn () => view('welcome'));
Route::get('/transactions', fn () => view('welcome'));
Route::get('/withdrawals', fn () => view('welcome'));
Route::get('/api-keys', fn () => view('welcome'));
Route::get('/fees', fn () => view('welcome'));
Route::get('/account', fn () => view('welcome'));
Route::get('/disputes', fn () => view('welcome'));
Route::get('/acquirers', fn () => view('welcome'));
Route::get('/admin', fn () => view('welcome'));
Route::get('/admin/users', fn () => view('welcome'));
Route::get('/admin/users/{id}', fn () => view('welcome'));
Route::get('/admin/charges', fn () => view('welcome'));
Route::get('/admin/disputes', fn () => view('welcome'));
Route::get('/admin/kyc', fn () => view('welcome'));
Route::get('/admin/audit-logs', fn () => view('welcome'));
Route::get('/login', fn () => view('welcome'));
Route::get('/register', fn () => view('welcome'));
Route::get('/forgot-password', fn () => view('welcome'));
Route::get('/reset-password', fn () => view('welcome'));
Route::get('/pay/{path?}', fn () => view('welcome'))->where('path', '.*');
Route::get('/docs', fn () => view('welcome'));
