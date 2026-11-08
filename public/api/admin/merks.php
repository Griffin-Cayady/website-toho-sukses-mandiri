<?php
// /api/admin/merks.php — tbl_master_merk (product brands) for the back office.
//   GET            -> { merks: [...] }  every merk with its product_count
//   GET ?id=       -> { merk }  with merk.certifications (its tbl_certification_merk rows)
//   POST           -> create from JSON       PUT ?id= -> update
//   DELETE ?id=    -> delete, with its certifications; refused (409) while products still use the merk (tbl_master_product.product_merk)
// JSON body: merk_name, merk_description, product_category (the tbl_product_category.id the merk belongs to; required),
//   merk_image (one path from upload.php kind=merks, or null), file_catalog_merk (http(s) link to the catalogue, e.g. Google Drive, or empty),
//   certifications (optional; the merk's full list, replacing the saved one): [{ id (omit for a new one), certification_name,
//   certification_description, certification_image (one path from upload.php kind=certifications, or null) }]

declare(strict_types=1);
require __DIR__ . '/_auth.php';
require __DIR__ . '/_uploads.php';

// Same join as categories.php: user_update holds a tbl_user.user_code, user_update_name is that user's name.
// category_name is the merk's tbl_product_category name (null when product_category is empty or points nowhere).
const MERK_SELECT = 'SELECT m.id, m.merk_name, m.merk_description, m.merk_image, m.file_catalog_merk, m.product_category, m.user_update, m.last_update,
    u.name AS user_update_name, c.category_name,
    (SELECT COUNT(*) FROM tbl_master_product p WHERE p.product_merk = m.id) AS product_count
    FROM tbl_master_merk m
    LEFT JOIN tbl_user u ON u.user_code = m.user_update
    LEFT JOIN tbl_product_category c ON c.id = m.product_category';

$method = require_method('GET', 'POST', 'PUT', 'DELETE');
$admin = require_admin();

function merk_out(array $row): array
{
    return [
        'id' => (int) $row['id'],
        'product_count' => (int) $row['product_count'],
        'product_category' => $row['product_category'] === null ? null : (int) $row['product_category'],
    ] + $row;
}

function find_merk(int $id): ?array
{
    $stmt = db()->prepare(MERK_SELECT . ' WHERE m.id = ?');
    $stmt->execute([$id]);
    return $stmt->fetch() ?: null;
}

// tbl_certification_merk.merk_id -> tbl_master_merk.id
function merk_certifications(int $merkId): array
{
    $stmt = db()->prepare(
        'SELECT id, certification_name, certification_description, certification_image
         FROM tbl_certification_merk WHERE merk_id = ? ORDER BY id'
    );
    $stmt->execute([$merkId]);
    return $stmt->fetchAll();
}

if ($method === 'GET') {
    if (isset($_GET['id'])) {
        $row = find_merk(id_param());
        if (!$row) send_json(404, ['error' => 'Brand tidak ditemukan.']);
        send_json(200, ['merk' => merk_out($row) + ['certifications' => merk_certifications((int) $row['id'])]]);
    }
    $rows = db()->query(MERK_SELECT . ' ORDER BY m.id')->fetchAll();
    send_json(200, ['merks' => array_map('merk_out', $rows)]);
}

$existing = null;
if ($method !== 'POST') {
    $existing = find_merk(id_param());
    if (!$existing) send_json(404, ['error' => 'Brand tidak ditemukan.']);
}
$currentImage = $existing && $existing['merk_image'] ? [$existing['merk_image']] : [];
$existingCerts = $existing ? merk_certifications((int) $existing['id']) : [];
$currentCertImages = array_values(array_filter(array_column($existingCerts, 'certification_image')));

if ($method === 'DELETE') {
    $count = (int) $existing['product_count'];
    if ($count > 0) {
        send_json(409, ['error' => "Brand ini masih dipakai oleh $count produk. Ganti brand produknya terlebih dahulu."]);
    }
    db()->beginTransaction();
    db()->prepare('DELETE FROM tbl_certification_merk WHERE merk_id = ?')->execute([$existing['id']]);
    db()->prepare('DELETE FROM tbl_master_merk WHERE id = ?')->execute([$existing['id']]);
    db()->commit();
    array_map('delete_upload', [...$currentImage, ...$currentCertImages]);
    // Pulls MySQL's counter back to highest id + 1 (see categories.php). Best effort.
    try {
        db()->exec('ALTER TABLE tbl_master_merk AUTO_INCREMENT = 1');
    } catch (PDOException $e) {
        error_log('[toho-api] AUTO_INCREMENT reset failed: ' . $e->getMessage());
    }
    send_json(200, ['ok' => true]);
}

$input = json_input();
$errors = [];
$image = photo_list(
    array_key_exists('merk_image', $input) && $input['merk_image'] !== null ? [$input['merk_image']] : null,
    'merks', $currentImage, 1, $errors, 'merk_image'
);
$data = [
    'merk_name' => text_field($input, 'merk_name', 100, true, $errors, 'Nama brand'),
    'merk_description' => text_field($input, 'merk_description', 2000, false, $errors, 'Deskripsi'),
    'merk_image' => $image[0] ?? null,
    'file_catalog_merk' => text_field($input, 'file_catalog_merk', 2000, false, $errors, 'Link katalog'),
];
// The website shows file_catalog_merk as a "Download Katalog" link, so only an http(s) address is accepted (never javascript: etc.).
if ($data['file_catalog_merk'] !== null && !isset($errors['file_catalog_merk'])) {
    $scheme = strtolower((string) parse_url($data['file_catalog_merk'], PHP_URL_SCHEME));
    if (!filter_var($data['file_catalog_merk'], FILTER_VALIDATE_URL) || !in_array($scheme, ['http', 'https'], true)) {
        $errors['file_catalog_merk'] = 'Masukkan link lengkap yang diawali https://, misalnya link Google Drive.';
    }
}

