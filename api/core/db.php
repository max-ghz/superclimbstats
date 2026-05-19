<?php
require_once __DIR__ . '/config.php';

function getDbConnection() {
    if (!file_exists(DB_PATH)) {
        http_response_code(500);
        echo json_encode(["error" => "DB NOT FOUND"]);
        exit;
    }

    $db = new SQLite3(DB_PATH);

    if (!$db) {
        http_response_code(500);
        echo json_encode(["error" => "DB OPEN FAILED"]);
        exit;
    }

    return $db;
}

function executeQuery($db, $sql) {
    $result = $db->query($sql);

    if (!$result) {
        http_response_code(500);
        echo json_encode(["error" => "SQL ERROR"]);
        exit;
    }

    return $result;
}

function executePrepared($db, $sql, $params = [], $types = []) {
    $stmt = $db->prepare($sql);

    if (!$stmt) {
        http_response_code(500);
        echo json_encode(["error" => "SQL ERROR"]);
        exit;
    }

    foreach ($params as $i => $val) {
        $stmt->bindValue($i + 1, $val, $types[$i] ?? SQLITE3_TEXT);
    }

    $result = $stmt->execute();

    if (!$result) {
        http_response_code(500);
        echo json_encode(["error" => "SQL ERROR"]);
        exit;
    }

    return $result;
}

function escapeLike(string $value): string {
    return str_replace(['\\', '%', '_'], ['\\\\', '\\%', '\\_'], $value);
}

function fetchAll($result) {
    $data = [];
    while ($row = $result->fetchArray(SQLITE3_ASSOC)) {
        $data[] = $row;
    }
    return $data;
}
