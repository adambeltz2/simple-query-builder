# Changelog

All notable changes to SimpleQuery are documented here.  
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).  
Versioning follows [Semantic Versioning](https://semver.org/) from `0.x.y`.

---

## [0.7.0] — 2026-09-25

### Added
- **✨ "Generate a schema for me"** — a new helper button in the schema panel (next to Parse/Sample/Clear) for users who don't have DDL of their own handy. Opens a modal to pick a starting point:
  - Five ready-made domain templates (E-commerce, Blog/CMS, Project tracker, Library catalog, SaaS accounts), each 4-5 tables with realistic columns and wired-up foreign keys.
  - A "Custom topic" option that procedurally builds a chain of 3-8 generic tables named after whatever the user types (e.g. "fitness" → `fitness_categories → fitness_items → fitness_groups → ...`), each FK'd to the one before it — for when none of the presets fit but the user still just wants *something* to click around in.
  - "Parse it and add all tables to the canvas right away" is checked by default, so one click goes from empty canvas to a fully populated, joined schema — no separate Parse/Add All step needed. Unchecking it just loads the generated DDL into the import box for the user to review first.
- All templates run through the same `parseDDLInput`/`btnParse` path as hand-pasted DDL, so nothing new needed to happen on the parsing side.

### Testing
Added `tests/generate-schema.spec.js`: preset-domain generation + auto-populate, custom-topic chain generation with the requested table count, and the auto-populate checkbox correctly gating whether the canvas gets touched. Full suite (77 tests) passes.

---

## [0.6.0] — 2026-09-25

### Changed — UI decluttering pass
The app packs 40+ features into three fixed-width columns at 8-9px font, all rendered at once — reported as feeling cluttered. This release applies progressive disclosure and a spacing/type pass without removing any functionality:
- **Advanced query clauses collapsed by default**: `Having` and `Union` (the least-used clauses per BACKLOG's own scope notes) now live in a collapsed `<details>` "Advanced" accordion in the builder column, one click away instead of always taking up scroll space.
- **Schema-panel tools collapsed by default**: the `Get schema` command generator, Upload/Export JSON, Saved schemas, and the debug log now live in a collapsed "Schema tools" accordion, leaving the primary DDL-paste-and-parse flow as the only thing shown up front.
- **Larger base type scale**: bumped body/UI font sizes roughly 1-2px across buttons, labels, table/column lists, the SQL/results panes, and form controls — the biggest single contributor to the "dense" feel was 8-9px text everywhere, not feature count.
- **More breathing room**: increased panel padding, row/section gaps, and canvas default height (265px → 340px) so the visual canvas — the centerpiece of the tool — isn't dwarfed by the builder form beneath it.
- Widened the left/right side panels slightly (240px → 270px, 300px → 320px) to reduce text wrapping at the larger font size.
- Fixed the on-canvas minimap intercepting clicks on table nodes underneath it (it's a passive overview, never interactive) — `pointer-events:none`. This was a latent bug that the panel-width change made easy to trigger.

### Testing
Added `tests/ui-declutter.spec.js` asserting the two new accordions are collapsed by default, expand on click, and that core builder sections (From/Joins/Columns/Where) stay visible without any expansion. Updated `tests/export-import-schema.spec.js`, `tests/group-by-having-aggregates.spec.js`, `tests/persistence-layout-schema-query-share.spec.js`, `tests/schema-command.spec.js`, and `tests/union.spec.js` to open the relevant accordion before interacting with controls that moved inside one. Full suite (74 tests) passes.

---

## [0.5.2] — 2026-09-15

### Added
- Buy Me A Coffee link in the app footer and a matching badge in `README.md` (https://www.buymeacoffee.com/adambeltz).

### Fixed
- The footer's copyright line was rendering as `MIT <toast div>copy; 2025` instead of `MIT © 2025` — a stray duplicate `<div id="toast">` had been left in place of a `&copy;` entity, also creating a duplicate `id="toast"` in the page. Removed the stray element and restored the proper `&copy;` entity.

---

## [0.5.1] — 2026-09-13

### Changed
- Renamed the app from **QueryCraft** to **SimpleQuery**, matching the `simple-*` naming convention used for this repo. Updated the page title, topbar logo, version footer, downloaded-file names (`simplequery-schema.json`, `simplequery-results-*.csv/json`), and all references in `README.md`, `CHANGELOG.md`, `BACKLOG.md`, and `package.json`. No functional changes.

---

## [0.5.0] — 2026-09-11

### Added
Cleared the entire feature backlog (32 items) plus the last 3 open bugs and all infrastructure items in one release. Highlights:
- GROUP BY / HAVING, aggregate functions (COUNT/SUM/AVG/MIN/MAX), column aliases, BETWEEN/NOT BETWEEN, WHERE condition grouping with `(`/`)`, a subquery editor for `IN (...)`, and inline type-mismatch hints
- UNION / UNION ALL, CTE (`WITH`) support and subqueries in `FROM` for the SQL→Visual reverse parser
- Composite (multi-column) join keys
- PostgreSQL and MySQL DDL dialect support (SERIAL, `::casts`, schema-qualified names, AUTO_INCREMENT, ENGINE=, backtick identifiers) — also fixed backtick/quoted `CONSTRAINT` names not being recognized at all
- Canvas: collapsible nodes, color-coded groups, right-click context menu, minimap, saved per-schema layouts, undo/redo, keyboard-operable node movement with ARIA labels
- Results: export as CSV/JSON, editable cells (single-table queries → UPDATE), EXPLAIN QUERY PLAN view, query history
- Schema: export as JSON, upload from `.sql` file, named saved schemas, diff-on-reimport
- Query state persistence per schema across refresh, and shareable query links via URL hash
- Dark/light theme toggle, keyboard shortcuts (Run/Copy/Escape/Delete), responsive mobile tab layout
- GitHub Actions workflow to deploy to GitHub Pages

### Fixed
- Run Query now notes when execution semantics (always SQLite) don't match the selected dialect
- Clear DB now surfaces per-table DROP failures instead of swallowing them
- `sqlite_master` extraction now tolerates the unquoted `rootpage` column between quoted values

### Testing
Added a fixture (`test/sample_schema.sql`) and ~65 new Playwright tests covering all of the above; full suite run via `npm install && npm test`.

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
