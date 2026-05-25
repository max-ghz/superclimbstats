"""
Script for recounting positions in stats, aggregates in server_profiles and global medals in users.
This is a must to run after manually deleting or adding records in the stats table.

How to use: ./recount.py [path_to_global.db]
"""

import sqlite3
import sys
from pathlib import Path

DB_PATH = Path(sys.argv[1]) if len(sys.argv) > 1 else Path("global.db")


class Database:
    def __init__(self, db_path: Path) -> None:
        self.conn = sqlite3.connect(db_path)
        self.cur = self.conn.cursor()
        self.conn.execute("PRAGMA journal_mode=WAL")

    def commit(self) -> None:
        self.conn.commit()

    def close(self) -> None:
        self.conn.close()


class PositionsRecounter:
    def __init__(self, db: Database) -> None:
        self.db = db

    def run(self) -> int:
        """
        Recalculates the position column in stats per (map_name, server_id).

        For each map on each server, finds each player's best time, then ranks
        players by that time. All rows for a player on a given map/server get
        the same rank (1 = fastest = gold).
        """
        # One row per (user, map, server) holding their rank in a temp table
        self.db.cur.execute("DROP TABLE IF EXISTS temp._ranked_positions")
        self.db.cur.execute("""
            CREATE TEMP TABLE _ranked_positions AS
            WITH best AS (
                -- Best (lowest) record_time per player per map per server
                SELECT user_id, map_name, server_id, MIN(record_time) AS best_time
                FROM stats
                GROUP BY user_id, map_name, server_id
            )
            -- Rank players within each (map, server) by their best time
            SELECT user_id, map_name, server_id,
                   RANK() OVER (PARTITION BY map_name, server_id ORDER BY best_time) AS pos
            FROM best
        """)
        self.db.cur.execute("""
            CREATE INDEX temp._idx_rp ON _ranked_positions (user_id, map_name, server_id)
        """)
        # Write the computed rank back to every row in stats
        self.db.cur.execute("""
            UPDATE stats
            SET position = r.pos
            FROM temp._ranked_positions AS r
            WHERE stats.user_id   = r.user_id
              AND stats.map_name  = r.map_name
              AND stats.server_id = r.server_id
        """)
        updated = self.db.cur.rowcount
        self.db.cur.execute("DROP TABLE temp._ranked_positions")
        return updated


class ServerProfilesRecounter:
    def __init__(self, db: Database) -> None:
        self.db = db

    def run(self) -> int:
        """
        Recounts all aggregate columns in server_profiles from the stats table.

        Each row in server_profiles represents one player on one server.
        Updated fields:
          - gold/silver/bronze/no_medal  — distinct maps where the player holds that position
          - unique_caps                  — distinct maps the player has finished
          - total_caps                   — total number of cap records
          - playtime                     — sum of record_time converted to seconds
          - created_at/last_active_at    — first and last record_date on that server
        """
        self.db.cur.execute("""
            UPDATE server_profiles
            SET
                last_active_at = agg.last_active_at,
                created_at     = agg.created_at,
                unique_caps    = agg.unique_caps,
                total_caps     = agg.total_caps,
                playtime       = agg.playtime,
                gold           = agg.gold,
                silver         = agg.silver,
                bronze         = agg.bronze,
                no_medal       = agg.no_medal
            FROM (
                SELECT
                    user_id,
                    server_id,
                    MAX(record_date)                                          AS last_active_at,
                    MIN(record_date)                                          AS created_at,
                    COUNT(DISTINCT map_name)                                  AS unique_caps,
                    COUNT(*)                                                  AS total_caps,
                    COALESCE(SUM(record_time) / 1000, 0)                     AS playtime,
                    COUNT(DISTINCT CASE WHEN position = 1 THEN map_name END) AS gold,
                    COUNT(DISTINCT CASE WHEN position = 2 THEN map_name END) AS silver,
                    COUNT(DISTINCT CASE WHEN position = 3 THEN map_name END) AS bronze,
                    COUNT(DISTINCT CASE WHEN position > 3 THEN map_name END) AS no_medal
                FROM stats
                GROUP BY user_id, server_id
            ) AS agg
            WHERE server_profiles.user_id   = agg.user_id
              AND server_profiles.server_id = agg.server_id
        """)
        return self.db.cur.rowcount


