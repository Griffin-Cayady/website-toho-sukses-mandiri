<?php
// Copy to toho-db-config.php and fill in the MySQL details from Hostinger hPanel -> Databases -> MySQL Databases.
//   Local dev:  put toho-db-config.php in the project root (it is gitignored and never deployed).
//   Hostinger:  upload it to the folder that CONTAINS public_html (usually domains/<your-domain>/), next to
//               public_html and not inside it, so it can never be downloaded.
return [
    // 'localhost' on Hostinger. For local dev use the remote host shown in hPanel -> Databases -> Remote MySQL
    // (and add your own IP address there first).
    'host' => 'localhost',
    'port' => 3306,
    'database' => 'u123456789_toho',
    'username' => 'u123456789_toho',
    'password' => 'your-database-password',

    // Sites allowed to call the API from another address. Production needs nothing here (same domain).
    'allowed_origins' => ['http://localhost:3000'],

];
