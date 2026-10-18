<?php
// /api/admin/products.php — tbl_master_product for the back office.
//   GET            -> { products: [...] }   every product, active or not
//   GET ?id=       -> { product }
//   POST           -> create from JSON      PUT ?id= -> update      DELETE ?id= -> delete (and its photo files)
// JSON body: product_name, product_category, product_type_1, product_size, product_description,
//            product_best_selling, product_status, images (up to 5 paths; the first is the card photo)

declare(strict_types=1);
require __DIR__ . '/_auth.php';
require __DIR__ . '/_uploads.php';

const IMAGE_COLUMNS = ['product_image_1', 'product_image_2', 'product_image_3', 'product_image_4', 'product_image_5'];
// user_update holds a tbl_user.user_code (unique), so the join adds at most one row: that user's name.
// user_update_name is NULL when nothing matches (e.g. older rows that stored a username or 001SYSTEMS).
const PRODUCT_SELECT = 'SELECT p.id, p.product_name, p.product_category, p.product_type_1, p.product_size, p.product_description,
    p.product_best_selling, p.product_status, p.product_image_1, p.product_image_2, p.product_image_3, p.product_image_4,
    p.product_image_5, p.user_update, p.last_update, u.name AS user_update_name
    FROM tbl_master_product p
    LEFT JOIN tbl_user u ON u.user_code = p.user_update';

$method = require_method('GET', 'POST', 'PUT', 'DELETE');
$admin = require_admin();

// Row -> API shape: numbers as numbers, the five image columns as one `images` list.
function product_out(array $row): array
{
    $images = array_values(array_filter(array_map(fn ($c) => $row[$c], IMAGE_COLUMNS), fn ($p) => is_string($p) && trim($p) !== ''));
    foreach (IMAGE_COLUMNS as $column) unset($row[$column]);
    return [
        'id' => (int) $row['id'],
        'product_category' => $row['product_category'] === null ? null : (int) $row['product_category'],
        'product_best_selling' => (int) $row['product_best_selling'] === 1,
        'product_status' => (int) $row['product_status'] === 1,
        'images' => $images,
    ] + $row;
}

function find_product(int $id): ?array
{
    $stmt = db()->prepare(PRODUCT_SELECT . ' WHERE p.id = ?');
    $stmt->execute([$id]);
    return $stmt->fetch() ?: null;
}

if ($method === 'GET') {
    if (isset($_GET['id'])) {
        $row = find_product(id_param());
        if (!$row) send_json(404, ['error' => 'Produk tidak ditemukan.']);
        send_json(200, ['product' => product_out($row)]);
    }
    $rows = db()->query(PRODUCT_SELECT . ' ORDER BY p.id')->fetchAll();
    send_json(200, ['products' => array_map('product_out', $rows)]);
}

$existing = null;
if ($method !== 'POST') {
    $existing = find_product(id_param());
    if (!$existing) send_json(404, ['error' => 'Produk tidak ditemukan.']);
}
$currentImages = $existing ? array_values(array_filter(array_map(fn ($c) => $existing[$c], IMAGE_COLUMNS))) : [];

if ($method === 'DELETE') {
    db()->prepare('DELETE FROM tbl_master_product WHERE id = ?')->execute([$existing['id']]);
    array_map('delete_upload', $currentImages);
    send_json(200, ['ok' => true]);
}

// POST / PUT: validate the form.
$input = json_input();
$errors = [];
$data = [
    'product_name' => text_field($input, 'product_name', 255, true, $errors, 'Nama produk'),
    'product_type_1' => text_field($input, 'product_type_1', 255, false, $errors, 'Jenis produk'),
    'product_size' => text_field($input, 'product_size', 255, false, $errors, 'Ukuran'),
    'product_description' => text_field($input, 'product_description', 5000, false, $errors, 'Deskripsi'),
    'product_best_selling' => flag_field($input, 'product_best_selling'),
    'product_status' => flag_field($input, 'product_status'),
];

$category = filter_var($input['product_category'] ?? null, FILTER_VALIDATE_INT);
$categoryExists = db()->prepare('SELECT 1 FROM tbl_product_category WHERE id = ?');
$categoryExists->execute([$category === false ? 0 : $category]);
if ($category === false || !$categoryExists->fetchColumn()) $errors['product_category'] = 'Pilih kategori.';
$data['product_category'] = $category;

$images = photo_list($input['images'] ?? null, 'products', $currentImages, count(IMAGE_COLUMNS), $errors, 'images');
foreach (IMAGE_COLUMNS as $i => $column) $data[$column] = $images[$i] ?? null;

if ($errors) send_json(422, ['error' => 'Periksa kembali isian Anda.', 'fields' => $errors]);

$data['user_update'] = user_update_value($admin);
$columns = array_keys($data);
if ($method === 'POST') {
    $sql = 'INSERT INTO tbl_master_product (' . implode(', ', $columns) . ', last_update) VALUES ('
        . implode(', ', array_fill(0, count($columns), '?')) . ', NOW())';
    db()->prepare($sql)->execute(array_values($data));
    $id = (int) db()->lastInsertId();
} else {
    $sql = 'UPDATE tbl_master_product SET ' . implode(', ', array_map(fn ($c) => "$c = ?", $columns)) . ', last_update = NOW() WHERE id = ?';
    db()->prepare($sql)->execute([...array_values($data), $existing['id']]);
    $id = (int) $existing['id'];
    // Photos taken off the product are deleted from disk once the new list is saved.
    array_map('delete_upload', array_diff($currentImages, $images));
}

send_json($method === 'POST' ? 201 : 200, ['product' => product_out(find_product($id))]);
