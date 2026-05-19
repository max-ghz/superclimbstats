<?php
require_once __DIR__ . '/../core/db.php';
require_once __DIR__ . '/../core/cache.php';

header('Content-Type: application/json');

$page = isset($_GET['page']) ? max(1, (int)$_GET['page']) : 1;
$serverId = $_GET['server'] ?? 'all';
$search = trim($_GET['search'] ?? '');

$key = cacheKey('allCaps', ['page' => $page, 'server' => $serverId, 'search' => $search]);
$cached = cacheGet($key);
if ($cached !== null) { echo json_encode($cached); exit; }

$db = getDbConnection();
$perPage = 50;
$offset = ($page - 1) * $perPage;

$conditions = [];
$params = [];
$types = [];

if ($serverId !== 'all' && is_numeric($serverId)) {
    $conditions[] = "s.server_id = ?";
    $params[] = intval($serverId);
    $types[] = SQLITE3_INTEGER;
}
if ($search !== '') {
    $conditions[] = "(u.username LIKE ? ESCAPE '\\' OR s.map_name LIKE ? ESCAPE '\\')";
    $like = '%' . escapeLike($search) . '%';
    $params[] = $like;
    $params[] = $like;
    $types[] = SQLITE3_TEXT;
    $types[] = SQLITE3_TEXT;
}
$whereClause = count($conditions) ? " WHERE " . implode(" AND ", $conditions) : "";

$countSql = "SELECT COUNT(*) as total FROM stats s LEFT JOIN users u ON u.id = s.user_id" . $whereClause;
$countResult  = executePrepared($db, $countSql, $params, $types);
$countRow     = $countResult->fetchArray(SQLITE3_ASSOC);
$totalRecords = $countRow['total'];
$totalPages   = ceil($totalRecords / $perPage);

$allParams = array_merge($params, [$perPage, $offset]);
$allTypes  = array_merge($types,  [SQLITE3_INTEGER, SQLITE3_INTEGER]);

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
" . $whereClause . "
ORDER BY s.record_date DESC
LIMIT ? OFFSET ?
";

$result = executePrepared($db, $sql, $allParams, $allTypes);

$data = fetchAll($result);

foreach ($data as &$row) {
    $row['status'] = match ((int)$row['status']) {
        1 => "VALID",
        2 => "INVALID",
        default => "UNKNOWN"
    };
}

$response = [
    'data' => $data,
    'pagination' => [
        'currentPage' => $page,
        'totalPages' => $totalPages,
        'totalRecords' => $totalRecords,
        'perPage' => $perPage
    ]
];

cacheSet($key, $response, 300);
echo json_encode($response);
