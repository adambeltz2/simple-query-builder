# QueryCraft — Backlog

Items are grouped by category. Priority is indicated as 🔴 High / 🟡 Medium / 🟢 Low.

---

## 🐛 Active Bugs

### B-001 — sqlite_master format: parseDDL returns 0 tables ✅ Fixed in v0.4.4
**Root cause:** `extractFromSqliteMaster` double-unescaped the sql column — `extractQuotedValues` already converts every `''` to `'` while extracting, so the extra `.replace(/''/g, "'")` afterward corrupted any statement with a decoded `''` (e.g. `DEFAULT ''`, a `CHECK (... GLOB '...')`) into an unterminated string, which desynced `splitStmts`' quote-tracking for every statement after it in the same combined paste. This is why real-world pastes reported "104 statements extracted, 0 tables parsed" — the first table with any `''`-containing default/CHECK poisoned everything downstream of it.

**Fix:** dropped the redundant `.replace(/''/g, "'")` in `extractFromSqliteMaster`; `extractQuotedValues` already returns fully-decoded values. Verified against a 2-table repro (Node, functions extracted from `index.html`) and against the live file directly before and after the change.

**Related follow-up (see B-004, still open):** the extractor still assumes the sqlite_master row has exactly 4 quoted values in a row (`type, name, tbl_name, sql`) as the README's suggested query returns. A paste that includes the unquoted `rootpage` column (e.g. from `SELECT *` or a `.dump`) breaks extraction differently.

### B-002 — Join right-side column picker shows wrong table ✅ Fixed in v0.1.1
Resolved. Was using `allCols` (all tables) instead of filtering to the joined table only.

### B-003 — Canvas empty after schema parse ✅ Fixed in v0.3.0
Tables now auto-populate schema panel on parse; "+ Add All to Canvas" added.

