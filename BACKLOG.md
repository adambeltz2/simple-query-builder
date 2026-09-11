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

### B-004 — sqlite_master extractor breaks on extra unquoted columns (e.g. `rootpage`) ✅ Fixed
**Added 2026-08-26.** `extractQuotedValues` reads exactly 4 consecutive single-quoted values per tuple and only skips whitespace/commas between them. A dump that includes the unquoted `rootpage` integer column between `tbl_name` and `sql` (common output from `SELECT *`, `.dump`, or several DB GUI "export as SQL" features, not just the README's recommended 4-column `SELECT`) makes the state machine stop early — it hits a bare digit, which isn't `'`, `,`, or whitespace, and bails with only 3 values collected. Result: 0 statements extracted, with no hint to the user about *why*.

**Fix (2026-09-11):** `extractQuotedValues` now skips any run of unquoted, non-comma/non-paren characters between quoted values (an integer, `NULL`, etc.) instead of stopping at the first non-quote character. The 4 quoted values (`type`, `name`, `tbl_name`, `sql`) are still collected correctly regardless of extra unquoted columns interspersed between them. Covered by `test/sample_schema.sql` + `tests/fixture-schema.spec.js` (see I-002).

### B-005 — WHERE values aren't escaped when generating SQL ✅ Fixed
**Added 2026-08-26.** In `buildSQL()`, a WHERE value is interpolated directly: `` `${w.op} '${w.val}'` ``. A value containing an apostrophe (e.g. `O'Brien`) produces invalid/broken SQL when run or copied — the generated string has an unbalanced quote.

**Fix (2026-09-08):** added an `esc()` helper in `buildSQL()` that doubles embedded `'` before interpolating, applied to both the `LIKE`/`NOT LIKE` branch and the generic string-literal branch. `IN`/`NOT IN` values are left as-is since that field is a raw, user-typed parenthesized list (e.g. `'a','b'`) rather than a single literal.

**Related fix found while testing:** `hl()` (SQL syntax highlighter) generated malformed HTML for *every* query — a later regex step (matching double-quoted identifiers) was re-scanning its own previously-inserted `class="..."` attributes and wrapping them again, corrupting the DOM. Fixed by switching the highlighter's injected `<span>` attributes to single quotes so they no longer collide with the double-quote-identifier regex. Covered by a new Playwright regression test (`tests/smoke.spec.js`).

### B-006 — Version footer fallback text goes stale 🟢 Fixed in v0.4.3
The `#verStr` span shipped with a hardcoded placeholder (`v0.4.1`) that didn't match `APP_VERSION` (`0.4.2`). Cosmetic only — the closing `<script>` IIFE overwrites it on load — but misleading if that IIFE ever fails to run. Fixed by clearing the placeholder so there's nothing stale to show before the real version is injected.

### B-007 — "Run Query" always executes as SQLite regardless of selected dialect ✅ Fixed
**Added 2026-08-26.** The MySQL/PostgreSQL dialect toggle only changes the *displayed* SQL's quoting style. `runQuery()` always executes against the in-browser `sql.js` (SQLite) engine, so dialect-specific syntax a user builds for MySQL/Postgres may not behave the same when run — or may run successfully but not reflect what would happen on the real target database.

**Fix (2026-09-11):** added an inline `msg-info` note above the results whenever a query is run with a non-SQLite dialect selected, stating that Run always uses SQLite semantics. Covered by `tests/misc-fixes.spec.js`.

### B-008 — Clear DB swallows errors silently ✅ Fixed
**Added 2026-08-26.** `btnClearDB`'s per-table `DROP TABLE` and the outer clear both have empty `catch (e) {}` blocks. If a drop fails, the user sees a generic "✓ DB cleared" success message regardless.

**Fix (2026-09-11):** per-table drop failures are now collected and surfaced in an error message (`⚠ DB cleared with errors — ...`) instead of being silently swallowed; an exception in the outer clear itself is now also reported. Covered by `tests/misc-fixes.spec.js` (success path); the failure path is straightforward and was verified by code inspection.

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

**F-033 — Composite (multi-column) join keys** 🟡  
**Added 2026-09-08.** A join is currently a single `{lt, lc, rt, rc}` column pair. Schemas with composite keys need `ON a.x = b.x AND a.y = b.y`. Extend the join model to hold multiple column pairs per join and render/parse the `AND`-joined `ON` clause accordingly.

**F-036 — Type-mismatch hints in WHERE conditions** 🟢  
**Added 2026-09-08.** The WHERE builder doesn't warn when a condition compares a TEXT column against a bare numeric literal (or vice versa), which silently produces a query that returns no rows in strict-typed dialects. Add an inline hint (not a hard block) based on the column's parsed type.

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

**F-017 — Export results as CSV** ✅ Fixed  
After running a query, allow downloading the result table as a CSV file. One-click button below the results table.  
*Update 2026-09-11:* Done — an "Export CSV" button appears below Results once a query returns rows, downloading a properly-escaped CSV (RFC 4180-style: quotes commas/quotes/newlines, doubles embedded `"`). Covered by `tests/export-csv.spec.js`.

**F-018 — Export results as JSON** 🟡  
Same as F-017 but JSON format.

**F-019 — Query history** 🟡  
Keep a log of the last N queries run (with timestamps and row counts) so users can re-run or reference previous queries.

**F-020 — Editable result cells** 🟢  
For simple single-table queries, allow clicking a result cell to edit the value and generate an UPDATE statement.

**F-021 — Load SQLite .db file** ✅ Fixed  
Allow uploading an actual `.sqlite` or `.db` file via drag-and-drop, loading it into sql.js so users can query real data without manual seed scripts.  
*Update 2026-09-11:* Done — a drop zone / file picker on the Seed DB tab loads an uploaded `.sqlite`/`.db`/`.sqlite3` file's bytes into a new `sql.js` `Database`, and auto-populates the schema panel from its `sqlite_master` contents (same as pasting DDL, so tables still need "+ Add All to Canvas" before they're queryable — consistent with the existing Parse DDL flow). Covered by `tests/load-db-file.spec.js`.

