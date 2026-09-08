# Changelog

All notable changes to QueryCraft are documented here.  
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).  
Versioning follows [Semantic Versioning](https://semver.org/) from `0.x.y`.

---

## [0.4.4] — 2026-08-26

### Fixed
- **B-001 fixed:** `extractFromSqliteMaster` was double-unescaping the sql column (`vals[3].replace(/''/g, "'").trim()`), corrupting any table with a decoded `''` sequence (e.g. `DEFAULT ''`, `CHECK (... GLOB '...')`) into an unterminated string and desyncing `splitStmts` for every statement after it in the same paste. This is why pastes reported many statements extracted but 0 tables parsed. `extractQuotedValues` already fully decodes `''` -> `'`, so the extra pass is removed. Verified with a 2-table repro before and after the change.

---

## [0.4.3] — 2026-08-26

### Fixed
- Version footer fallback text (`v0.4.1`) no longer ships out of sync with `APP_VERSION` — the placeholder is now blank until the load-time script fills it in from `APP_VERSION`/`BUILD_DATE`

### Investigated
- **B-001 root cause found:** `extractFromSqliteMaster` double-unescapes the `sql` column — `extractQuotedValues` already converts `''` to `'` while extracting, so the extra `.replace(/''/g, "'")` afterward corrupts any statement with a decoded `''` (e.g. `DEFAULT ''`, `CHECK (... GLOB '...')`) into an unterminated string, which desyncs `splitStmts`' quote-tracking for every statement after it in the same paste. One-line fix identified and verified against a minimal repro; not yet applied — see BACKLOG.md B-001.

---

## [0.4.2] — 2025-08-21

### Added
- Detailed `parseDDL` debug instrumentation: console now logs `tblAttempts`, `tblSuccess`, and the exact end-characters of any statement where the CREATE TABLE regex fails — enables precise diagnosis of the sqlite_master table extraction bug (B-001)

### Changed
- `parseDDL` now explicitly identifies and counts each statement type (INDEX, TABLE, TRIGGER, VIEW) separately in debug output
- Unrecognized statements are logged to console rather than silently dropped

### Known Issues
- B-001: sqlite_master format correctly detected and 104 statements extracted, but parseDDL still returns 0 tables. Debug instrumentation in this version is designed to capture the exact failure point.

---

## [0.4.1] — 2025-08-21

### Fixed
- **Critical parser fix:** Replaced regex-based `sqlite_master` SQL extractor with a character-level state machine (`extractQuotedValues`). The previous regex `'([\s\S]+?)'` stopped prematurely on `''` sequences inside SQL bodies (e.g. `DEFAULT ''`, `CHECK (col GLOB ''[A-Z]'')`), causing the extracted SQL to be truncated. The state machine correctly interprets `''` as an escaped single quote per SQLite's escaping rules.
- `CONSTRAINT fk_name FOREIGN KEY` syntax now parsed correctly — the optional `CONSTRAINT name` prefix is stripped before FK detection

### Added
- `extractQuotedValues(s, start)` — standalone state machine function for reading up to 4 single-quoted values from a sqlite_master tuple
- Debug panel (below Parse button) shows step-by-step detection output when parsing fails

---

## [0.4.0] — 2025-08-20

### Added
- **sqlite_master INSERT format support** — paste the output of `SELECT type, name, tbl_name, sql FROM sqlite_master WHERE sql IS NOT NULL` directly; parser auto-detects the format and extracts CREATE TABLE/VIEW/INDEX/TRIGGER statements
- **Smart error messages** — Parse button now detects when a SELECT query or INSERT data is pasted in the wrong box and gives specific guidance
- **Visual textarea feedback** — DDL textarea border turns green for valid DDL/sqlite_master input, gold for detected SELECT queries
- **+ Add All to Canvas / Remove All** — bulk canvas management buttons in the schema panel
- **FK Relationships tab** — detected foreign key relationships shown as clickable chips; clicking adds both tables and the join to the canvas
- **Views tab** — views from schema shown in a dedicated read-only tab
- **Version footer** — fixed bottom bar reading from `APP_VERSION` and `BUILD_DATE` JS constants
- `extractFromSqliteMaster(raw)` function for sqlite_master format detection and SQL extraction

### Changed
- Schema panel reorganized into Tables / FK Relationships / Views sub-tabs
- Improved placeholder text on DDL textarea with exact SQL query to run for sqlite_master export
- Triggers silently ignored (not added to canvas, not shown as error)

### Fixed
- Canvas join lines now redraw correctly after table node is moved

---

## [0.3.0] — 2025-08-19

### Added
- **↙ Parse SQL** — reverse-parse any SELECT query into the visual builder. Populates FROM, JOINs, SELECT columns, WHERE conditions, ORDER BY, LIMIT, and DISTINCT from pasted SQL. Handles table aliases.
- **Full DDL parsing** — `CREATE INDEX`, `CREATE VIEW`, `CREATE TRIGGER` all recognized (indexes and triggers skipped for canvas; views catalogued)
- **Inline FK detection** — `col INTEGER REFERENCES other(id)` syntax parsed in addition to standalone `CONSTRAINT ... FOREIGN KEY`
- Three-panel layout (schema left, canvas+builder center, SQL+results right) — hybrid of v1 structure and v2 canvas

### Changed
- Canvas is now a fixed-height section above the structured builder, not the primary interface
- Builder structured sections (FROM, Joins, Select Columns, Where, Order/Limit) always visible below canvas
- Schema panel shows table column list with PK/FK indicators inline

### Fixed
- **Join right-side column picker** now correctly shows only columns from the joined table, not all tables (was showing FROM table columns on right side)

---

## [0.2.0] — 2025-08-18 (v2 — canvas-first, superseded)

> This version was a canvas-first redesign. The approach was rejected in favour of the hybrid layout in v0.3.0. Documented for history.

### Added
- Draggable table cards on a free-form canvas with bezier join lines
- Zoom controls, Space+drag panning
- Port dots on each column for drag-to-join interaction
- Auto Layout (grid arrangement)

### Removed
- Structured query builder sections (FROM/JOIN/SELECT/WHERE as explicit UI) — these were dropped in favor of canvas-only building. Restored in v0.3.0.

---

## [0.1.1] — 2025-08-17

### Fixed
- **Join column picker bug** — the right-side column selector in a JOIN row was showing columns from the FROM (left) table instead of the joined (right) table. Now filters correctly to the joined table's columns only.

---

## [0.1.0] — 2025-08-17 — Initial release

### Added
- Three-panel layout: schema/DDL import left, structured query builder center, SQL+results right
- DDL parser for `CREATE TABLE` statements (basic column type and PRIMARY KEY extraction)
- FROM table selector
- JOIN builder with type (INNER/LEFT/RIGHT/FULL OUTER/CROSS) and ON condition pickers
- SELECT column checkboxes grouped by table
- WHERE condition builder with operators and AND/OR logic
- ORDER BY column + direction selector
- LIMIT input
- Dialect toggle (SQLite / MySQL / PostgreSQL) affecting quoting style
- Live SQL output with syntax highlighting
- In-browser SQLite execution via sql.js (WebAssembly)
- Seed DB tab for loading CREATE TABLE + INSERT data
- Copy SQL to clipboard
- Sample data (customers / orders / products schema)
