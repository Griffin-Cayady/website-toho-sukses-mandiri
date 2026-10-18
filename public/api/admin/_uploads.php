<?php
// Photo files in UPLOAD_DIR. The database stores the path relative to it, e.g. "category_image/Oli Sugimura.png",
// which the site turns into a URL with NEXT_PUBLIC_IMAGE_BASE_URL.

declare(strict_types=1);

const UPLOAD_KINDS = ['products', 'categories'];
// The subfolder of UPLOAD_DIR each kind is saved in.
const UPLOAD_FOLDERS = ['products' => 'product_image', 'categories' => 'category_image'];
const UPLOAD_MAX_BYTES = 5 * 1024 * 1024;
const UPLOAD_TYPES = ['image/jpeg' => 'jpg', 'image/png' => 'png', 'image/webp' => 'webp'];

// Uploads only serve images: no scripts run there and the folder cannot be listed. Recreated if a deploy removed it.
const UPLOAD_HTACCESS = <<<'HTACCESS'
Options -Indexes -ExecCGI
RemoveHandler .php .phtml .php3 .php4 .php5 .php7 .php8 .phar
<FilesMatch "\.(?i:php\d?|phtml|phar|cgi|pl|py|sh)$">
  Require all denied
</FilesMatch>
<IfModule mod_headers.c>
  Header set X-Content-Type-Options nosniff
  Header set Cache-Control "public, max-age=86400"
</IfModule>
HTACCESS;

// Characters kept from an uploaded file's own name; anything else (slashes, dots, &, #, %, accents…) becomes "-".
// No dots, so a name like "x.php.png" can never look like a script to the web server.
const UPLOAD_NAME_CHARS = 'A-Za-z0-9 _()-';
const UPLOAD_NAME_MAX = 150;

function ensure_upload_dir(string $kind): string
{
    $dir = UPLOAD_DIR . '/' . UPLOAD_FOLDERS[$kind];
    if (!is_dir($dir)) mkdir($dir, 0755, true);
    if (@file_get_contents(UPLOAD_DIR . '/.htaccess') !== UPLOAD_HTACCESS . "\n") file_put_contents(UPLOAD_DIR . '/.htaccess', UPLOAD_HTACCESS . "\n");
    return $dir;
}

// The uploaded file's own name, made safe for links and servers, e.g. "Sugilube AW-68 (2).png". A name already
// taken here or on the Hostinger mirror gets a number ("Sugilube AW-68 (2)-2.png"), so no photo is ever replaced.
function upload_name(string $kind, string $original, string $extension): string
{
    $base = pathinfo(basename($original), PATHINFO_FILENAME);
    $base = preg_replace('/[^' . UPLOAD_NAME_CHARS . ']+/', '-', $base);
    $base = preg_replace('/([ _-])\1+/', '$1', $base);
    $base = trim(substr(trim($base, ' _-'), 0, UPLOAD_NAME_MAX), ' _-');
    if ($base === '') $base = 'foto';
    // Keep the name's own extension when it fits the real file type (photo.jpeg stays .jpeg).
    $own = strtolower(pathinfo($original, PATHINFO_EXTENSION));
    if ($own === $extension || ($extension === 'jpg' && $own === 'jpeg')) $extension = $own;

    $folder = UPLOAD_FOLDERS[$kind];
    for ($n = 1; ; $n++) {
        $name = $n === 1 ? "$base.$extension" : "$base-$n.$extension";
        if (!is_file(UPLOAD_DIR . "/$folder/$name") && !mirror_exists("$folder/$name")) return $name;
    }
}

// True for a file this API uploaded (safe name, allowed type) that still exists.
function is_upload_path(string $kind, string $path): bool
{
    $name = '[A-Za-z0-9_()-][' . UPLOAD_NAME_CHARS . ']*\.(jpg|jpeg|png|webp)';
    return (bool) preg_match('#^' . UPLOAD_FOLDERS[$kind] . '/' . $name . '$#', $path) && is_file(UPLOAD_DIR . '/' . $path);
}

// Deletes an uploaded photo. Values the API did not upload (e.g. full URLs typed into phpMyAdmin) are left alone.
function delete_upload(?string $path): void
{
    if (!$path) return;
    foreach (UPLOAD_KINDS as $kind) {
        if (is_upload_path($kind, $path)) {
            unlink(UPLOAD_DIR . '/' . $path);
            try {
                mirror_delete($path);
            } catch (RuntimeException $e) {
                // The row is already saved; a leftover file on Hostinger only wastes space, so it is just logged.
                error_log('[toho-api] ' . $e->getMessage());
            }
            return;
        }
    }
}

