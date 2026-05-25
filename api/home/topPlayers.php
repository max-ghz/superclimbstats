<?php
require_once __DIR__ . '/../core/db.php';
require_once __DIR__ . '/../core/cache.php';

header('Content-Type: application/json');

$serverId = $_GET['server'] ?? 'all';
$search   = trim($_GET['search'] ?? '');
$sort     = $_GET['sort'] ?? 'gold';

$key    = cacheKey('topPlayers', ['server' => $serverId, 'search' => $search, 'sort' => $sort]);
$cached = cacheGet($key);
if ($cached !== null) { echo json_encode($cached); exit; }

$db = getDbConnection();

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

    $orderBy = match($sort) {
        'total_caps'  => "sp.total_caps DESC",
        'unique_caps' => "sp.unique_caps DESC",
        default       => "sp.gold DESC, sp.silver DESC, sp.bronze DESC"
    };

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
        LIMIT 10
    ";
} else {
    $whereClause = count($conditions) ? "WHERE " . implode(" AND ", $conditions) : "";

    $orderBy = match($sort) {
        'total_caps'  => "total_caps DESC",
        'unique_caps' => "unique_caps DESC",
        default       => "gold DESC, silver DESC, bronze DESC"
    };

    $sql = "
        SELECT
            u.username,
            u.gold_global          AS gold,
            u.silver_global        AS silver,
            u.bronze_global        AS bronze,
            u.total_caps_global    AS total_caps,
            u.unique_caps_global   AS unique_caps,
            MAX(sp.last_active_at) AS last_active_at
        FROM users u
        JOIN server_profiles sp ON sp.user_id = u.id
        $whereClause
        GROUP BY u.id
        ORDER BY $orderBy
        LIMIT 10
    ";
}

$result = executePrepared($db, $sql, $params, $types);
$data   = fetchAll($result);

cacheSet($key, $data, 300);
echo json_encode($data);
