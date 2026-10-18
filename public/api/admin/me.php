<?php
// GET /api/admin/me.php -> { user, csrfToken } when logged in, 401 otherwise. The back office calls it on page load.

declare(strict_types=1);
require __DIR__ . '/_auth.php';

require_method('GET');
$user = require_admin();
send_json(200, ['user' => public_user($user), 'csrfToken' => csrf_token()]);
