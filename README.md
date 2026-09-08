# QueryCraft

A browser-native visual SQL query builder. No backend, no build step, no dependencies to install. Drop `index.html` anywhere and open it.

[![GitHub Pages](https://img.shields.io/badge/hosted-GitHub%20Pages-blue)](https://your-username.github.io/querycraft)
![Version](https://img.shields.io/badge/version-0.4.4-green)
![License](https://img.shields.io/badge/license-MIT-lightgrey)

---

## What it does

QueryCraft lets you import a database schema, visualize tables on a drag-and-drop canvas, draw joins between columns, and build SELECT queries visually — all running entirely in the browser with zero server involvement.

Queries can be run immediately against an in-browser SQLite database powered by [sql.js](https://sql.js.org) (SQLite compiled to WebAssembly).

---

## Features

### Schema Import
- Paste raw `CREATE TABLE` DDL directly
- Paste the full output of a `sqlite_master` query (including indexes, triggers, views) — the parser auto-detects the format
- Foreign key relationships are detected from inline `REFERENCES` and standalone `CONSTRAINT ... FOREIGN KEY` definitions
- Views and triggers are recognized and catalogued (views shown in the Views tab, triggers silently ignored)

To get your full schema from SQLite:
```sql
SELECT type, name, tbl_name, sql
FROM sqlite_master
WHERE sql IS NOT NULL
ORDER BY type, name;
```

### Visual Canvas
- Drag table cards freely on the canvas
- Draw joins by dragging from one column's port dot to another
- Bezier curves rendered between joined columns with join-type labels
- Zoom in/out, pan with Space+drag
- Auto Layout arranges tables in a grid

### Query Builder
- **FROM** — pick the base table
- **JOIN** — type selector (INNER / LEFT / RIGHT / FULL OUTER / CROSS) with column pickers; syncs with canvas joins
- **SELECT** — checkbox column picker grouped by table; click columns on canvas nodes to toggle
- **WHERE** — condition builder with operators (`=`, `!=`, `<`, `>`, `LIKE`, `IN`, `IS NULL`, etc.) and AND/OR logic
- **ORDER BY / LIMIT / DISTINCT**

### SQL Dialects
Switch between SQLite, MySQL, and PostgreSQL quoting styles at any time.

### Run Queries
Seed the in-browser SQLite database (Seed DB tab) with `CREATE TABLE` + `INSERT` statements, then run your visually-built query and see results in a live table.

### SQL → Visual
Use **↙ Parse SQL** in the topbar to paste any SELECT query and have it reverse-parsed into the visual builder — tables added to canvas, joins drawn, columns checked, WHERE conditions populated.

---

## Getting Started

### Option A — GitHub Pages (recommended)
1. Fork or clone this repo
2. Go to **Settings → Pages**
3. Set source to the `main` branch, root folder
4. Your app is live at `https://your-username.github.io/querycraft`

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