// Mirror on Hostinger: when toho-db-config.php has an 'ftp' entry (only on the local dev PC), every photo saved in
// UPLOAD_DIR is also sent over FTP to the same path under ftp.dir, and deleted there with it. On Hostinger itself
// the API writes straight into public_html, so the entry is left out there.

// Sends one file to the mirror, e.g. mirror_put("category_image/<32 hex>.png"). Throws RuntimeException on failure.
function mirror_put(string $path): void
{
    if (!mirror_config()) return;
    static $htaccessChecked = false;
    if (!$htaccessChecked) {
        $htaccessChecked = true;
        if (!mirror_exists('.htaccess')) mirror_upload('.htaccess', UPLOAD_HTACCESS . "\n");
    }
    $contents = file_get_contents(UPLOAD_DIR . '/' . $path);
    if ($contents === false) throw new RuntimeException("mirror: cannot read $path");
    mirror_upload($path, $contents);
}

function mirror_delete(string $path): void
{
    $ftp = mirror_config();
    if (!$ftp) return;
    // DELE runs right after login, before any folder change, so it takes the path from the login folder.
    $target = ltrim(trim($ftp['dir'] ?? '', '/') . '/' . $path, '/');
    mirror_request('', [CURLOPT_NOBODY => true, CURLOPT_QUOTE => ["DELE $target"]]);
}

function mirror_config(): ?array
{
    global $config;
    return $config['ftp'] ?? null;
}

function mirror_exists(string $path): bool
{
    if (!mirror_config()) return false;
    try {
        mirror_request($path, [CURLOPT_NOBODY => true]);
        return true;
    } catch (RuntimeException) {
        return false;
    }
}

function mirror_upload(string $path, string $contents): void
{
    $stream = fopen('php://temp', 'r+');
    fwrite($stream, $contents);
    rewind($stream);
    try {
        mirror_request($path, [
            CURLOPT_UPLOAD => true,
            CURLOPT_INFILE => $stream,
            CURLOPT_INFILESIZE => strlen($contents),
            CURLOPT_FTP_CREATE_MISSING_DIRS => CURLFTP_CREATE_DIR,
        ]);
    } finally {
        fclose($stream);
    }
}

// One FTP command against ftp.dir/$path (a trailing "/" means a folder). Uses TLS unless ftp.tls is false.
function mirror_request(string $path, array $options): void
{
    $ftp = mirror_config();
    // FTP URL paths are relative to the folder the FTP account logs in to.
    $segments = array_filter(explode('/', trim($ftp['dir'] ?? '', '/') . '/' . $path), 'strlen');
    $port = $ftp['port'] ?? 21;
    // Hostinger's FTP certificate is for *.hstgr.io, not ftp.<domain>: connect to ftp.host but check the
    // certificate against ftp.tls_name (e.g. srv1417.hstgr.io), so it is still fully verified.
    $host = $ftp['tls_name'] ?? $ftp['host'];
    $url = sprintf('ftp://%s:%d/%s', $host, $port, implode('/', array_map('rawurlencode', $segments)));
    if (str_ends_with($path, '/')) $url .= '/';

    $curl = curl_init($url);
    if ($host !== $ftp['host']) curl_setopt($curl, CURLOPT_RESOLVE, ["$host:$port:" . gethostbyname($ftp['host'])]);
    curl_setopt_array($curl, $options + [
        CURLOPT_USERPWD => $ftp['username'] . ':' . $ftp['password'],
        CURLOPT_USE_SSL => ($ftp['tls'] ?? true) ? CURLUSESSL_ALL : CURLUSESSL_NONE,
        // PHP on Windows ships without a CA list; trust the certificate authorities Windows trusts.
        CURLOPT_SSL_OPTIONS => CURLSSLOPT_NATIVE_CA,
        CURLOPT_CONNECTTIMEOUT => 10,
        CURLOPT_TIMEOUT => 60,
        CURLOPT_RETURNTRANSFER => true,
    ]);
    $ok = curl_exec($curl) !== false;
    $error = curl_error($curl);
    if (!$ok) throw new RuntimeException("mirror: $path: $error");
}

// A form's photo list: each entry must be a value the row already had, or a file uploaded through upload.php.
function photo_list(mixed $value, string $kind, array $current, int $max, array &$errors, string $key): array
{
    if ($value === null) return [];
    if (!is_array($value)) {
        $errors[$key] = 'Data foto tidak valid.';
        return [];
    }
    $photos = array_values(array_unique(array_filter($value, fn ($p) => is_string($p) && $p !== '')));
    if (count($photos) > $max) $errors[$key] = "Maksimal $max foto.";
    foreach ($photos as $photo) {
        if (!in_array($photo, $current, true) && !is_upload_path($kind, $photo)) {
            $errors[$key] = 'Ada foto yang tidak ditemukan. Unggah ulang fotonya.';
        }
    }
    return array_slice($photos, 0, $max);
}
