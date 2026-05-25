<?php
require_once __DIR__ . '/../core/db.php';
require_once __DIR__ . '/../core/cache.php';

header('Content-Type: application/json');

$page     = isset($_GET['page']) ? max(1, (int)$_GET['page']) : 1;
$serverId = $_GET['server'] ?? 'all';
$search   = trim($_GET['search'] ?? '');
$sort     = $_GET['sort'] ?? 'gold';

$key    = cacheKey('allPlayers', ['page' => $page, 'server' => $serverId, 'search' => $search, 'sort' => $sort]);
$cached = cacheGet($key);
if ($cached !== null) { echo json_encode($cached); exit; }

$db      = getDbConnection();
$perPage = 50;
$offset  = ($page - 1) * $perPage;

$conditions = [];
$params     = [];
$types      = [];

if ($search !== '') {
    $conditions[] = "u.username LIKE ? ESCAPE '\\'";
    $params[]     = '%' . escapeLike($search) . '%';
    $types[]      = SQLITE3_TEXT;
}

$isSpecificServer = $serverId !== 'all' && is_numeric($serverId);

if ($isSpecificServer) {
    $conditions[] = "sp.server_id = ?";
    $params[]     = intval($serverId);
    $types[]      = SQLITE3_INTEGER;

    $whereClause = count($conditions) ? "WHERE " . implode(" AND ", $conditions) : "";

    $countSql    = "SELECT COUNT(*) AS total FROM server_profiles sp JOIN users u ON u.id = sp.user_id $whereClause";
    $countResult = executePrepared($db, $countSql, $params, $types);
    $countRow    = $countResult->fetchArray(SQLITE3_ASSOC);
    $totalRecords = $countRow['total'];

    $orderBy = match($sort) {
        'total_caps'  => "sp.total_caps DESC",
        'unique_caps' => "sp.unique_caps DESC",
        default       => "sp.gold DESC, sp.silver DESC, sp.bronze DESC"
    };

    $allParams = array_merge($params, [$perPage, $offset]);
    $allTypes  = array_merge($types,  [SQLITE3_INTEGER, SQLITE3_INTEGER]);

    $sql = "
        SELECT
            u.username,
            sp.gold,
            sp.silver,
            sp.bronze,
            sp.total_caps,
            sp.unique_caps,
            sp.last_active_at,
            sp.server_id,
            s.server
        FROM users u
        JOIN server_profiles sp ON sp.user_id = u.id
        JOIN servers s ON s.id = sp.server_id
        $whereClause
        ORDER BY $orderBy
        LIMIT ? OFFSET ?
    ";
} else {
    $whereClause = count($conditions) ? "WHERE " . implode(" AND ", $conditions) : "";

    $countSql    = "SELECT COUNT(DISTINCT u.id) AS total FROM users u JOIN server_profiles sp ON sp.user_id = u.id $whereClause";
    $countResult = executePrepared($db, $countSql, $params, $types);
    $countRow    = $countResult->fetchArray(SQLITE3_ASSOC);
    $totalRecords = $countRow['total'];

    $orderBy = match($sort) {
        'total_caps'  => "total_caps DESC",
        'unique_caps' => "unique_caps DESC",
        default       => "gold DESC, silver DESC, bronze DESC"
    };

    $allParams = array_merge($params, [$perPage, $offset]);
    $allTypes  = array_merge($types,  [SQLITE3_INTEGER, SQLITE3_INTEGER]);

    $sql = "
        SELECT
            u.username,
            u.gold_global          AS gold,
            u.silver_global        AS silver,
            u.bronze_global        AS bronze,
            u.total_caps_global    AS total_caps,
            u.unique_caps_global   AS unique_caps,
            MAX(sp.last_active_at) AS last_active_at,
            CASE WHEN COUNT(DISTINCT sp.server_id) = 1 THEN MIN(sp.server_id) ELSE NULL END AS server_id,
            CASE WHEN COUNT(DISTINCT sp.server_id) = 1 THEN MIN(sv.server)    ELSE NULL END AS server
        FROM users u
        JOIN server_profiles sp ON sp.user_id = u.id
        LEFT JOIN servers sv ON sv.id = sp.server_id
        $whereClause
        GROUP BY u.id
        ORDER BY $orderBy
        LIMIT ? OFFSET ?
    ";
}

$result = executePrepared($db, $sql, $allParams, $allTypes);
$data   = fetchAll($result);

$totalPages = ceil($totalRecords / $perPage);

$response = [
    'data'       => $data,
    'pagination' => [
        'currentPage'  => $page,
        'totalPages'   => $totalPages,
        'totalRecords' => $totalRecords,
        'perPage'      => $perPage
    ]
];

cacheSet($key, $response, 300);
echo json_encode($response);
