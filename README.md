# SimpleQuery

A browser-native visual SQL query builder. No backend, no build step, no dependencies to install. Drop `index.html` anywhere and open it.

[![GitHub Pages](https://img.shields.io/badge/hosted-GitHub%20Pages-blue)](https://adambeltz2.github.io/simple-query-builder/)
![Version](https://img.shields.io/badge/version-0.5.1-green)
![License](https://img.shields.io/badge/license-MIT-lightgrey)

**Live app:** [adambeltz2.github.io/simple-query-builder](https://adambeltz2.github.io/simple-query-builder/)

---

## What it does

SimpleQuery lets you import a database schema, visualize tables on a drag-and-drop canvas, draw joins between columns, and build SELECT queries visually — all running entirely in the browser with zero server involvement.

Queries can be run immediately against an in-browser SQLite database powered by [sql.js](https://sql.js.org) (SQLite compiled to WebAssembly).

---

## Features

### Schema Import
- Paste raw `CREATE TABLE` DDL directly, or upload a `.sql` file
- Paste the full output of a `sqlite_master` query (including indexes, triggers, views) — the parser auto-detects the format
- PostgreSQL (`SERIAL`, `::casts`, schema-qualified names) and MySQL (`AUTO_INCREMENT`, `ENGINE=`, backtick identifiers) DDL variants are supported
- Foreign key relationships are detected from inline `REFERENCES` and standalone `CONSTRAINT ... FOREIGN KEY` definitions
- Views and triggers are recognized and catalogued (views shown in the Views tab, triggers silently ignored)
- Re-parsing shows a diff against the previously loaded schema (added/dropped tables and columns)
- Export the parsed schema as JSON, or save it under a name in `localStorage` to reload later
- Get your schema out of a real database with the built-in per-dialect command shown in the schema panel (a `sqlite_master` query, `mysqldump`, or `pg_dump`)

### Visual Canvas
- Drag table cards freely on the canvas; collapse a card to just its header, or color-code it via right-click
- Draw joins by dragging from one column's port dot to another, including composite (multi-column) join keys
- Bezier curves rendered between joined columns with join-type labels
- Zoom in/out, pan with Space+drag; a minimap appears once several tables are on canvas
- Auto Layout arranges tables in a grid; layouts are remembered per schema
- Keyboard-operable: Tab to a table, arrow keys to move it, Delete to remove it; ARIA labels throughout
- Undo/redo (Ctrl+Z / Ctrl+Shift+Z) for table add/remove/move, join changes, and column toggles

### Query Builder
- **FROM** — pick the base table
- **JOIN** — type selector (INNER / LEFT / RIGHT / FULL OUTER / CROSS) with column pickers; syncs with canvas joins
- **SELECT** — checkbox column picker grouped by table, with optional column aliases and aggregate functions (`COUNT`/`SUM`/`AVG`/`MIN`/`MAX`)
- **WHERE** — condition builder with operators (`=`, `!=`, `<`, `>`, `LIKE`, `IN`, `BETWEEN`, `IS NULL`, etc.), AND/OR logic, `(`/`)` grouping, a subquery editor for `IN (...)`, and inline type-mismatch hints
- **GROUP BY / HAVING**
- **ORDER BY / LIMIT / DISTINCT**
- **UNION / UNION ALL** with a second, hand-written query
- Save the current query per-schema (survives a refresh) or share it as a URL

### SQL Dialects
Switch between SQLite, MySQL, and PostgreSQL quoting styles at any time.

### Run Queries
Seed the in-browser SQLite database (Seed DB tab) with `CREATE TABLE` + `INSERT` statements — or drop in an existing `.sqlite`/`.db`/`.sqlite3` file to load its schema and data directly — then run your visually-built query and see results in a live table. Edit a result cell directly (single-table queries) to issue an `UPDATE`, view the `EXPLAIN QUERY PLAN`, export results as CSV or JSON, and revisit past runs from the Query History tab.

### SQL → Visual
Use **↙ Parse SQL** in the topbar to paste any SELECT query and have it reverse-parsed into the visual builder — tables added to canvas, joins drawn, columns checked, WHERE conditions populated. `WITH` CTEs and subqueries in `FROM` are supported as virtual tables; a query referencing a table outside the loaded schema surfaces a warning instead of silently dropping it.

### Look & Feel
Dark theme by default, with a light-mode toggle. The three-panel layout collapses to a mobile-friendly tab bar (Schema / Canvas & Builder / SQL & Results) below 768px.

---

## Getting Started

### Option A — GitHub Pages (recommended)
The hosted app is live at **https://adambeltz2.github.io/simple-query-builder/** — a [GitHub Actions workflow](.github/workflows/deploy.yml) auto-deploys `index.html` on every push to `main`.

To host your own fork:
1. Fork this repo
2. Go to **Settings → Pages** and set Source to **GitHub Actions**
3. Push to `main` (or run the "Deploy to GitHub Pages" workflow manually) — your app will be live at `https://your-username.github.io/simple-query-builder/`

### Option B — Local file
Download `index.html` and open it directly in any modern browser. Works offline except for the sql.js CDN load (one-time network request on first open; after that it's cached).

### Option C — Any static host
Upload `index.html` to any static host (Netlify, Vercel, S3, Cloudflare Pages, etc.). No configuration needed.

---

## Usage

1. **Import schema** — paste DDL or `sqlite_master` output into the left panel, click **Parse**
2. **Add tables to canvas** — click a table card to toggle it on/off the canvas, or click **+ Add All to Canvas**
3. **Draw joins** — drag from a column's dot to another column's dot, or click FK relationship chips in the FK Relationships tab
4. **Build query** — use the builder sections (FROM, Joins, Select Columns, Where, Order/Limit)
5. **Seed DB** — go to the Seed DB tab on the right, paste `CREATE TABLE + INSERT` statements, click **Load into DB**
6. **Run** — click **▶ Run** to execute against the in-browser SQLite and see results

---

## Architecture

Single HTML file. All logic is vanilla JavaScript — no frameworks, no build tooling.

| Concern | Approach |
|---|---|
| SQLite execution | [sql.js](https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.10.2/sql-wasm.js) via CDN |
| Fonts | Google Fonts (Syne + JetBrains Mono) via CDN |
| Everything else | Vanilla JS + CSS, self-contained |

The two CDN dependencies (sql.js + fonts) are the only network requests. The app is fully functional offline once those are cached.

### Key parser design decisions

**sqlite_master format:** The `sql` column in sqlite_master output stores SQL with single quotes doubled (`''` = escaped `'`). Rather than using a regex (which fails on `''` sequences inside CHECK constraints and DEFAULT values), the parser uses a character-level state machine (`extractQuotedValues`) that correctly handles SQLite's quote-escaping rules.

**CREATE TABLE regex:** Uses greedy `[\s\S]+` with `\)\s*$` anchor to match the outermost closing paren of the table body, correctly handling nested parens in CHECK constraints and DEFAULT expressions.

---

## Browser Support

Any modern browser (Chrome, Firefox, Edge, Safari). WebAssembly required for in-browser query execution (available in all modern browsers since 2017).

---

## Contributing

See [BACKLOG.md](BACKLOG.md) for planned features and known issues.

Pull requests welcome. Keep the single-file constraint — all changes must remain within `index.html`.

---

## License

MIT — see [LICENSE](LICENSE) for details.
