<?php
define('CACHE_DIR', sys_get_temp_dir() . '/scs_cache/');

function cacheGet(string $key): mixed {
    // Validate MD5 format to prevent path traversal via crafted cache keys
    if (!preg_match('/^[a-f0-9]{32}$/', $key)) return null;
    $file = CACHE_DIR . $key . '.json';
    if (!file_exists($file)) return null;

    $content = file_get_contents($file);
    if ($content === false) return null;

    $entry = json_decode($content, true);
    if (!is_array($entry) || time() > $entry['expires']) {
        @unlink($file);
        return null;
    }

    return $entry['data'];
}

function cacheSet(string $key, mixed $data, int $ttl): void {
    if (!preg_match('/^[a-f0-9]{32}$/', $key)) return;
    if (!is_dir(CACHE_DIR)) {
        @mkdir(CACHE_DIR, 0700, true);
    }

    $entry = json_encode(['expires' => time() + $ttl, 'data' => $data]);
    @file_put_contents(CACHE_DIR . $key . '.json', $entry, LOCK_EX);
}

function cacheKey(string $endpoint, array $params = []): string {
    ksort($params);
    return md5($endpoint . ':' . json_encode($params));
}