class GlobalMedalsRecounter:
    def __init__(self, db: Database) -> None:
        self.db = db

    def run(self) -> int:
        """
        Recounts the global (combined) medal columns in the users table.

        Unlike per-server medals, global medals rank each player's best time
        across all servers combined. A player's best run on any server counts,
        so if they have a faster time on server A than server B for the same map,
        only the server-A time is used for the global rank.

        Result is written to: gold_global, silver_global, bronze_global, no_medal_global.
        """
        self.db.cur.execute("""
            WITH best AS (
                -- Best time per player per map, ignoring which server it came from
                SELECT user_id, map_name, MIN(record_time) AS best_time
                FROM stats
                GROUP BY user_id, map_name
            ),
            ranked AS (
                -- Global rank within each map (cross-server)
                SELECT user_id,
                       RANK() OVER (PARTITION BY map_name ORDER BY best_time) AS pos
                FROM best
            ),
            medals AS (
                -- Count how many maps each player holds at each global rank
                SELECT user_id,
                    SUM(CASE WHEN pos = 1 THEN 1 ELSE 0 END) AS gold,
                    SUM(CASE WHEN pos = 2 THEN 1 ELSE 0 END) AS silver,
                    SUM(CASE WHEN pos = 3 THEN 1 ELSE 0 END) AS bronze,
                    SUM(CASE WHEN pos  > 3 THEN 1 ELSE 0 END) AS no_medal
                FROM ranked
                GROUP BY user_id
            ),
            caps AS (
                -- Global unique/total caps (each map counted once regardless of server)
                SELECT user_id,
                    COUNT(DISTINCT map_name) AS unique_caps_global,
                    COUNT(*)                 AS total_caps_global
                FROM stats
                GROUP BY user_id
            )
            UPDATE users SET
                gold_global        = COALESCE((SELECT gold              FROM medals WHERE medals.user_id = users.id), 0),
                silver_global      = COALESCE((SELECT silver            FROM medals WHERE medals.user_id = users.id), 0),
                bronze_global      = COALESCE((SELECT bronze            FROM medals WHERE medals.user_id = users.id), 0),
                no_medal_global    = COALESCE((SELECT no_medal          FROM medals WHERE medals.user_id = users.id), 0),
                unique_caps_global = COALESCE((SELECT unique_caps_global FROM caps  WHERE caps.user_id   = users.id), 0),
                total_caps_global  = COALESCE((SELECT total_caps_global  FROM caps  WHERE caps.user_id   = users.id), 0)
        """)
        return self.db.cur.rowcount


class StatsRecounter:
    def __init__(self, db: Database) -> None:
        self.db = db
        self.positions       = PositionsRecounter(db)
        self.server_profiles = ServerProfilesRecounter(db)
        self.global_medals   = GlobalMedalsRecounter(db)

    def summary(self) -> None:
        self.db.cur.execute("SELECT COUNT(*) FROM stats")
        n_stats = self.db.cur.fetchone()[0]
        self.db.cur.execute("SELECT COUNT(*) FROM server_profiles WHERE total_caps > 0")
        n_active = self.db.cur.fetchone()[0]
        self.db.cur.execute("SELECT SUM(gold_global), SUM(silver_global), SUM(bronze_global) FROM users")
        g, s, b = self.db.cur.fetchone()
        print(f"  stats:               {n_stats:>8,}")
        print(f"  active profiles:     {n_active:>8,}")
        print(f"  gold/silver/bronze:  {g:>8,} / {s:,} / {b:,}")


def main() -> None:
    if not DB_PATH.exists():
        print(f"Error: database not found at {DB_PATH}", file=sys.stderr)
        sys.exit(1)

    print(f"Database: {DB_PATH.resolve()}")

    db = Database(DB_PATH)
    r  = StatsRecounter(db)

    print("1/3  Recounting positions in stats...")
    r.positions.run()
    print("     Done")

    print("2/3  Recounting caps, medals & timestamps in server_profiles...")
    r.server_profiles.run()
    print("     Done")

    print("3/3  Recounting global medals in users...")
    r.global_medals.run()
    print("     Done")

    db.commit()

    print("\nSummary:")
    r.summary()
    db.close()
    print("\nRecounting stats done successfully.")


if __name__ == "__main__":
    main()