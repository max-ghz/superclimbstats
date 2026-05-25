<?php
require_once __DIR__ . '/../core/db.php';
require_once __DIR__ . '/../core/cache.php';

header('Content-Type: application/json');

$username = isset($_GET['username']) ? trim($_GET['username']) : '';
$page     = isset($_GET['page']) ? max(1, (int)$_GET['page']) : 1;
$serverId = isset($_GET['server']) ? trim($_GET['server']) : 'all';

$isSpecificServer = $serverId !== 'all' && is_numeric($serverId);

$key    = cacheKey('playerProfile', ['username' => $username, 'page' => $page, 'server' => $serverId]);
$cached = cacheGet($key);
if ($cached !== null) { echo json_encode($cached); exit; }

$db = getDbConnection();

if (empty($username)) {
    http_response_code(400);
    echo json_encode(["error" => "Username parameter is required"]);
    exit;
}

if ($isSpecificServer) {
    $playerSql = "
        SELECT
            u.id,
            u.username,
            u.gold_global,
            u.silver_global,
            u.bronze_global,
            sp.gold,
            sp.silver,
            sp.bronze,
            sp.no_medal,
            sp.total_caps,
            sp.unique_caps,
            sp.playtime,
            sp.created_at,
            sp.last_active_at
        FROM users u
        JOIN server_profiles sp ON sp.user_id = u.id AND sp.server_id = :server_id
        WHERE u.username = :username
        LIMIT 1
    ";
    $stmt = $db->prepare($playerSql);
    $stmt->bindValue(':username',  $username,         SQLITE3_TEXT);
    $stmt->bindValue(':server_id', intval($serverId), SQLITE3_INTEGER);
} else {
    $playerSql = "
        SELECT
            u.id,
            u.username,
            u.gold_global          AS gold,
            u.silver_global        AS silver,
            u.bronze_global        AS bronze,
            u.no_medal_global      AS no_medal,
            u.total_caps_global    AS total_caps,
            u.unique_caps_global   AS unique_caps,
            SUM(sp.playtime)       AS playtime,
            MIN(sp.created_at)     AS created_at,
            MAX(sp.last_active_at) AS last_active_at
        FROM users u
        JOIN server_profiles sp ON sp.user_id = u.id
        WHERE u.username = :username
        GROUP BY u.id
        LIMIT 1
    ";
    $stmt = $db->prepare($playerSql);
    $stmt->bindValue(':username', $username, SQLITE3_TEXT);
}

$result = $stmt->execute();
$player = $result->fetchArray(SQLITE3_ASSOC);

if (!$player) {
    http_response_code(404);
    echo json_encode(["error" => "Player not found"]);
    exit;
}

// Rank always based on global medals
$goldForRank   = $isSpecificServer ? ($player['gold_global']   ?? 0) : $player['gold'];
$silverForRank = $isSpecificServer ? ($player['silver_global'] ?? 0) : $player['silver'];
$bronzeForRank = $isSpecificServer ? ($player['bronze_global'] ?? 0) : $player['bronze'];

$rankSql = "
    SELECT COUNT(*) + 1 AS rank
    FROM users u1
    WHERE u1.gold_global > :gold
       OR (u1.gold_global = :gold AND u1.silver_global > :silver)
       OR (u1.gold_global = :gold AND u1.silver_global = :silver AND u1.bronze_global > :bronze)
";

$stmtRank = $db->prepare($rankSql);
$stmtRank->bindValue(':gold',   $goldForRank,   SQLITE3_INTEGER);
$stmtRank->bindValue(':silver', $silverForRank, SQLITE3_INTEGER);
$stmtRank->bindValue(':bronze', $bronzeForRank, SQLITE3_INTEGER);
$resultRank     = $stmtRank->execute();
$rankData       = $resultRank->fetchArray(SQLITE3_ASSOC);
$player['rank'] = $rankData['rank'];

// All server profiles for this player (always full list for the dropdown)
$serversSql = "
    SELECT
        sp.server_id,
        s.server,
        sp.gold,
        sp.silver,
        sp.bronze,
        sp.no_medal,
        sp.total_caps,
        sp.unique_caps,
        sp.playtime,
        sp.created_at,
        sp.last_active_at
    FROM server_profiles sp
    JOIN servers s ON s.id = sp.server_id
    WHERE sp.user_id = :user_id
    ORDER BY sp.gold DESC
";

$stmtServers   = $db->prepare($serversSql);
$stmtServers->bindValue(':user_id', $player['id'], SQLITE3_INTEGER);
$resultServers = $stmtServers->execute();
$servers       = fetchAll($resultServers);

// Caps are optionally filtered by server
$perPage = 50;
$offset  = ($page - 1) * $perPage;

$serverCapFilter = $isSpecificServer ? "AND server_id = :server_id_caps" : "";

$stmtCount = $db->prepare("SELECT COUNT(*) AS total FROM stats WHERE user_id = :user_id $serverCapFilter");
$stmtCount->bindValue(':user_id', $player['id'], SQLITE3_INTEGER);
if ($isSpecificServer) {
    $stmtCount->bindValue(':server_id_caps', intval($serverId), SQLITE3_INTEGER);
}
$countData    = $stmtCount->execute()->fetchArray(SQLITE3_ASSOC);
$totalRecords = $countData['total'];
$totalPages   = ceil($totalRecords / $perPage);

$capsSql = "
    WITH map_counts AS (
        SELECT map_name, COUNT(*) AS map_caps_count
        FROM stats
        WHERE user_id = :user_id_mc $serverCapFilter
        GROUP BY map_name
    )
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
        mc.map_caps_count
    FROM stats s
    LEFT JOIN servers sv ON sv.id = s.server_id
    LEFT JOIN map_counts mc ON mc.map_name = s.map_name
    WHERE s.user_id = :user_id $serverCapFilter
    ORDER BY s.record_date DESC
    LIMIT :limit OFFSET :offset
";

$stmtCaps = $db->prepare($capsSql);
$stmtCaps->bindValue(':user_id',    $player['id'], SQLITE3_INTEGER);
$stmtCaps->bindValue(':user_id_mc', $player['id'], SQLITE3_INTEGER);
$stmtCaps->bindValue(':limit',      $perPage,      SQLITE3_INTEGER);
$stmtCaps->bindValue(':offset',     $offset,       SQLITE3_INTEGER);
if ($isSpecificServer) {
    $stmtCaps->bindValue(':server_id_caps', intval($serverId), SQLITE3_INTEGER);
}
$resultCaps = $stmtCaps->execute();

$caps = [];
while ($row = $resultCaps->fetchArray(SQLITE3_ASSOC)) {
    $row['status'] = match ((int)$row['status']) {
        1 => "VALID",
        2 => "INVALID",
        default => "UNKNOWN"
    };
    $caps[] = $row;
}

$response = [
    'player'     => $player,
    'servers'    => $servers,
    'caps'       => $caps,
    'pagination' => [
        'currentPage'  => $page,
        'totalPages'   => $totalPages,
        'totalRecords' => $totalRecords,
        'perPage'      => $perPage
    ]
];

cacheSet($key, $response, 300);
echo json_encode($response);