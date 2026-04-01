# Compatibility suite (`test/compat/`)

Small, fast tests that lock the **consumer-facing contract**: the package loads, documented exports exist, and core APIs behave without brittle full-TAP snapshots.

Run from the repo root:

```sh
npm run tests-compat
```

Compat also runs in **`npm run pretest`** (before `tests-only`). Full baseline logs including compat are produced by **`npm run test:baseline`** (see `scripts/README-baseline.md`).

The main regression suite is `npm run tests-only` (`test/*.js`). Compat tests intentionally avoid stack-sensitive golden TAP; use them for smoke checks, release gates, or CI jobs that only need “does the published API work?”

## Files

| File | Focus |
|------|--------|
| `smoke.js` | Default export is callable; minimal `t.end()` |
| `exports.js` | `createHarness`, `Test`, `only`, `skip`, `onFinish`, `onFailure`, `createStream` |
| `harness-stream.js` | `createHarness({ exit: false })` + text TAP stream shape |
| `assertions-core.js` | `equal`, `deepEqual`, `ok`, `throws`, `plan` / `end` |
| `api-extensions.js` | `capture`, `captureFn`, `intercept`, `assertion` |
| `env-todo-is-ok.js` | `TODO_IS_OK=1` and todo assertions (via `mock-property`) |
| `deep-imports.js` | Modules behind `package.json` `exports` (`lib/test`, `lib/results`, …) |
