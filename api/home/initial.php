<?php
require_once __DIR__ . '/../core/db.php';
require_once __DIR__ . '/../core/cache.php';

header('Content-Type: application/json');

$serverId = $_GET['server'] ?? 'all';

$key = cacheKey('initial', ['server' => $serverId]);
$cached = cacheGet($key);
if ($cached !== null) { echo json_encode($cached); exit; }

$db = getDbConnection();

$whereClause = '';
$params = [];
$types = [];
if ($serverId !== 'all' && is_numeric($serverId)) {
    $whereClause = 'WHERE s.server_id = ?';
    $params[] = intval($serverId);
    $types[] = SQLITE3_INTEGER;
}

$sql = "
SELECT
    s.id,
    s.map_name,
    s.record_time,
    s.position,
    s.team,
    s.status,
    s.record_date,

    s.server_id,
    sv.server AS server,

    u.username
FROM stats s
LEFT JOIN users u ON u.id = s.user_id
LEFT JOIN servers sv ON sv.id = s.server_id
$whereClause
ORDER BY s.record_date ASC
LIMIT 10
";

$result = executePrepared($db, $sql, $params, $types);

$data = fetchAll($result);

foreach ($data as &$row) {
    $row['status'] = match ((int)$row['status']) {
        1 => "VALID",
        2 => "INVALID",
        default => "UNKNOWN"
    };
}

cacheSet($key, $data, 60);
echo json_encode($data);
