<?php
// POST /api/admin/login.php { username, password } -> { user, csrfToken } and the session cookie.

declare(strict_types=1);
require __DIR__ . '/_auth.php';

require_method('POST');
$input = json_input();
$username = is_string($input['username'] ?? null) ? trim($input['username']) : '';
$password = is_string($input['password'] ?? null) ? $input['password'] : '';
if ($username === '' || $password === '') send_json(422, ['error' => 'Isi username dan password.']);

$wait = login_lock_seconds($username);
if ($wait > 0) {
    send_json(429, ['error' => sprintf('Terlalu banyak percobaan masuk. Coba lagi dalam %d menit.', (int) ceil($wait / 60))]);
}

$stmt = db()->prepare('SELECT id, name, username, password FROM tbl_user WHERE username = ? AND user_category = ?');
$stmt->execute([$username, ADMIN_CATEGORY]);
$user = $stmt->fetch();

// Hash something even for unknown usernames, so the response time does not reveal which usernames exist.
$valid = password_verify($password, $user['password'] ?? password_hash('not-a-user', PASSWORD_DEFAULT));
if (!$user || !$valid) {
    record_login_failure($username);
    send_json(401, ['error' => 'Username atau password salah.']);
}
clear_login_failures($username);

if (password_needs_rehash($user['password'], PASSWORD_DEFAULT)) {
    db()->prepare('UPDATE tbl_user SET password = ? WHERE id = ?')->execute([password_hash($password, PASSWORD_DEFAULT), $user['id']]);
}

// New session ID at login, so an ID planted before login is worthless.
session_regenerate_id(true);
$_SESSION = ['admin_id' => $user['id'], 'last_seen' => time()];

send_json(200, ['user' => public_user($user), 'csrfToken' => csrf_token()]);
