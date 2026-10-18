<?php
// Back office login: session, CSRF and login throttling, shared by every /api/admin/ endpoint.
// Admins are tbl_user rows with user_category = '1'; `password` holds a password_hash() (bcrypt) hash.

declare(strict_types=1);
require __DIR__ . '/../_bootstrap.php';

const ADMIN_CATEGORY = '1';
const SESSION_IDLE_SECONDS = 8 * 3600;
const MAX_LOGIN_FAILURES = 5;
const LOCK_SECONDS = 15 * 60;

$https = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') || ($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https';
ini_set('session.use_strict_mode', '1');
session_name('toho_admin');
// Only sent to the admin API, never readable by page scripts, never sent from other sites.
session_set_cookie_params(['lifetime' => 0, 'path' => '/api/admin/', 'secure' => $https, 'httponly' => true, 'samesite' => 'Strict']);
session_start();

function end_admin_session(): void
{
    $_SESSION = [];
    $params = session_get_cookie_params();
    setcookie(session_name(), '', ['expires' => time() - 3600] + array_intersect_key($params, array_flip(['path', 'secure', 'httponly', 'samesite'])));
    session_destroy();
}

// The logged-in admin, or null. Re-reads tbl_user so a deleted or re-categorised account loses access straight away.
function current_admin(): ?array
{
    $id = $_SESSION['admin_id'] ?? null;
    if (!$id) return null;
    if (time() - ($_SESSION['last_seen'] ?? 0) > SESSION_IDLE_SECONDS) {
        end_admin_session();
        return null;
    }
    $stmt = db()->prepare('SELECT id, user_code, name, username, password FROM tbl_user WHERE id = ? AND user_category = ?');
    $stmt->execute([$id, ADMIN_CATEGORY]);
    $user = $stmt->fetch();
    if (!$user) {
        end_admin_session();
        return null;
    }
    $_SESSION['last_seen'] = time();
    return $user;
}

// Stops with 401 unless an admin is logged in, and with 403 when a change request lacks the CSRF token.
function require_admin(): array
{
    $user = current_admin();
    if (!$user) send_json(401, ['error' => 'Sesi berakhir. Silakan masuk kembali.']);
    if (in_array($_SERVER['REQUEST_METHOD'] ?? '', ['POST', 'PUT', 'DELETE'], true)) require_csrf();
    return $user;
}

function csrf_token(): string
{
    return $_SESSION['csrf'] ??= bin2hex(random_bytes(32));
}

function require_csrf(): void
{
    $sent = $_SERVER['HTTP_X_CSRF_TOKEN'] ?? '';
    if (!isset($_SESSION['csrf']) || !hash_equals($_SESSION['csrf'], $sent)) {
        send_json(403, ['error' => 'Token keamanan tidak valid. Muat ulang halaman.']);
    }
}

// user_update written whenever an admin inserts or edits a row: their tbl_user.user_code (e.g. 001GRIFFIN), which
// the category list joins back to tbl_user for the name. user_code may be empty, so the username stands in.
function user_update_value(array $user): string
{
    $code = trim((string) ($user['user_code'] ?? ''));
    return $code !== '' ? $code : $user['username'];
}

function public_user(array $user): array
{
    return ['name' => $user['name'], 'username' => $user['username']];
}

// Failed logins per IP + username, in PRIVATE_DIR/login-attempts (outside the web root).
function attempts_file(string $username): string
{
    $dir = PRIVATE_DIR . '/login-attempts';
    if (!is_dir($dir)) mkdir($dir, 0700, true);
    return $dir . '/' . hash('sha256', ($_SERVER['REMOTE_ADDR'] ?? '') . '|' . mb_strtolower($username)) . '.json';
}

function read_attempts(string $username): array
{
    $file = attempts_file($username);
    $data = is_file($file) ? json_decode((string) file_get_contents($file), true) : null;
    return is_array($data) ? $data : ['failures' => 0, 'locked_until' => 0];
}

// Seconds until this IP + username may try again (0 = not locked).
function login_lock_seconds(string $username): int
{
    return max(0, (int) read_attempts($username)['locked_until'] - time());
}

function record_login_failure(string $username): void
{
    $data = read_attempts($username);
    $failures = ($data['locked_until'] ?? 0) > 0 && $data['locked_until'] <= time() ? 1 : $data['failures'] + 1;
    $lockedUntil = $failures >= MAX_LOGIN_FAILURES ? time() + LOCK_SECONDS : 0;
    file_put_contents(attempts_file($username), json_encode(['failures' => $failures, 'locked_until' => $lockedUntil]), LOCK_EX);
}

function clear_login_failures(string $username): void
{
    $file = attempts_file($username);
    if (is_file($file)) unlink($file);
}

// Validation helpers for the product and category forms. Collected errors go back as { fields: { column: message } }.
function text_field(array $input, string $key, int $max, bool $required, array &$errors, string $label): ?string
{
    $value = $input[$key] ?? null;
    $value = is_string($value) ? trim($value) : (is_numeric($value) ? (string) $value : '');
    if ($value === '') {
        if ($required) $errors[$key] = "$label wajib diisi.";
        return null;
    }
    if (mb_strlen($value) > $max) $errors[$key] = "$label maksimal $max karakter.";
    return $value;
}

function flag_field(array $input, string $key): int
{
    return filter_var($input[$key] ?? false, FILTER_VALIDATE_BOOLEAN) ? 1 : 0;
}

function id_param(): int
{
    $id = filter_var($_GET['id'] ?? null, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]);
    if ($id === false) send_json(400, ['error' => 'ID tidak valid.']);
    return $id;
}
