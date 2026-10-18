<?php
// Sends every photo in public/TSM_DB_Dev to the FTP mirror set in toho-db-config.php ('ftp'), e.g. photos uploaded
// before the mirror was set up. Files already on Hostinger are skipped. Run from the project root:
//   php scripts/sync-uploads.php

declare(strict_types=1);

const UPLOAD_DIR = __DIR__ . '/../public/TSM_DB_Dev';
$config = require __DIR__ . '/../toho-db-config.php';
require __DIR__ . '/../public/api/admin/_uploads.php';

if (!mirror_config()) exit("No 'ftp' entry in toho-db-config.php; nothing to sync.\n");

$sent = $skipped = $failed = 0;
foreach (UPLOAD_FOLDERS as $folder) {
    foreach (glob(UPLOAD_DIR . "/$folder/*.{jpg,jpeg,png,webp}", GLOB_BRACE) ?: [] as $file) {
        $path = $folder . '/' . basename($file);
        if (mirror_exists($path)) {
            $skipped++;
            continue;
        }
        try {
            mirror_put($path);
            echo "sent    $path\n";
            $sent++;
        } catch (RuntimeException $e) {
            echo "FAILED  $path: {$e->getMessage()}\n";
            $failed++;
        }
    }
}
echo "$sent sent, $skipped already on Hostinger, $failed failed\n";
exit($failed ? 1 : 0);
