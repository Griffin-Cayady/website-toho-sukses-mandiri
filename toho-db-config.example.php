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

    // LOCAL DEV ONLY (leave out on Hostinger): also send uploaded photos to Hostinger over FTP, so photos added
    // while testing on your PC appear in public_html/TSM_DB_Dev. Details: hPanel -> Files -> FTP Accounts.
    // 'dir' is relative to the folder the FTP account opens in; check it in an FTP client if photos land elsewhere.
    // 'ftp' => [
    //     'host' => 'ftp.your-domain.com',
    //     'port' => 21,
    //     'username' => 'u123456789',
    //     'password' => 'your-ftp-password',
    //     'dir' => 'public_html/TSM_DB_Dev',
    //     'tls' => true,
    //     'tls_name' => 'srv1417.hstgr.io', // Hostinger's FTP certificate is for *.hstgr.io, not ftp.<domain>
    // ],
];
