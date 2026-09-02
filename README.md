# Super Climb Stats
An archive of statistics from recovered legacy servers for the Climb mode in [Soldat](https://soldat.pl) built in vanilla JavaScript, HTML, CSS and PHP for the backend.

## Setup

### Building

Make sure you have [PHP](https://www.php.net) 8.0 (or higher) with the `sqlite3` extension enabled and clone this repository:

```bash
git clone https://github.com/max-ghz/superclimbstats
cd superclimbstats
```

### Running

Create database schema and run the development server:

```bash
sqlite3 global.db < scripts/SCHEMA.sql
sqlite3 global.db < scripts/MOCK_DATA.sql
php -S localhost:8000
```

## Roadmap
- [ ] 404 Not Found page
- [ ] Webkit scrollbar
- [ ] Playtime ranking
- [ ] Events page where players can see when they gained or lost a medal.
- [ ] Medal list where players can view all of their earned medals.
- [ ] After verifying and deleting the records, ensure that `recount.py` follows the defined counting standards.