<?php
require_once __DIR__ . '/db.php';
require_once __DIR__ . '/cache.php';

header('Content-Type: application/json');

$serverId = $_GET['server'] ?? 'all';

$key = cacheKey('stats', ['server' => $serverId]);
$cached = cacheGet($key);
if ($cached !== null) { echo json_encode($cached); exit; }

$db = getDbConnection();

if ($serverId !== 'all' && is_numeric($serverId)) {
    $sid = intval($serverId);

    $r = executePrepared($db, "SELECT COUNT(*) FROM stats WHERE server_id = ?", [$sid], [SQLITE3_INTEGER]);
    $totalCaps = (int)($r->fetchArray(SQLITE3_NUM)[0] ?? 0);

    $r = executePrepared($db, "SELECT COUNT(DISTINCT map_name) FROM stats WHERE server_id = ?", [$sid], [SQLITE3_INTEGER]);
    $totalMaps = (int)($r->fetchArray(SQLITE3_NUM)[0] ?? 0);

    $r = executePrepared($db, "SELECT COUNT(DISTINCT user_id) FROM stats WHERE server_id = ?", [$sid], [SQLITE3_INTEGER]);
    $totalPlayers = (int)($r->fetchArray(SQLITE3_NUM)[0] ?? 0);
} else {
    $totalCaps    = (int)$db->querySingle("SELECT COUNT(*) FROM stats");
    $totalMaps    = (int)$db->querySingle("SELECT COUNT(DISTINCT map_name) FROM stats");
    $totalPlayers = (int)$db->querySingle("SELECT COUNT(DISTINCT user_id) FROM stats");
}

$response = [
    'total_caps'    => (int)$totalCaps,
    'total_maps'    => (int)$totalMaps,
    'total_players' => (int)$totalPlayers,
];

cacheSet($key, $response, 300);
echo json_encode($response);