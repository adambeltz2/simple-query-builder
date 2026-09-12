# QueryCraft — Backlog

Items are grouped by category. Priority is indicated as 🔴 High / 🟡 Medium / 🟢 Low.

All tracked bugs, features, and infrastructure items are resolved. The live app is at https://adambeltz2.github.io/simple-query-builder/. New items should still be filed here as they're discovered.

---

## 🐛 Active Bugs

None open.

### B-001 — sqlite_master format: parseDDL returns 0 tables ✅ Fixed in v0.4.4
**Root cause:** `extractFromSqliteMaster` double-unescaped the sql column — `extractQuotedValues` already converts every `''` to `'` while extracting, so the extra `.replace(/''/g, "'")` afterward corrupted any statement with a decoded `''` (e.g. `DEFAULT ''`, a `CHECK (... GLOB '...')`) into an unterminated string, which desynced `splitStmts`' quote-tracking for every statement after it in the same combined paste. This is why real-world pastes reported "104 statements extracted, 0 tables parsed" — the first table with any `''`-containing default/CHECK poisoned everything downstream of it.

**Fix:** dropped the redundant `.replace(/''/g, "'")` in `extractFromSqliteMaster`; `extractQuotedValues` already returns fully-decoded values.

### B-002 — Join right-side column picker shows wrong table ✅ Fixed in v0.1.1
Resolved. Was using `allCols` (all tables) instead of filtering to the joined table only.

### B-003 — Canvas empty after schema parse ✅ Fixed in v0.3.0
Tables now auto-populate schema panel on parse; "+ Add All to Canvas" added.

### B-004 — sqlite_master extractor breaks on extra unquoted columns (e.g. `rootpage`) ✅ Fixed
**Fix (2026-09-11):** `extractQuotedValues` now skips any run of unquoted, non-comma/non-paren characters between quoted values (an integer, `NULL`, etc.) instead of stopping at the first non-quote character. Covered by `test/sample_schema.sql` + `tests/fixture-schema.spec.js` (see I-002).

### B-005 — WHERE values aren't escaped when generating SQL ✅ Fixed
**Fix (2026-09-08):** added an `esc()` helper in `buildSQL()` that doubles embedded `'` before interpolating. Also fixed a related `hl()` syntax-highlighter HTML-corruption bug found while testing (its injected `<span>` attributes now use single quotes so they stop colliding with its own double-quote-identifier regex). Covered by `tests/smoke.spec.js`.

### B-006 — Version footer fallback text goes stale ✅ Fixed in v0.4.3
Fixed by clearing the placeholder so there's nothing stale to show before the real version is injected.

### B-007 — "Run Query" always executes as SQLite regardless of selected dialect ✅ Fixed
**Fix (2026-09-11):** added an inline note above the results whenever a query is run with a non-SQLite dialect selected. Covered by `tests/misc-fixes.spec.js`.

### B-008 — Clear DB swallows errors silently ✅ Fixed
**Fix (2026-09-11):** per-table drop failures are now collected and surfaced instead of being silently swallowed. Covered by `tests/misc-fixes.spec.js`.

---

## 🚀 Features

None open — all 32 tracked features are implemented. See the Completed table below for what each one does and which test covers it.

### Notes on scope for a few items

- **F-010 (UNION)** — implemented as a "combine with a second, hand-written query" flow (a dialect select + textarea appended via `UNION`/`UNION ALL`) rather than a second full visual builder instance, matching the item's own "complex UI — low priority" framing.
- **F-011 (WHERE condition groups)** — implemented via per-row `(`/`)` toggle buttons that wrap a run of conditions in parentheses, rather than a full nested-tree condition model. Produces the same `(A AND B) OR (C AND D)` output with much less risk to the existing flat WHERE-row code.
- **F-022 (CTEs) / F-023 (subqueries in FROM)** — both implemented by giving the reverse SQL parser (`↙ Parse SQL`) a lightweight virtual-table mechanism: a CTE or FROM-subquery gets its own synthetic entry in the schema (columns derived from its own SELECT list) so it behaves like any other table on canvas. This does not attempt to parse or visualize the CTE/subquery's *own* internal joins/filters — it's treated as an opaque source, which is enough to build a query on top of it.
- **F-027 (undo/redo)** — scoped to canvas-shape changes only (table add/remove/move, join add/remove/drag-created, column checkbox toggle), per the item's own wording ("join added, table moved, column toggled"). WHERE/HAVING/ORDER text edits are not on the undo stack.
- **F-028 (responsive/mobile)** — implemented as a CSS media query (≤768px) plus a small mobile tab bar that switches which of the three panels (Schema / Canvas & Builder / SQL & Results) is visible; desktop layout is unchanged above that breakpoint.

