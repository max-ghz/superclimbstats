<?php
require_once __DIR__ . '/db.php';
require_once __DIR__ . '/cache.php';

header('Content-Type: application/json');

$key = cacheKey('servers');
$cached = cacheGet($key);
if ($cached !== null) { echo json_encode($cached); exit; }

$db = getDbConnection();

$sql = "
SELECT
    id,
    server AS name
FROM servers
ORDER BY id
";

$result = executeQuery($db, $sql);

$data = fetchAll($result);

cacheSet($key, $data, 3600);
echo json_encode($data);
