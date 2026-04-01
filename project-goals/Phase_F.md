# Phase F — detailed plan (branch `sync/phase-f`; risk 6 “reimplement API”)

## Intent

- Align the **published contract** of fresh-tape with upstream tape 5.9.x for API-shaped changes:
  - package entrypoints (`package.json` `main` / `exports` / `browser`),
  - `index.js` exports (`createHarness`, default export, `Test`, compat shims),
  - `Test` instance methods and harness behavior that users import and call.
- Phase E landed behavior inside `lib/`; Phase F reconciles that work with **API** triage rows, docs, and any remaining glue so consumers see upstream-equivalent surface area.

## Exclusions (unchanged from Phase E)

- Do not block on `npm run tests-only` being fully green or on eclint/eslint as merge gates.
- Risk-7 “reimplement tests” rows stay out of scope unless a small test is strictly needed to lock an API.
- No wholesale CLI redesign beyond what’s required for documented API parity (CLI remains Phase C’s lane).

## Triage rows (risk 6 in [`tape-upstream-triage-v5.5.3-v5.9.0.md`](./tape-upstream-triage-v5.5.3-v5.9.0.md))

Verify against implementation; mark **done** when API + behavior match upstream.

- **capture / captureFn** — `9e21f7a`, `3d96d69` — **done** (implementation in `lib/test.js`, tests `test/capture.js` / `test/captureFn.js`, readme sections `t.capture` / `t.captureFn`).
- **intercept** — `5d37060`, `e60aeca` — **done** (implementation in `lib/test.js`, test `test/intercept.js`, readme section `t.intercept`).
- **TODO_IS_OK env** — `6cd06f5` — **done** (`Results` + `createHarness` in `index.js`, `test/todo.js`, readme).
- **assertion** — `7ba18ac` — **done** (implementation in `lib/test.js` incl. return passthrough per `2ad86d4`, `test/assertion.js`, readme `t.assertion`, `index.d.ts`).

## Suggested workstreams (order flexible)

1. **Inventory** — For each risk-6 row: confirm upstream’s public API (signatures, export paths, edge cases). Map to fresh-tape: already in `lib/test` / `index` vs still missing vs fork-specific omit.
2. **Exports & entrypoints** — Ensure `package.json` `exports` and `index.js` expose the same symbols and deep-import paths upstream documents (within fork constraints: e.g. `fresh-tape` name, `bin/fresh-tape`).
3. **Test prototype surface** — `capture`, `captureFn`, `intercept`, `assertion` (and any related teardown contract) match upstream naming, arity, and return values (including promises from `assertion`).
4. **Harness factory** — `createHarness` options and default export behavior consistent with upstream for API consumers (autoclose, `only`, streams); no duplicate Phase E internals work unless an API mismatch remains.
5. **TODO_IS_OK** — If adopted: document env var, wire `Test`/Results behavior; if omitted: triage row `omit` with reason.
6. **Documentation** — readme / changelog snippets for new or clarified API (minimal but accurate); optional compat notes.

## Verification (lightweight)

- Targeted tests or manual checks per feature (e.g. existing `test/capture.js`, `test/captureFn.js`, `test/intercept.js`, `test/assertion.js` when present).
- Smoke: `require('fresh-tape')`, `createHarness`, instantiate `Test`, call new methods from a tiny script.

## Exit criteria (working definition)

- All risk-6 rows either **done** (API parity) or **omit**/**skip** with a one-line rationale in triage or commit log.
- No known intentional API divergence from upstream except fork-documented exceptions (name, streams stack, etc.).

**Next:** full test and lint gates are [**Phase G**](./Phase_G.md).
