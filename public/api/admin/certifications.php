<?php
// /api/admin/certifications.php — tbl_certification_merk (a merk's certifications) for the back office's Sertifikasi page.
// The merk editor (merks.php) edits the same rows as part of its merk; this endpoint edits them one at a time.
//   GET            -> { certifications: [...] }  every certification with its merk_name
//   GET ?id=       -> { certification }
//   POST           -> create from JSON       PUT ?id= -> update       DELETE ?id= -> delete (and its logo file)
// JSON body: merk_id (an existing tbl_master_merk.id; required), certification_name (required), certification_description,
//   certification_image (one path from upload.php kind=certifications, or null)

declare(strict_types=1);
require __DIR__ . '/_auth.php';
require __DIR__ . '/_uploads.php';

// user_update holds a tbl_user.user_code (same join as merks.php); merk_name is null when merk_id points nowhere.
const CERT_SELECT = 'SELECT s.id, s.merk_id, s.certification_name, s.certification_description, s.certification_image,
    s.user_update, s.last_update, u.name AS user_update_name, m.merk_name
    FROM tbl_certification_merk s
    LEFT JOIN tbl_user u ON u.user_code = s.user_update
    LEFT JOIN tbl_master_merk m ON m.id = s.merk_id';

$method = require_method('GET', 'POST', 'PUT', 'DELETE');
$admin = require_admin();

function cert_out(array $row): array
{
    return ['id' => (int) $row['id'], 'merk_id' => $row['merk_id'] === null ? null : (int) $row['merk_id']] + $row;
}

function find_cert(int $id): ?array
{
    $stmt = db()->prepare(CERT_SELECT . ' WHERE s.id = ?');
    $stmt->execute([$id]);
    return $stmt->fetch() ?: null;
}

if ($method === 'GET') {
    if (isset($_GET['id'])) {
        $row = find_cert(id_param());
        if (!$row) send_json(404, ['error' => 'Sertifikasi tidak ditemukan.']);
        send_json(200, ['certification' => cert_out($row)]);
    }
    $rows = db()->query(CERT_SELECT . ' ORDER BY m.merk_name, s.id')->fetchAll();
    send_json(200, ['certifications' => array_map('cert_out', $rows)]);
}

$existing = null;
if ($method !== 'POST') {
    $existing = find_cert(id_param());
    if (!$existing) send_json(404, ['error' => 'Sertifikasi tidak ditemukan.']);
}
$currentImage = $existing && $existing['certification_image'] ? [$existing['certification_image']] : [];

if ($method === 'DELETE') {
    db()->prepare('DELETE FROM tbl_certification_merk WHERE id = ?')->execute([$existing['id']]);
    array_map('delete_upload', $currentImage);
    send_json(200, ['ok' => true]);
}

$input = json_input();
$errors = [];
$image = photo_list(
    array_key_exists('certification_image', $input) && $input['certification_image'] !== null ? [$input['certification_image']] : null,
    'certifications', $currentImage, 1, $errors, 'certification_image'
);
$data = [
    'certification_name' => text_field($input, 'certification_name', 255, true, $errors, 'Nama sertifikasi'),
    'certification_description' => text_field($input, 'certification_description', 2000, false, $errors, 'Keterangan'),
    'certification_image' => $image[0] ?? null,
];

// merk_id: must be an existing tbl_master_merk.id.
$merk = filter_var($input['merk_id'] ?? null, FILTER_VALIDATE_INT);
$merkExists = db()->prepare('SELECT 1 FROM tbl_master_merk WHERE id = ?');
$merkExists->execute([$merk === false ? 0 : $merk]);
if ($merk === false || !$merkExists->fetchColumn()) $errors['merk_id'] = 'Pilih brand.';
$data['merk_id'] = $merk === false ? null : $merk;

if ($errors) send_json(422, ['error' => 'Periksa kembali isian Anda.', 'fields' => $errors]);

$data['user_update'] = user_update_value($admin);
$columns = array_keys($data);
if ($method === 'POST') {
    $sql = 'INSERT INTO tbl_certification_merk (' . implode(', ', $columns) . ', last_update) VALUES ('
        . implode(', ', array_fill(0, count($columns), '?')) . ', NOW())';
    db()->prepare($sql)->execute(array_values($data));
    $id = (int) db()->lastInsertId();
} else {
    $sql = 'UPDATE tbl_certification_merk SET ' . implode(', ', array_map(fn ($c) => "$c = ?", $columns)) . ', last_update = NOW() WHERE id = ?';
    db()->prepare($sql)->execute([...array_values($data), $existing['id']]);
    $id = (int) $existing['id'];
}
// The old logo file is removed only once the row no longer points at it.
array_map('delete_upload', array_diff($currentImage, $image));

send_json($method === 'POST' ? 201 : 200, ['certification' => cert_out(find_cert($id))]);
