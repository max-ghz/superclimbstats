-- SQL statements to generate a fresh database schema for testing

CREATE TABLE IF NOT EXISTS servers (
    id     INTEGER PRIMARY KEY,
    server TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS users (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    username        TEXT    UNIQUE NOT NULL,
    gold_global          INTEGER DEFAULT 0,
    silver_global        INTEGER DEFAULT 0,
    bronze_global        INTEGER DEFAULT 0,
    no_medal_global      INTEGER DEFAULT 0,
    unique_caps_global   INTEGER DEFAULT 0,
    total_caps_global    INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS server_profiles (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id        INTEGER NOT NULL REFERENCES users(id),
    server_id      INTEGER NOT NULL REFERENCES servers(id),
    created_at     INTEGER,
    last_active_at INTEGER,
    gold           INTEGER DEFAULT 0,
    silver         INTEGER DEFAULT 0,
    bronze         INTEGER DEFAULT 0,
    no_medal       INTEGER DEFAULT 0,
    unique_caps    INTEGER DEFAULT 0,
    total_caps     INTEGER DEFAULT 0,
    playtime       INTEGER DEFAULT 0,
    UNIQUE(user_id, server_id)
);

CREATE TABLE IF NOT EXISTS stats (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id     INTEGER NOT NULL REFERENCES users(id),
    map_name    TEXT,
    record_time INTEGER,
    position    INTEGER,
    team        INTEGER,
    server_id   INTEGER NOT NULL REFERENCES servers(id),
    status      INTEGER DEFAULT 1,
    record_date INTEGER
);