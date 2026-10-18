<?php
// POST /api/admin/logout.php -> ends the session.

declare(strict_types=1);
require __DIR__ . '/_auth.php';

require_method('POST');
// An already expired session counts as logged out; a live one needs the CSRF token, so other sites cannot log admins out.
if (current_admin()) require_csrf();
end_admin_session();
send_json(200, ['ok' => true]);