// product_category: must be an existing tbl_product_category.id (same check as products.php).
$category = filter_var($input['product_category'] ?? null, FILTER_VALIDATE_INT);
$categoryExists = db()->prepare('SELECT 1 FROM tbl_product_category WHERE id = ?');
$categoryExists->execute([$category === false ? 0 : $category]);
if ($category === false || !$categoryExists->fetchColumn()) $errors['product_category'] = 'Pilih kategori.';
$data['product_category'] = $category === false ? null : $category;

// merk_name is UNIQUE in the table (case-insensitive collation), so a duplicate gets a field message instead of a 500.
if (!isset($errors['merk_name'])) {
    $taken = db()->prepare('SELECT id FROM tbl_master_merk WHERE merk_name = ? AND id <> ?');
    $taken->execute([$data['merk_name'], $existing['id'] ?? 0]);
    if ($taken->fetchColumn()) $errors['merk_name'] = 'Brand dengan nama ini sudah ada.';
}

// certifications: null leaves the saved list alone (a body without the key). Each entry keeps its id when it is
// already one of this merk's rows; errors go under one 'certifications' key, naming the entry.
$certs = null;
if (array_key_exists('certifications', $input)) {
    $list = $input['certifications'];
    if (!is_array($list) || !array_is_list($list) || count($list) > 50) {
        $errors['certifications'] = 'Data sertifikasi tidak valid.';
        $list = [];
    }
    $existingCertIds = array_column($existingCerts, 'id');
    $certs = [];
    foreach ($list as $i => $item) {
        $certId = is_array($item) && isset($item['id']) ? filter_var($item['id'], FILTER_VALIDATE_INT) : null;
        if (!is_array($item) || $certId === false || ($certId !== null && !in_array($certId, $existingCertIds, true))) {
            $errors['certifications'] = 'Data sertifikasi tidak valid. Muat ulang halaman lalu coba lagi.';
            continue;
        }
        $certErrors = [];
        $certImage = photo_list(
            isset($item['certification_image']) ? [$item['certification_image']] : null,
            'certifications', $currentCertImages, 1, $certErrors, 'certification_image'
        );
        $cert = [
            'id' => $certId,
            'certification_name' => text_field($item, 'certification_name', 255, true, $certErrors, 'Nama sertifikasi'),
            'certification_description' => text_field($item, 'certification_description', 2000, false, $certErrors, 'Keterangan'),
            'certification_image' => $certImage[0] ?? null,
        ];
        if ($certErrors) $errors['certifications'] = 'Sertifikasi ke-' . ($i + 1) . ': ' . reset($certErrors);
        $certs[] = $cert;
    }
}
if ($errors) send_json(422, ['error' => 'Periksa kembali isian Anda.', 'fields' => $errors]);

$data['user_update'] = user_update_value($admin);
$columns = array_keys($data);
db()->beginTransaction();
if ($method === 'POST') {
    // The lowest unused id, like categories.php, so ids never skip. FOR UPDATE makes simultaneous saves wait in turn.
    $taken = db()->query('SELECT id FROM tbl_master_merk ORDER BY id FOR UPDATE')->fetchAll(PDO::FETCH_COLUMN);
    $id = 1;
    foreach ($taken as $used) {
        if ((int) $used !== $id) break;
        $id++;
    }
    $sql = 'INSERT INTO tbl_master_merk (id, ' . implode(', ', $columns) . ', last_update) VALUES (?, '
        . implode(', ', array_fill(0, count($columns), '?')) . ', NOW())';
    db()->prepare($sql)->execute([$id, ...array_values($data)]);
} else {
    $sql = 'UPDATE tbl_master_merk SET ' . implode(', ', array_map(fn ($c) => "$c = ?", $columns)) . ', last_update = NOW() WHERE id = ?';
    db()->prepare($sql)->execute([...array_values($data), $existing['id']]);
    $id = (int) $existing['id'];
}
if ($certs !== null) {
    // Rows left out of the list are deleted; the rest are updated or inserted, all in the merk's transaction.
    $keep = array_values(array_filter(array_column($certs, 'id')));
    $sql = 'DELETE FROM tbl_certification_merk WHERE merk_id = ?' . ($keep ? ' AND id NOT IN (' . implode(', ', array_fill(0, count($keep), '?')) . ')' : '');
    db()->prepare($sql)->execute([$id, ...$keep]);
    $update = db()->prepare(
        'UPDATE tbl_certification_merk SET certification_name = ?, certification_description = ?, certification_image = ?,
         user_update = ?, last_update = NOW() WHERE id = ? AND merk_id = ?'
    );
    $insert = db()->prepare(
        'INSERT INTO tbl_certification_merk (merk_id, certification_name, certification_description, certification_image, user_update, last_update)
         VALUES (?, ?, ?, ?, ?, NOW())'
    );
    foreach ($certs as $cert) {
        $values = [$cert['certification_name'], $cert['certification_description'], $cert['certification_image'], $data['user_update']];
        $cert['id'] ? $update->execute([...$values, $cert['id'], $id]) : $insert->execute([$id, ...$values]);
    }
}
db()->commit();
// Files are removed only once the rows no longer point at them.
array_map('delete_upload', array_diff($currentImage, $image));
if ($certs !== null) array_map('delete_upload', array_diff($currentCertImages, array_column($certs, 'certification_image')));

send_json($method === 'POST' ? 201 : 200, ['merk' => merk_out(find_merk($id))]);