### B-004 — sqlite_master extractor breaks on extra unquoted columns (e.g. `rootpage`) 🟡
**Added 2026-08-26.** `extractQuotedValues` reads exactly 4 consecutive single-quoted values per tuple and only skips whitespace/commas between them. A dump that includes the unquoted `rootpage` integer column between `tbl_name` and `sql` (common output from `SELECT *`, `.dump`, or several DB GUI "export as SQL" features, not just the README's recommended 4-column `SELECT`) makes the state machine stop early — it hits a bare digit, which isn't `'`, `,`, or whitespace, and bails with only 3 values collected. Result: 0 statements extracted, with no hint to the user about *why*. Consider skipping runs of non-quote/non-comma characters (not just whitespace) between quoted values, or locating the `sql` value by scanning for the *last* quoted value before the tuple's closing `)` instead of assuming a fixed 4-value order.

### B-005 — WHERE values aren't escaped when generating SQL 🟡
**Added 2026-08-26.** In `buildSQL()`, a WHERE value is interpolated directly: `` `${w.op} '${w.val}'` ``. A value containing an apostrophe (e.g. `O'Brien`) produces invalid/broken SQL when run or copied — the generated string has an unbalanced quote. Fix: escape by doubling embedded `'` in `w.val` before interpolating (`w.val.replace(/'/g, "''")`), matching the app's own quoting conventions elsewhere.

### B-006 — Version footer fallback text goes stale 🟢 Fixed in v0.4.3
The `#verStr` span shipped with a hardcoded placeholder (`v0.4.1`) that didn't match `APP_VERSION` (`0.4.2`). Cosmetic only — the closing `<script>` IIFE overwrites it on load — but misleading if that IIFE ever fails to run. Fixed by clearing the placeholder so there's nothing stale to show before the real version is injected.

### B-007 — "Run Query" always executes as SQLite regardless of selected dialect 🟢
**Added 2026-08-26.** The MySQL/PostgreSQL dialect toggle only changes the *displayed* SQL's quoting style. `runQuery()` always executes against the in-browser `sql.js` (SQLite) engine, so dialect-specific syntax a user builds for MySQL/Postgres may not behave the same when run — or may run successfully but not reflect what would happen on the real target database. Worth a small inline note ("Run always uses SQLite semantics") or disabling Run when a non-SQLite dialect is selected.

### B-008 — Clear DB swallows errors silently 🟢
**Added 2026-08-26.** `btnClearDB`'s per-table `DROP TABLE` and the outer clear both have empty `catch (e) {}` blocks. If a drop fails, the user sees a generic "✓ DB cleared" success message regardless. Low severity, but worth surfacing failures.

---

## 🚀 Features

### Parser

**F-001 — Export parsed schema as JSON** 🟡  
After parsing DDL, allow downloading the schema as a structured JSON file for use in other tools or for caching.

**F-002 — Schema diff / re-import** 🟡  
When re-pasting DDL into an already-loaded schema, show what changed (new tables, dropped columns, new FKs) rather than silently replacing everything.

**F-003 — Support PostgreSQL-specific DDL** 🟢  
Handle `SERIAL`, `BIGSERIAL`, `::` casts, `$1` parameter syntax in CHECK constraints, and schema-qualified table names (`public.customers`).

**F-004 — Support MySQL-specific DDL** 🟢  
Handle `AUTO_INCREMENT`, `ENGINE=InnoDB`, `TINYINT(1)` booleans, and backtick-quoted identifiers in mysqldump output.

**F-005 — Load schema from file upload** 🟡  
Allow dragging a `.sql` file onto the DDL textarea instead of copy-paste.

**F-032 — Harden sqlite_master extraction against extra/reordered columns** 🟡  
**Added 2026-08-26.** See B-004. Make `extractQuotedValues`/`extractFromSqliteMaster` tolerant of the unquoted `rootpage` column and other common real-world sqlite_master export variants, not just the exact 4-column `SELECT` the README prescribes.

### Query Builder

**F-006 — GROUP BY / HAVING** 🟡  
Add GROUP BY column picker and HAVING condition builder below the WHERE section. Currently the most common missing clause for aggregate queries.

**F-007 — Aggregate functions in SELECT** 🟡  
Allow `COUNT(*)`, `SUM(col)`, `AVG(col)`, `MIN/MAX` in the SELECT column list alongside plain columns.

**F-008 — Subquery support** 🟢  
Allow a WHERE value to be a subquery (`IN (SELECT ...)`). Likely implemented as a modal SQL editor for the subquery.

**F-009 — Column aliases (AS)** 🟡  
Let users specify an alias for each selected column, rendered as `table.col AS alias` in the SELECT clause.

**F-010 — UNION / UNION ALL** 🟢  
Allow combining two query builders with UNION. Complex UI — low priority.

**F-011 — Multiple WHERE condition groups** 🟡  
Currently all WHERE conditions are in a flat list with AND/OR between them. Support grouped conditions: `(A AND B) OR (C AND D)`.

**F-031 — Add `BETWEEN` operator to WHERE builder** 🟡  
**Added 2026-08-26.** The WHERE operator list (`=, !=, <, >, <=, >=, LIKE, NOT LIKE, IN, NOT IN, IS NULL, IS NOT NULL`) is missing `BETWEEN`/`NOT BETWEEN`, a very common condition. Needs a two-value input (low/high) instead of the single `value` field the other operators use.

### Canvas

**F-012 — Collapse table nodes** 🟡  
Add a toggle to collapse a table node to just its header, hiding columns. Useful for large schemas where most tables don't need to be inspected.

**F-013 — Color-code tables by group** 🟢  
Allow user to assign tables to groups (e.g. "core", "lookup", "migration") and color-code node headers accordingly.

**F-014 — Save/restore canvas layout** 🟡  
Persist table positions to `localStorage` keyed by schema hash, so reopening the same schema restores the layout.

**F-015 — Minimap** 🟢  
Show a small overview minimap of the full canvas when there are many tables, with a viewport indicator.

**F-016 — Right-click context menu on canvas** 🟢  
Add a context menu on canvas right-click: "Add table", "Auto layout", "Select all", etc.

### Results & Execution

**F-017 — Export results as CSV** 🔴  
After running a query, allow downloading the result table as a CSV file. One-click button below the results table.

**F-018 — Export results as JSON** 🟡  
Same as F-017 but JSON format.

**F-019 — Query history** 🟡  
Keep a log of the last N queries run (with timestamps and row counts) so users can re-run or reference previous queries.

**F-020 — Editable result cells** 🟢  
For simple single-table queries, allow clicking a result cell to edit the value and generate an UPDATE statement.

**F-021 — Load SQLite .db file** 🔴  
Allow uploading an actual `.sqlite` or `.db` file via drag-and-drop, loading it into sql.js so users can query real data without manual seed scripts.

### SQL Reverse Parse (↙ Parse SQL)

**F-022 — Support CTEs (WITH clauses)** 🟡  
The current SQL parser doesn't handle `WITH cte AS (...)` queries. Parse the CTE definitions and show them as a separate visual layer.

**F-023 — Support subqueries in FROM** 🟢  
Parse `SELECT ... FROM (SELECT ...) AS sub` and represent the inner query as a virtual table node on the canvas.

**F-024 — Handle table aliases consistently** 🟡  
The reverse parser maps aliases to table names, but if a schema hasn't been loaded yet, table names can't be resolved. Add a warning when aliases can't be resolved.

### UX / Polish

**F-025 — Keyboard shortcuts** 🟡  
`Ctrl+Enter` to run query, `Ctrl+C` to copy SQL, `Escape` to close modal, `Delete` to remove selected canvas node.

**F-026 — Dark/light mode toggle** 🟢  
Currently hard-coded dark. Add a toggle and persist preference.

**F-027 — Undo/redo for canvas changes** 🟡  
Track canvas state changes (join added, table moved, column toggled) in an undo stack.

**F-028 — Responsive/mobile layout** 🟢  
The three-panel layout doesn't work on small screens. Consider a tab-based layout for mobile.

**F-029 — Save query state** 🟡  
Persist the current query (joins, selected columns, WHERE conditions) to `localStorage` so it survives page refresh.

**F-030 — Share query via URL** 🟢  
Encode the current query state in the URL hash so it can be shared as a link.

---

## 🏗 Infrastructure

**I-001 — GitHub Actions deploy to Pages** 🟡  
Add a `.github/workflows/deploy.yml` that auto-publishes `index.html` to GitHub Pages on every push to `main`.

**I-002 — Test fixture: sample_schema.sql** 🔴  
Add `test/sample_schema.sql` containing the sqlite_master INSERT output used for manual testing. Needed for reproducible bug reports.  
*Update 2026-08-26:* a minimal 2-table repro (one table with a `CHECK`/`DEFAULT ''`) was enough to reproduce B-001 in isolation outside the browser (Node, by extracting the parser functions and running them directly) — that fixture is a good starting point for this and for I-003's smoke test.

**I-003 — Automated smoke test** 🟡  
A simple Node.js or Playwright script that loads `index.html`, pastes the sample schema, clicks Parse, and asserts that N tables are found. Blocks B-001 regression.

---

## ✅ Completed

| ID | Description | Version |
|---|---|---|
| B-002 | Join right-side column picker showing wrong table | v0.1.1 |
| B-003 | Canvas empty after schema parse | v0.3.0 |
| — | sqlite_master INSERT format detection | v0.4.0 |
| — | State-machine quote extractor (handles `''` escaping) | v0.4.1 |
| — | Smart error messages (SELECT in DDL box, INSERT in DDL box) | v0.4.3 |
| — | Visual border feedback on DDL textarea | v0.4.3 |
| — | Version footer with `APP_VERSION` / `BUILD_DATE` constants | v0.4.0 |
| — | FK auto-join suggestions from parsed constraints | v0.3.0 |
| — | ↙ Parse SQL → visual reverse parse | v0.3.0 |
| — | Views tab in schema panel | v0.3.0 |
| — | + Add All to Canvas / Remove All buttons | v0.4.0 |
| B-006 | Version footer fallback text out of sync with APP_VERSION | v0.4.3 |
| B-001 | sqlite_master format: parseDDL returned 0 tables (double-unescape bug in extractFromSqliteMaster) | v0.4.4 |
