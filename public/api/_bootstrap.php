<?php
// Shared setup for the API endpoints: config, CORS, the MySQL connection and JSON responses.
// The database password lives in toho-db-config.php two folders up from this file, which is
// outside public_html on Hostinger (and the project root locally), so it can never be downloaded.

declare(strict_types=1);

const CONFIG_FILE = __DIR__ . '/../../toho-db-config.php';
// Private files the API writes (login attempt counters) go next to the config, also outside public_html.
const PRIVATE_DIR = __DIR__ . '/../..';
// Uploaded photos: public_html/TSM_DB_Dev on Hostinger, public/TSM_DB_Dev locally (one subfolder per kind, see _uploads.php).
const UPLOAD_DIR = __DIR__ . '/../TSM_DB_Dev';

function send_json(int $status, array $body): never
{
    http_response_code($status);
    echo json_encode($body, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function fail(string $message, ?Throwable $error = null): never
{
    // Details go to the server error log only; visitors get a generic message.
    if ($error) error_log('[toho-api] ' . $error->getMessage());
    send_json(500, ['error' => $message]);
}

// Anything not caught by an endpoint (e.g. a failed query) still answers in JSON, with details only in the log.
set_exception_handler(fn (Throwable $e) => fail('Terjadi kesalahan pada server.', $e));

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');

if (!is_file(CONFIG_FILE)) {
    error_log('[toho-api] Missing ' . CONFIG_FILE);
    send_json(500, ['error' => 'Server belum dikonfigurasi.']);
}
$config = require CONFIG_FILE;

// Production calls come from the same domain and need no CORS. Local `npm run dev` (another origin) does.
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if ($origin !== '' && in_array($origin, $config['allowed_origins'] ?? [], true)) {
    header("Access-Control-Allow-Origin: $origin");
    // Credentials: the back office's session cookie (localhost:3000 -> localhost:8000 in dev).
    header('Access-Control-Allow-Credentials: true');
    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, X-CSRF-Token');
    header('Vary: Origin');
}
if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
    http_response_code(204);
    exit;
}

function db(): PDO
{
    global $config;
    static $pdo = null;
    if ($pdo) return $pdo;
    try {
        $pdo = new PDO(
            sprintf('mysql:host=%s;port=%d;dbname=%s;charset=utf8mb4', $config['host'], $config['port'] ?? 3306, $config['database']),
            $config['username'],
            $config['password'],
            [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                // Real prepared statements, which also return INT columns as numbers instead of strings.
                PDO::ATTR_EMULATE_PREPARES => false,
            ]
        );
    } catch (PDOException $e) {
        fail('Database tidak dapat dihubungi.', $e);
    }
    return $pdo;
}

function require_method(string ...$methods): string
{
    $method = $_SERVER['REQUEST_METHOD'] ?? '';
    if (!in_array($method, $methods, true)) {
        header('Allow: ' . implode(', ', $methods));
        send_json(405, ['error' => 'Method not allowed']);
    }
    return $method;
}

// The request's JSON body as an array (400 if it is not a JSON object).
function json_input(): array
{
    $input = json_decode(file_get_contents('php://input') ?: '', true);
    if (!is_array($input)) send_json(400, ['error' => 'Data tidak valid.']);
    return $input;
}
