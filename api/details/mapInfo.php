<?php

require_once __DIR__ . '/../core/db.php';
require_once __DIR__ . '/../core/cache.php';

header('Content-Type: application/json');

$map      = $_GET['map'] ?? '';
$page     = max(1, (int)($_GET['page'] ?? 1));
$serverId = $_GET['server'] ?? 'all';

$isSpecificServer = $serverId !== 'all' && is_numeric($serverId);

$key    = cacheKey('mapInfo', ['map' => $map, 'page' => $page, 'server' => $serverId]);
$cached = cacheGet($key);
if ($cached !== null) { echo json_encode($cached); exit; }

$db = getDbConnection();

$limit  = 25;
$offset = ($page - 1) * $limit;

$serverWhere = $isSpecificServer ? "AND server_id = ?" : "";

$countSql = "SELECT COUNT(*) as total FROM stats WHERE map_name = ? $serverWhere";
$stmt = $db->prepare($countSql);
$stmt->bindValue(1, $map, SQLITE3_TEXT);
if ($isSpecificServer) {
    $stmt->bindValue(2, intval($serverId), SQLITE3_INTEGER);
}

$countResult = $stmt->execute();
$totalRow    = $countResult->fetchArray(SQLITE3_ASSOC);
$total       = $totalRow['total'] ?? 0;
$totalPages  = max(1, ceil($total / $limit));

$serverJoinWhere = $isSpecificServer ? "AND s.server_id = ?" : "";

$sql = "
SELECT
    s.record_time,
    s.record_date,
    s.position,
    s.team,
    s.status,
    s.server_id,
    u.username,
    sv.server
FROM stats s
LEFT JOIN users u ON u.id = s.user_id
LEFT JOIN servers sv ON sv.id = s.server_id
WHERE s.map_name = ? $serverJoinWhere
ORDER BY s.record_time ASC
LIMIT ? OFFSET ?
";

$stmt = $db->prepare($sql);
$idx = 1;
$stmt->bindValue($idx++, $map, SQLITE3_TEXT);
if ($isSpecificServer) {
    $stmt->bindValue($idx++, intval($serverId), SQLITE3_INTEGER);
}
$stmt->bindValue($idx++, $limit,  SQLITE3_INTEGER);
$stmt->bindValue($idx,   $offset, SQLITE3_INTEGER);

$result = $stmt->execute();

$data = [];
while ($row = $result->fetchArray(SQLITE3_ASSOC)) {
    $row['status'] = match ((int)$row['status']) {
        1 => "VALID",
        2 => "INVALID",
        default => "UNKNOWN"
    };
    $data[] = $row;
}

$response = [
    'data' => $data,
    'pagination' => [
        'currentPage'  => $page,
        'totalPages'   => $totalPages,
        'totalRecords' => $total
    ]
];

cacheSet($key, $response, 300);
echo json_encode($response);