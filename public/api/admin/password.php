<?php
// POST /api/admin/password.php { current, new } -> changes the logged-in admin's password.

declare(strict_types=1);
require __DIR__ . '/_auth.php';

require_method('POST');
$user = require_admin();
$input = json_input();
$current = is_string($input['current'] ?? null) ? $input['current'] : '';
$new = is_string($input['new'] ?? null) ? $input['new'] : '';

if (!password_verify($current, $user['password'])) {
    send_json(422, ['error' => 'Periksa kembali isian Anda.', 'fields' => ['current' => 'Password saat ini salah.']]);
}
// bcrypt only uses the first 72 bytes.
if (strlen($new) < 8 || strlen($new) > 72) {
    send_json(422, ['error' => 'Periksa kembali isian Anda.', 'fields' => ['new' => 'Password baru harus 8 sampai 72 karakter.']]);
}

db()->prepare('UPDATE tbl_user SET password = ?, user_update = ? WHERE id = ?')
    ->execute([password_hash($new, PASSWORD_DEFAULT), user_update_value($user), $user['id']]);

send_json(200, ['ok' => true]);
