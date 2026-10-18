<?php
// POST /api/contact.php with JSON { name, phone, email, message } -> saves a row in tbl_contact_submissions.
// Same rules as the form's validators in src/views/HomeView.jsx, checked again here because the browser can be bypassed.

declare(strict_types=1);
require __DIR__ . '/_bootstrap.php';

require_method('POST');

$input = json_input();

$field = fn (string $key) => is_string($input[$key] ?? null) ? trim($input[$key]) : '';
$data = [
    'name' => $field('name'),
    'phone' => $field('phone'),
    'email' => $field('email'),
    'message' => $field('message'),
];

$valid = mb_strlen($data['name']) >= 2 && mb_strlen($data['name']) <= 200
    && preg_match('/^\+?[0-9][0-9\s-]{7,17}$/', $data['phone'])
    && filter_var($data['email'], FILTER_VALIDATE_EMAIL) && mb_strlen($data['email']) <= 254
    && mb_strlen($data['message']) >= 10 && mb_strlen($data['message']) <= 5000;
if (!$valid) send_json(422, ['error' => 'Periksa kembali data yang Anda isi.']);

try {
    db()->prepare('INSERT INTO tbl_contact_submissions (name, phone, email, message) VALUES (?, ?, ?, ?)')
        ->execute(array_values($data));
} catch (PDOException $e) {
    fail('Pesan tidak dapat disimpan.', $e);
}

send_json(201, ['ok' => true]);
