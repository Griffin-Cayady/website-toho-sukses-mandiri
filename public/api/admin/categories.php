<?php
// /api/admin/categories.php — tbl_product_category for the back office.
//   GET            -> { categories: [...] }  every category with its product_count
//   GET ?id=       -> { category }
//   POST           -> create from JSON       PUT ?id= -> update
//   DELETE ?id=    -> delete; refused (409) while products still use the category
// JSON body: category_name, category_description, image (one path or null), status

declare(strict_types=1);
require __DIR__ . '/_auth.php';
require __DIR__ . '/_uploads.php';

// user_update holds a tbl_user.user_code (unique), so the join adds at most one row: that user's name.
// user_update_name is NULL when nothing matches (e.g. older rows that stored a username or 001SYSTEMS).
const CATEGORY_SELECT = 'SELECT c.id, c.category_name, c.category_description, c.image, c.status, c.user_update, c.last_update,
    u.name AS user_update_name,
    (SELECT COUNT(*) FROM tbl_master_product p WHERE p.product_category = c.id) AS product_count
    FROM tbl_product_category c
    LEFT JOIN tbl_user u ON u.user_code = c.user_update';

$method = require_method('GET', 'POST', 'PUT', 'DELETE');
$admin = require_admin();

function category_out(array $row): array
{
    return [
        'id' => (int) $row['id'],
        'status' => (int) $row['status'] === 1,
        'product_count' => (int) $row['product_count'],
    ] + $row;
}

function find_category(int $id): ?array
{
    $stmt = db()->prepare(CATEGORY_SELECT . ' WHERE c.id = ?');
    $stmt->execute([$id]);
    return $stmt->fetch() ?: null;
}

if ($method === 'GET') {
    if (isset($_GET['id'])) {
        $row = find_category(id_param());
        if (!$row) send_json(404, ['error' => 'Kategori tidak ditemukan.']);
        send_json(200, ['category' => category_out($row)]);
    }
    $rows = db()->query(CATEGORY_SELECT . ' ORDER BY c.id')->fetchAll();
    send_json(200, ['categories' => array_map('category_out', $rows)]);
}

$existing = null;
if ($method !== 'POST') {
    $existing = find_category(id_param());
    if (!$existing) send_json(404, ['error' => 'Kategori tidak ditemukan.']);
}
$currentImage = $existing && $existing['image'] ? [$existing['image']] : [];

if ($method === 'DELETE') {
    $count = (int) $existing['product_count'];
    if ($count > 0) {
        send_json(409, ['error' => "Kategori ini masih dipakai oleh $count produk. Pindahkan atau hapus produknya terlebih dahulu."]);
    }
    db()->prepare('DELETE FROM tbl_product_category WHERE id = ?')->execute([$existing['id']]);
    array_map('delete_upload', $currentImage);
    // Pulls MySQL's counter back to highest id + 1, so rows added in phpMyAdmin don't skip numbers either.
    // Best effort: the back office picks its own ids, so a failure here changes nothing for it.
    try {
        db()->exec('ALTER TABLE tbl_product_category AUTO_INCREMENT = 1');
    } catch (PDOException $e) {
        error_log('[toho-api] AUTO_INCREMENT reset failed: ' . $e->getMessage());
    }
    send_json(200, ['ok' => true]);
}

$input = json_input();
$errors = [];
$image = photo_list(
    array_key_exists('image', $input) && $input['image'] !== null ? [$input['image']] : null,
    'categories', $currentImage, 1, $errors, 'image'
);
$data = [
    'category_name' => text_field($input, 'category_name', 255, true, $errors, 'Nama kategori'),
    'category_description' => text_field($input, 'category_description', 2000, false, $errors, 'Deskripsi'),
    'image' => $image[0] ?? null,
    'status' => flag_field($input, 'status'),
];
if ($errors) send_json(422, ['error' => 'Periksa kembali isian Anda.', 'fields' => $errors]);

$data['user_update'] = user_update_value($admin);
$columns = array_keys($data);
if ($method === 'POST') {
    // The new id is the lowest unused number, so ids never skip: with 1–10 and 9 deleted, the next category gets 9;
    // with no gaps it gets highest + 1. (MySQL's AUTO_INCREMENT never reuses numbers.) FOR UPDATE locks the ids,
    // so two admins saving at the same moment wait for each other instead of picking the same number.
    db()->beginTransaction();
    $taken = db()->query('SELECT id FROM tbl_product_category ORDER BY id FOR UPDATE')->fetchAll(PDO::FETCH_COLUMN);
    $id = 1;
    foreach ($taken as $used) {
        if ((int) $used !== $id) break;
        $id++;
    }
    $sql = 'INSERT INTO tbl_product_category (id, ' . implode(', ', $columns) . ', last_update) VALUES (?, '
        . implode(', ', array_fill(0, count($columns), '?')) . ', NOW())';
    db()->prepare($sql)->execute([$id, ...array_values($data)]);
    db()->commit();
} else {
    $sql = 'UPDATE tbl_product_category SET ' . implode(', ', array_map(fn ($c) => "$c = ?", $columns)) . ', last_update = NOW() WHERE id = ?';
    db()->prepare($sql)->execute([...array_values($data), $existing['id']]);
    $id = (int) $existing['id'];
    array_map('delete_upload', array_diff($currentImage, $image));
}

send_json($method === 'POST' ? 201 : 200, ['category' => category_out(find_category($id))]);
