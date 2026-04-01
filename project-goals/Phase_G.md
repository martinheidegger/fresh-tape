# Phase G — detailed plan (quality gates: tests + lint + CI alignment)

## Intent

Phase E and Phase F deliberately **did not** treat a fully green `npm test` or strict eslint/eclint as merge gates. Phase G is the **stabilization and release-hygiene** phase: make the default developer and CI workflows trustworthy, fix or classify remaining failures, and close the loop on “remaining work” that is not API surface area.

**Primary outcomes**

1. `**npm run tests-only`** passes locally on supported Node versions (same range as `[.github/workflows/node-tens.yml](../.github/workflows/node-tens.yml)`: `>= 10.17 < 20`).
2. `**npm run lint**` passes: **eclint** (EditorConfig) → **eslint** → `**tsc --noEmit test/typings.ts`** → **webpack** production build (see `[package.json](../package.json)` `scripts`).
3. `**npm test`** is usable as an integration gate: `pretest` → `lint`, then `tests-only`, then `posttest` (`npm audit` production); align expectations with what CI actually runs (below).

## Relationship to earlier phases


| Phase | What it deferred for Phase G                                       |
| ----- | ------------------------------------------------------------------ |
| **E** | Full `tests-only` green; eslint/eclint as gates.                   |
| **F** | Same; plus risk-7 test rows unless a tiny test was needed for API. |


Phase G **does not** reopen large API or architecture decisions settled in E/F unless a failing gate forces a minimal fix.

## CI vs local scripts (inventory)


| Workflow                                                    | Command              | Purpose                                                     |
| ----------------------------------------------------------- | -------------------- | ----------------------------------------------------------- |
| `[node-tens.yml](../.github/workflows/node-tens.yml)`       | `npm run tests-only` | Matrix Node 10.17–19, **no lint** in this job.              |
| `[node-pretest.yml](../.github/workflows/node-pretest.yml)` | pretest pipeline     | Lint / pretest checks via shared `ljharb/actions` workflow. |


**Implication:** Getting **only** `tests-only` green is necessary but not sufficient for a full `npm test` green; **lint** (including eclint) must pass separately. Optionally document in CI docs or add a job that runs `npm test` end-to-end if desired later.

## Suggested workstreams (recommended order)

### 1. Baseline — tests

- Run `npm run tests-only` on a clean tree; record **failing files** and whether failures are stack-order, timing, or logic.
- Triage: **fix in product** vs **fix expectation in test** vs **skip with reason** (document in triage or commit message).
- Pay attention to **spawned subprocess** tests (`test/import/`, exit tests, etc.): align with upstream commits flagged **pending** in `[tape-upstream-triage-v5.5.3-v5.9.0.md](./tape-upstream-triage-v5.5.3-v5.9.0.md)` (e.g. `d1987c0` import spawn, `9133c93` throws tests cleanup) where applicable.

### 2. Baseline — EditorConfig / eclint

- `npm run prelint` → **eclint** over tracked files (see `prelint:files` in `package.json`).
- `**.editorconfig`**: `indent_style = tab` for most `*.js`; `*.md` uses spaces; `readme.markdown` has relaxed rules. Fix files that use spaces where tabs are required, or adjust scoped `[path]` rules only if the team agrees (prefer fixing whitespace to match existing convention).

### 3. ESLint

- `eslint --ext .js,.cjs,.mjs . bin/*` — resolve violations with minimal diffs; avoid drive-by style churn in unrelated files.

### 4. TypeScript typings smoke test

- `tsc --noEmit test/typings.ts` — keep `index.d.ts` aligned with public API (Phase F added methods such as `assertion`).

### 5. Webpack browser bundle

- `webpack --mode production --bail ./index.js` — fix config or imports if the bundle fails; confirms browser entry still builds.

### 6. Optional — pending triage rows (non-blocking batches)

- **Meta / dev-deps / actions** rows still **pending** in the triage table (e.g. exports simplification, dev-deps cleanup, tap-parser bump): batch into small PRs or mark **omit** with one-line rationale if not worth the churn.
- **Risk 7** upstream test commits: triage already shows **omit** for `through`-specific tests; do not resurrect unless a failing gate truly requires analogous coverage for this fork.

### 7. Optional — compatibility suite

- **`npm run tests-compat`** runs [`test/compat/*.js`](../test/compat/) (consumer-contract smoke tests). See [`test/compat/README.md`](../test/compat/README.md). Wire into CI as a separate job if desired; main regression coverage remains **`npm run tests-only`** (`test/*.js`).

## Verification checklist

- `npm run tests-only` — exit 0 on target Node(s).
- `npm run tests-compat` — exit 0 (also runs in **`pretest`** before `tests-only`).
- `npm run prelint` / `npm run eclint` — exit 0.
- `npm run lint` — exit 0 (full chain).
- `npm test` — exit 0 (`pretest` = lint + compat, then main tap suite; `posttest` audit may need network).

## Exit criteria (working definition)

- **Required:** `tests-only` and `lint` both pass on the branch intended for release; no known silent skips that hide regressions (documented `tap.skip` / env skips are acceptable).
- **CI:** Required workflows green on the PR; optional Node 20+ / future workflows treated per existing repo policy (`[node-twenties.yml](../.github/workflows/node-twenties.yml)`, `[node-future.yml](../.github/workflows/node-future.yml)`).
- **Triage:** Remaining **pending** rows either landed, **omit** with rationale, or explicitly deferred to a later release (listed in triage or changelog).

## Notes

- **Node 25+** non-blocking is a **project goal** in the triage doc; do not block Phase G on newest Node if policy keeps those jobs informative only.
- `**npm test` posttest** runs production audit; failures may be advisory—decide whether Phase G treats audit as hard gate or documents exceptions.