---

## 🏗 Infrastructure

None open.

### I-004 — GitHub Pages deployment failing: Pages not enabled on the repo ✅ Fixed
**Added 2026-09-12.** Both runs of the `Deploy to GitHub Pages` workflow (from PR #7 and PR #8 merging to `main`) failed with the same error:

```
##[error]Creating Pages deployment failed
##[error]HttpError: Not Found
##[error]Error: Failed to create deployment (status: 404) with build version ...
Ensure GitHub Pages has been enabled: https://github.com/adambeltz2/simple-query-builder/settings/pages
```

The workflow itself (added in I-001) was correct — `actions/deploy-pages` couldn't create a deployment because the repository had never had GitHub Pages turned on.

**Fix (2026-09-12):** repo owner enabled Settings → Pages → Source → "GitHub Actions". Re-ran the workflow manually (`workflow_dispatch`) and it deployed successfully — [run 3](https://github.com/adambeltz2/simple-query-builder/actions/runs/34714214193). The app is now live at **https://adambeltz2.github.io/simple-query-builder/**.

### I-001 — GitHub Actions deploy to Pages ✅ Fixed
**Fix (2026-09-11):** `.github/workflows/deploy.yml` copies `index.html` alone into a `_site` directory (keeping `tests/`, `test/`, `node_modules`, etc. out of the published site) and deploys it via `actions/upload-pages-artifact` + `actions/deploy-pages` on every push to `main` that touches `index.html`, plus manual `workflow_dispatch`. Live and deploying successfully as of I-004.

### I-002 — Test fixture: sample_schema.sql ✅ Fixed
**Fix (2026-09-11):** `test/sample_schema.sql` — realistic `INSERT INTO sqlite_master VALUES(...)` output for 3 tables + an index + a view, including the unquoted `rootpage` column (B-004) and an escaped-quote `DEFAULT`/`CHECK` (B-001). Covered by `tests/fixture-schema.spec.js`.

### I-003 — Automated smoke test ✅ Fixed
**Fix (2026-09-08):** `tests/smoke.spec.js` (Playwright) — loads the app, uses the built-in Sample DDL, clicks Parse, and asserts the table badge updates and SQL generation works. Run via `npm install && npm test`.

---

## ✅ Completed

| ID | Description | Test coverage |
|---|---|---|
| B-002 | Join right-side column picker showing wrong table | — |
| B-003 | Canvas empty after schema parse | — |
| — | sqlite_master INSERT format detection | — |
| — | State-machine quote extractor (handles `''` escaping) | — |
| — | Smart error messages (SELECT in DDL box, INSERT in DDL box) | — |
| — | Visual border feedback on DDL textarea | — |
| — | Version footer with `APP_VERSION` / `BUILD_DATE` constants | — |
| — | FK auto-join suggestions from parsed constraints | — |
| — | ↙ Parse SQL → visual reverse parse | — |
| — | Views tab in schema panel | — |
| — | + Add All to Canvas / Remove All buttons | — |
| B-006 | Version footer fallback text out of sync with APP_VERSION | — |
| B-001 | sqlite_master format: parseDDL returned 0 tables (double-unescape bug) | — |
| I-003 | Automated smoke test | `tests/smoke.spec.js`, `tests/schema-command.spec.js` |
| B-005 | WHERE apostrophe escaping; also fixed `hl()` HTML corruption | `tests/smoke.spec.js` |
| B-004 | sqlite_master extractor broke on unquoted columns (e.g. `rootpage`) | `tests/fixture-schema.spec.js` |
| B-007 | Run Query dialect-mismatch note | `tests/misc-fixes.spec.js` |
| B-008 | Clear DB error surfacing | `tests/misc-fixes.spec.js` |
| I-002 | Test fixture `test/sample_schema.sql` | `tests/fixture-schema.spec.js` |
| F-017 | Export query results as CSV | `tests/export-csv.spec.js` |
| F-021 | Load an existing `.sqlite`/`.db` file | `tests/load-db-file.spec.js` |
| I-001 | GitHub Actions deploy to Pages | — (manual verification only) |
| I-004 | GitHub Pages enabled on the repo — site is live | — (manual verification only) |
| F-031 | `BETWEEN`/`NOT BETWEEN` WHERE operator | `tests/where-between.spec.js` |
| F-025 | Keyboard shortcuts (Run/Copy/Escape/Delete) | `tests/keyboard-shortcuts.spec.js` |
| F-001 | Export parsed schema as JSON | `tests/export-import-schema.spec.js` |
| F-005 | Load schema from `.sql` file upload | `tests/export-import-schema.spec.js` |
| F-018 | Export results as JSON | `tests/export-import-schema.spec.js` |
| F-003 | PostgreSQL-specific DDL (SERIAL, `::casts`, schema-qualified names) | `tests/dialect-ddl.spec.js` |
| F-004 | MySQL-specific DDL (AUTO_INCREMENT, ENGINE=, TINYINT(1), backticks) — also fixed backtick/quoted `CONSTRAINT` names not being recognized at all | `tests/dialect-ddl.spec.js` |
| F-032 | Hardened sqlite_master extraction (same fix as B-004) | `tests/fixture-schema.spec.js` |
| F-036 | Type-mismatch hints in WHERE conditions | `tests/where-hints-and-alias-warnings.spec.js` |
| F-024 | SQL→Visual alias resolution warnings | `tests/where-hints-and-alias-warnings.spec.js` |
| F-009 | Column aliases (`AS`) in SELECT | `tests/column-aliases.spec.js` |
| F-035 | EXPLAIN QUERY PLAN view | `tests/explain-and-theme.spec.js` |
| F-026 | Dark/light theme toggle | `tests/explain-and-theme.spec.js` |
| F-012 | Collapse table nodes | `tests/canvas-collapse-color-contextmenu.spec.js` |
| F-016 | Right-click context menu on canvas | `tests/canvas-collapse-color-contextmenu.spec.js` |
| F-013 | Color-code tables by group | `tests/canvas-collapse-color-contextmenu.spec.js` |
| F-014 | Save/restore canvas layout | `tests/persistence-layout-schema-query-share.spec.js` |
| F-034 | Named, saved schemas | `tests/persistence-layout-schema-query-share.spec.js` |
| F-029 | Save query state across refresh | `tests/persistence-layout-schema-query-share.spec.js` |
| F-030 | Share query via URL | `tests/persistence-layout-schema-query-share.spec.js` |
| F-019 | Query history | `tests/query-history.spec.js` |
| F-002 | Schema diff on re-import | `tests/schema-diff.spec.js` |
| F-033 | Composite (multi-column) join keys | `tests/composite-join-keys.spec.js` |
| F-006 | GROUP BY / HAVING | `tests/group-by-having-aggregates.spec.js` |
| F-007 | Aggregate functions in SELECT | `tests/group-by-having-aggregates.spec.js` |
| F-020 | Editable result cells (single-table queries) | `tests/editable-result-cells.spec.js` |
| F-037 | Keyboard-accessible canvas interactions + ARIA labels | `tests/keyboard-accessible-canvas.spec.js` |
| F-008 | Subquery support in WHERE (modal SQL editor) | `tests/subquery-editor.spec.js` |
| F-011 | Multiple WHERE condition groups (`(A AND B) OR (C AND D)`) | `tests/where-groups.spec.js` |
| F-015 | Minimap | `tests/minimap.spec.js` |
| F-010 | UNION / UNION ALL | `tests/union.spec.js` |
| F-022 | CTE (`WITH`) support in SQL→Visual | `tests/cte-support.spec.js` |
| F-023 | Subqueries in FROM | `tests/subquery-in-from.spec.js` |
| F-027 | Undo/redo for canvas changes | `tests/undo-redo.spec.js` |
| F-028 | Responsive/mobile layout | `tests/responsive-mobile-layout.spec.js` |
