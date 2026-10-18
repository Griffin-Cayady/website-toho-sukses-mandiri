<?php
// POST /api/admin/upload.php (multipart: file, kind = products | categories) -> { path }
// The returned path is what the product/category form saves; the file is checked by its contents, not its name,
// and keeps its own (cleaned-up) name, see upload_name().

declare(strict_types=1);
require __DIR__ . '/_auth.php';
require __DIR__ . '/_uploads.php';

require_method('POST');
require_admin();

$kind = $_POST['kind'] ?? '';
if (!in_array($kind, UPLOAD_KINDS, true)) send_json(400, ['error' => 'Jenis unggahan tidak valid.']);

$file = $_FILES['file'] ?? null;
// An oversized POST arrives with no fields at all.
if (!$file || is_array($file['error'])) send_json(400, ['error' => 'Pilih satu file foto.']);
if (in_array($file['error'], [UPLOAD_ERR_INI_SIZE, UPLOAD_ERR_FORM_SIZE], true) || $file['size'] > UPLOAD_MAX_BYTES) {
    send_json(422, ['error' => 'Ukuran foto maksimal 5 MB.']);
}
if ($file['error'] !== UPLOAD_ERR_OK || !is_uploaded_file($file['tmp_name'])) send_json(400, ['error' => 'Foto gagal diunggah. Coba lagi.']);

$type = (new finfo(FILEINFO_MIME_TYPE))->file($file['tmp_name']);
$extension = UPLOAD_TYPES[$type] ?? null;
if (!$extension || !getimagesize($file['tmp_name'])) send_json(422, ['error' => 'Format foto harus JPG, PNG, atau WebP.']);

$name = upload_name($kind, (string) $file['name'], $extension);
if (!move_uploaded_file($file['tmp_name'], ensure_upload_dir($kind) . '/' . $name)) {
    fail('Foto tidak dapat disimpan.', new RuntimeException('move_uploaded_file failed for ' . $kind));
}

$path = UPLOAD_FOLDERS[$kind] . "/$name";
try {
    mirror_put($path);
} catch (RuntimeException $e) {
    // Without the copy on Hostinger the live site would show a broken photo, so the upload fails as a whole.
    unlink(UPLOAD_DIR . '/' . $path);
    fail('Foto tidak dapat dikirim ke server Hostinger. Coba lagi.', $e);
}

send_json(201, ['path' => $path]);
