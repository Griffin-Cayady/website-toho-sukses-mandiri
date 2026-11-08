<?php
// GET /api/catalog.php -> { categories: [...], products: [...], merks: [...], certifications: [...] }
// The active rows (status = 1 / product_status = 1) of tbl_product_category and tbl_master_product,
// plus every tbl_master_merk row (the site lists only the merks its active products use) and every tbl_certification_merk row. Read-only.

declare(strict_types=1);
require __DIR__ . '/_bootstrap.php';

require_method('GET');

try {
    $categories = db()->prepare(
        'SELECT id, category_name, category_description, image
         FROM tbl_product_category WHERE status = 1 ORDER BY id'
    );
    $categories->execute();

    $products = db()->prepare(
        'SELECT id, product_name, product_type_1, product_size,
                product_image_1, product_image_2, product_image_3, product_image_4, product_image_5,
                product_category, product_merk, product_best_selling, product_description
         FROM tbl_master_product WHERE product_status = 1 ORDER BY id'
    );
    $products->execute();

    $merks = db()->prepare('SELECT id, merk_name, merk_description, merk_image, file_catalog_merk FROM tbl_master_merk ORDER BY merk_name');
    $merks->execute();

    $certifications = db()->prepare(
        'SELECT id, merk_id, certification_name, certification_description, certification_image
         FROM tbl_certification_merk ORDER BY id'
    );
    $certifications->execute();
} catch (PDOException $e) {
    fail('Katalog tidak dapat dimuat.', $e);
}

// The site matches products to categories by id, so make sure both are numbers whatever the column type.
$categoryRows = array_map(fn ($row) => ['id' => (int) $row['id']] + $row, $categories->fetchAll());
$productRows = array_map(
    fn ($row) => [
        'id' => (int) $row['id'],
        'product_category' => (int) $row['product_category'],
        'product_merk' => $row['product_merk'] === null ? null : (int) $row['product_merk'],
    ] + $row,
    $products->fetchAll()
);
$merkRows = array_map(fn ($row) => ['id' => (int) $row['id']] + $row, $merks->fetchAll());
$certificationRows = array_map(
    fn ($row) => ['id' => (int) $row['id'], 'merk_id' => (int) $row['merk_id']] + $row,
    $certifications->fetchAll()
);

send_json(200, [
    'categories' => $categoryRows, 'products' => $productRows, 'merks' => $merkRows, 'certifications' => $certificationRows,
]);
