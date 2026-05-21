-- Temporary mock data for testing database
-- sqlite3 database.db < SCHEMA.sql
-- sqlite3 database.db < MOCK_DATA.sql

INSERT INTO servers (id, server) VALUES
    (1, 'public_server'),
    (2, 'secret_server');

INSERT INTO users (id, username) VALUES
    (1, 'alpha'),
    (2, 'bravo'),
    (3, 'charlie'),
    (4, 'delta');

-- Aggregates intentionally zeroed out, recount.py fills them in
INSERT INTO server_profiles (user_id, server_id) VALUES
    (1, 1),
    (2, 1),
    (3, 1),
    (4, 1),
    (1, 2),
    (2, 2);

-- record_time in milliseconds. position=0 everywhere; recount.py recalculates
-- record_date as Unix timestamps (2024-01-15, 2024-02-01, 2024-03-01, 2024-04-01)

-- kz_badlands / server 1  →  alpha=1st  bravo=2nd  charlie=3rd  delta=4th
INSERT INTO stats (user_id, map_name, record_time, position, team, server_id, record_date) VALUES
    (1, 'kz_badlands', 10000, 0, 1, 1, 1705276800),
    (1, 'kz_badlands', 11500, 0, 0, 1, 1706745600), -- alpha's slower second run (same map/server)
    (2, 'kz_badlands', 12000, 0, 0, 1, 1705276800),
    (3, 'kz_badlands', 15000, 0, 1, 1, 1705276800),
    (4, 'kz_badlands', 18000, 0, 0, 1, 1705276800);

-- kz_badlands / server 2  →  bravo=1st  alpha=2nd  (bravo's 9000 beats his server-1 time globally)
INSERT INTO stats (user_id, map_name, record_time, position, team, server_id, record_date) VALUES
    (2, 'kz_badlands',  9000, 0, 1, 2, 1706745600),
    (1, 'kz_badlands', 11000, 0, 0, 2, 1706745600);

-- kz_process / server 1  →  bravo=1st  alpha=2nd  charlie=3rd
INSERT INTO stats (user_id, map_name, record_time, position, team, server_id, record_date) VALUES
    (2, 'kz_process',  8000, 0, 1, 1, 1709251200),
    (1, 'kz_process',  9000, 0, 0, 1, 1709251200),
    (3, 'kz_process', 11000, 0, 1, 1, 1709251200);

-- kz_snakewater / server 1  →  charlie=1st  delta=2nd  alpha=3rd
INSERT INTO stats (user_id, map_name, record_time, position, team, server_id, record_date) VALUES
    (3, 'kz_snakewater',  7000, 0, 0, 1, 1711929600),
    (4, 'kz_snakewater',  8000, 0, 1, 1, 1711929600),
    (1, 'kz_snakewater', 10000, 0, 0, 1, 1711929600);