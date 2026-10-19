<?php
// /api/admin/merks.php — tbl_master_merk (product brands) for the back office.
//   GET            -> { merks: [...] }  every merk with its product_count
//   GET ?id=       -> { merk }
//   POST           -> create from JSON       PUT ?id= -> update
//   DELETE ?id=    -> delete; refused (409) while products still use the merk (tbl_master_product.product_merk)
// JSON body: merk_name, merk_description

declare(strict_types=1);
require __DIR__ . '/_auth.php';

// Same join as categories.php: user_update holds a tbl_user.user_code, user_update_name is that user's name.
const MERK_SELECT = 'SELECT m.id, m.merk_name, m.merk_description, m.user_update, m.last_update,
    u.name AS user_update_name,
    (SELECT COUNT(*) FROM tbl_master_product p WHERE p.product_merk = m.id) AS product_count
    FROM tbl_master_merk m
    LEFT JOIN tbl_user u ON u.user_code = m.user_update';

$method = require_method('GET', 'POST', 'PUT', 'DELETE');
$admin = require_admin();

function merk_out(array $row): array
{
    return ['id' => (int) $row['id'], 'product_count' => (int) $row['product_count']] + $row;
}

function find_merk(int $id): ?array
{
    $stmt = db()->prepare(MERK_SELECT . ' WHERE m.id = ?');
    $stmt->execute([$id]);
    return $stmt->fetch() ?: null;
}

if ($method === 'GET') {
    if (isset($_GET['id'])) {
        $row = find_merk(id_param());
        if (!$row) send_json(404, ['error' => 'Merk tidak ditemukan.']);
        send_json(200, ['merk' => merk_out($row)]);
    }
    $rows = db()->query(MERK_SELECT . ' ORDER BY m.id')->fetchAll();
    send_json(200, ['merks' => array_map('merk_out', $rows)]);
}

$existing = null;
if ($method !== 'POST') {
    $existing = find_merk(id_param());
    if (!$existing) send_json(404, ['error' => 'Merk tidak ditemukan.']);
}

if ($method === 'DELETE') {
    $count = (int) $existing['product_count'];
    if ($count > 0) {
        send_json(409, ['error' => "Merk ini masih dipakai oleh $count produk. Ganti merk produknya terlebih dahulu."]);
    }
    db()->prepare('DELETE FROM tbl_master_merk WHERE id = ?')->execute([$existing['id']]);
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
$data = [
    'merk_name' => text_field($input, 'merk_name', 100, true, $errors, 'Nama merk'),
    'merk_description' => text_field($input, 'merk_description', 2000, false, $errors, 'Deskripsi'),
];

// merk_name is UNIQUE in the table (case-insensitive collation), so a duplicate gets a field message instead of a 500.
if (!isset($errors['merk_name'])) {
    $taken = db()->prepare('SELECT id FROM tbl_master_merk WHERE merk_name = ? AND id <> ?');
    $taken->execute([$data['merk_name'], $existing['id'] ?? 0]);
    if ($taken->fetchColumn()) $errors['merk_name'] = 'Merk dengan nama ini sudah ada.';
}
if ($errors) send_json(422, ['error' => 'Periksa kembali isian Anda.', 'fields' => $errors]);

$data['user_update'] = user_update_value($admin);
$columns = array_keys($data);
if ($method === 'POST') {
    // The lowest unused id, like categories.php, so ids never skip. FOR UPDATE makes simultaneous saves wait in turn.
    db()->beginTransaction();
    $taken = db()->query('SELECT id FROM tbl_master_merk ORDER BY id FOR UPDATE')->fetchAll(PDO::FETCH_COLUMN);
    $id = 1;
    foreach ($taken as $used) {
        if ((int) $used !== $id) break;
        $id++;
    }
    $sql = 'INSERT INTO tbl_master_merk (id, ' . implode(', ', $columns) . ', last_update) VALUES (?, '
        . implode(', ', array_fill(0, count($columns), '?')) . ', NOW())';
    db()->prepare($sql)->execute([$id, ...array_values($data)]);
    db()->commit();
} else {
    $sql = 'UPDATE tbl_master_merk SET ' . implode(', ', array_map(fn ($c) => "$c = ?", $columns)) . ', last_update = NOW() WHERE id = ?';
    db()->prepare($sql)->execute([...array_values($data), $existing['id']]);
    $id = (int) $existing['id'];
}

send_json($method === 'POST' ? 201 : 200, ['merk' => merk_out(find_merk($id))]);
