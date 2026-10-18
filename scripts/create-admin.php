<?php
// Back office accounts (tbl_user rows with user_category = '1'). Run from the project root:
//
//   php scripts/create-admin.php <username> "<full name>"   create the account, or reset its password if it exists
//   php scripts/create-admin.php --hash                     print a password hash to paste into tbl_user.password
//                                                           in phpMyAdmin (never store the plain password there)
//
// Uses toho-db-config.php in the project root, so the database must accept this PC (hPanel -> Remote MySQL).

declare(strict_types=1);

if (PHP_SAPI !== 'cli') {
    http_response_code(404);
    exit;
}

function ask(string $prompt, bool $secret = false): string
{
    echo $prompt;
    // Hides typing on macOS/Linux. Windows terminals have no portable way to do this, so the password stays visible.
    $hide = $secret && DIRECTORY_SEPARATOR === '/';
    if ($hide) shell_exec('stty -echo');
    $line = rtrim((string) fgets(STDIN), "\r\n");
    if ($hide) {
        shell_exec('stty echo');
        echo "\n";
    }
    return $line;
}

function ask_new_password(): string
{
    while (true) {
        $password = ask('Password (8-72 karakter): ', true);
        if (strlen($password) < 8 || strlen($password) > 72) {
            echo "Password harus 8 sampai 72 karakter.\n";
            continue;
        }
        if (ask('Ulangi password: ', true) === $password) return $password;
        echo "Password tidak sama, coba lagi.\n";
    }
}

$args = array_slice($argv, 1);

if (($args[0] ?? '') === '--hash') {
    echo password_hash(ask_new_password(), PASSWORD_DEFAULT), "\n";
    exit;
}

[$username, $name] = [$args[0] ?? '', $args[1] ?? ''];
if ($username === '') {
    fwrite(STDERR, "Pemakaian: php scripts/create-admin.php <username> \"<nama lengkap>\"\n           php scripts/create-admin.php --hash\n");
    exit(1);
}

$configFile = __DIR__ . '/../toho-db-config.php';
if (!is_file($configFile)) {
    fwrite(STDERR, "toho-db-config.php tidak ditemukan di root proyek.\n");
    exit(1);
}
$config = require $configFile;
$pdo = new PDO(
    sprintf('mysql:host=%s;port=%d;dbname=%s;charset=utf8mb4', $config['host'], $config['port'] ?? 3306, $config['database']),
    $config['username'],
    $config['password'],
    [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC]
);

$stmt = $pdo->prepare('SELECT id, name, user_category FROM tbl_user WHERE username = ?');
$stmt->execute([$username]);
$existing = $stmt->fetch();

if ($existing) {
    $note = $existing['user_category'] === '1' ? '' : " (user_category sekarang '{$existing['user_category']}', akan diubah ke '1')";
    if (strtolower(ask("User \"$username\" sudah ada$note. Reset password-nya? [y/N] ")) !== 'y') exit;
    $pdo->prepare("UPDATE tbl_user SET password = ?, user_category = '1', user_update = 'create-admin' WHERE id = ?")
        ->execute([password_hash(ask_new_password(), PASSWORD_DEFAULT), $existing['id']]);
    echo "Password untuk \"$username\" sudah diganti.\n";
    exit;
}

if ($name === '') $name = ask('Nama lengkap: ');
$pdo->prepare("INSERT INTO tbl_user (name, username, password, user_category, user_update) VALUES (?, ?, ?, '1', '001SYSTEMS')")
    ->execute([$name, $username, password_hash(ask_new_password(), PASSWORD_DEFAULT)]);
echo "Akun back office \"$username\" sudah dibuat.\n";
