<?php
// /api/admin/messages.php — tbl_contact_submissions (the website's contact form) for the back office inbox.
//   GET            -> { messages: [...] }  every message, newest first
//   DELETE ?id=    -> delete one message
// Messages are only written by /api/contact.php, so there is no create or edit here.

declare(strict_types=1);
require __DIR__ . '/_auth.php';

$method = require_method('GET', 'DELETE');
require_admin();

if ($method === 'GET') {
    // category holds a tbl_product_category.id (NULL = the visitor didn't pick one); category_name is NULL when that
    // category has since been deleted.
    $rows = db()->query(
        'SELECT m.id, m.name, m.email, m.phone, m.message, m.created_at, m.category, c.category_name
         FROM tbl_contact_submissions m
         LEFT JOIN tbl_product_category c ON c.id = m.category
         ORDER BY m.created_at DESC, m.id DESC'
    )->fetchAll();
    send_json(200, ['messages' => array_map(
        fn ($row) => ['id' => (int) $row['id'], 'category' => $row['category'] === null ? null : (int) $row['category']] + $row,
        $rows
    )]);
}

$stmt = db()->prepare('DELETE FROM tbl_contact_submissions WHERE id = ?');
$stmt->execute([id_param()]);
if ($stmt->rowCount() === 0) send_json(404, ['error' => 'Pesan tidak ditemukan.']);
send_json(200, ['ok' => true]);