**F-035 — EXPLAIN QUERY PLAN view** 🟢  
**Added 2026-09-08.** sql.js supports `EXPLAIN QUERY PLAN`. Add a tab/toggle next to Results that runs the built query prefixed with `EXPLAIN QUERY PLAN` and displays the plan — a useful learning aid alongside the visual builder.

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

**F-034 — Named, saved schemas** 🟡  
**Added 2026-09-08.** Only one schema can be loaded at a time; re-parsing replaces it. Allow saving the current schema under a name in `localStorage` and switching between saved schemas via a dropdown, rather than requiring re-paste.

**F-037 — Keyboard-accessible canvas interactions** 🟡  
**Added 2026-09-08.** Dragging table headers and drawing joins by dragging column-port dots are mouse-only; there's no keyboard path to move a node or create a join, and port dots/nodes lack ARIA labels. Add a keyboard-operable alternative (e.g. arrow-key nudge when a node is focused, an "Add Join" flow via the existing `+ Add` button paired with select dropdowns) and basic ARIA labeling for screen readers.

---

## 🏗 Infrastructure

**I-001 — GitHub Actions deploy to Pages** 🟡  
Add a `.github/workflows/deploy.yml` that auto-publishes `index.html` to GitHub Pages on every push to `main`.

**I-002 — Test fixture: sample_schema.sql** ✅ Fixed  
Add `test/sample_schema.sql` containing the sqlite_master INSERT output used for manual testing. Needed for reproducible bug reports.  
*Update 2026-08-26:* a minimal 2-table repro (one table with a `CHECK`/`DEFAULT ''`) was enough to reproduce B-001 in isolation outside the browser (Node, by extracting the parser functions and running them directly) — that fixture is a good starting point for this and for I-003's smoke test.  
*Update 2026-09-11:* Done — `test/sample_schema.sql` now exists: realistic `INSERT INTO sqlite_master VALUES(...)` output for 3 tables + an index + a view, including the unquoted `rootpage` column (B-004) and an escaped-quote `DEFAULT`/`CHECK` (B-001), so a single paste regression-tests both fixes at once. Covered by `tests/fixture-schema.spec.js`.

**I-003 — Automated smoke test** ✅ Fixed  
A simple Node.js or Playwright script that loads `index.html`, pastes the sample schema, clicks Parse, and asserts that N tables are found. Blocks B-001 regression.  
*Update 2026-09-08:* Done — `tests/smoke.spec.js` (Playwright) covers this: loads the app, uses the built-in Sample DDL, clicks Parse, and asserts the table badge updates and SQL generation works. See also `tests/schema-command.spec.js` for the per-dialect schema-command box. Run via `npm install && npm test`.

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
| I-003 | Automated smoke test (Playwright: `tests/smoke.spec.js`, `tests/schema-command.spec.js`) | — |
| B-005 | WHERE values with apostrophes broke generated SQL; also fixed a `hl()` syntax-highlighter HTML corruption bug found while testing | — |
| B-004 | sqlite_master extractor broke on unquoted columns (e.g. `rootpage`) between quoted values | — |
| B-007 | Run Query always used SQLite semantics with no indication when a different dialect was selected | — |
| B-008 | Clear DB swallowed per-table DROP errors silently | — |
| I-002 | Test fixture `test/sample_schema.sql` (also regression-tests B-001 + B-004) | — |
| F-017 | Export query results as CSV | — |
| F-021 | Load an existing `.sqlite`/`.db` file via drag-and-drop or file picker | — |
