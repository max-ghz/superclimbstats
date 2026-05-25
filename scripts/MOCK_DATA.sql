-- Temporary mock data for testing database
-- sqlite3 global.db < SCHEMA.sql
-- sqlite3 global.db < MOCK_DATA.sql

INSERT INTO servers (id, server) VALUES
    (1, 'public_server'),
    (2, 'secret_server'),
    (3, 'new_server'),
    (4, 'temp_server'),
    (5, 'private_server'),
    (6, 'old_server');

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
    (2, 2),
    (3, 3),
    (4, 3),
    (1, 4),
    (2, 5),
    (3, 6),
    (4, 6);

-- record_time in ms, record_date as Unix timestamp, position=0 (recount.py recalculates)
-- record_date as Unix timestamps (2024-01-15, 2024-02-01, 2024-03-01, 2024-04-01)
INSERT INTO stats (user_id, map_name, record_time, position, team, server_id, record_date) VALUES
    (1, 'kz_badlands', 10000, 0, 1, 1, 1705276800),
    (1, 'kz_badlands', 11500, 0, 2, 1, 1706745600),
    (2, 'kz_badlands', 12000, 0, 1, 1, 1705276800),
    (3, 'kz_badlands', 15000, 0, 1, 1, 1705276800),
    (4, 'kz_badlands', 18000, 0, 2, 1, 1705276800),
    (2, 'kz_badlands',  9000, 0, 1, 2, 1706745600),
    (1, 'kz_badlands', 11000, 0, 2, 2, 1706745600),
    (2, 'kz_process',  8000, 0, 1, 1, 1709251200),
    (1, 'kz_process',  9000, 0, 2, 1, 1709251200),
    (3, 'kz_process', 11000, 0, 1, 1, 1709251200),
    (3, 'kz_snakewater',  7000, 0, 2, 1, 1711929600),
    (4, 'kz_snakewater',  8000, 0, 1, 1, 1711929600),
    (1, 'kz_snakewater', 10000, 0, 2, 1, 1711929600),
    (3, 'kz_badlands',  11000, 0, 1, 3, 1714521600),
    (4, 'kz_badlands',  13000, 0, 2, 3, 1714521600),
    (1, 'kz_process',    7500, 0, 1, 4, 1717200000),
    (2, 'kz_snakewater', 6500, 0, 1, 5, 1719792000),
    (3, 'kz_badlands',  12000, 0, 2, 6, 1722470400),
    (4, 'kz_badlands',  14000, 0, 1, 6, 1722470400);