# Pull request: Tape 5.9.0 API parity; CI, tooling, and test robustness; drop node < 12 support

**Published as** `@gaurav9576/fresh-tape@5.9.1` for anyone who would like to test it in their projects.

**Target:** [martinheidegger/fresh-tape](https://github.com/martinheidegger/fresh-tape) `main`

**See tests passing:** https://github.com/Gaurav0/fresh-tape

## Summary

[fresh-tape](https://github.com/martinheidegger/fresh-tape) is a TAP-producing harness that tracks [tape](https://www.npmjs.com/package/tape) while updating dependencies so the package **works with webpack and modern tooling**—something upstream tape’s dependency constraints make difficult. This PR does not change the public API: **`fresh-tape` remains fully API-compatible with tape 5.9.0** (same surface as documented for that release; TypeScript definitions align with the tape 5.9.x API per `CHANGELOG.md` **[Unreleased]**).

The changes below fix **CI** across Node 10–11, current LTS, and **Node 22+**, align **tap** invocation with how the suite is written (CommonJS), improve **install** ergonomics for non-npm clients, and fix a few **tests** that had drifted from the repo.

---

## API compatibility (tape 5.9.0)

- **Programmatic API** matches **tape 5.9.0**: `test`, `createHarness`, `Test`, assertions, streams, `only` / `skip` / `todo`, async tests, etc.
- **`index.d.ts`** and `test/typings.ts` are maintained for the tape 5.9.x shape (see **Changed → Type definitions** in `CHANGELOG.md` **[Unreleased]**).
- **CLI differences** from upstream `tape` remain as documented in **README.md** (“CLI: ESM and dynamic `import`”): the `fresh-tape` binary always routes test files through `import-or-require` (dynamic `import()` for ESM). That is intentional and separate from the **library** API parity above.

---

## Changes (this PR)

### Tests

- **`test/cli-literal-path.js`** — Update the expected TAP substring to match the current compat smoke test name in `test/compat/smoke.js` (`compat: smoke — loads and exports harness`).
- **`test/import.js`** — On **Node 10.x and 11.x** (`semver` `^10 || ^11`), skip ESM-heavy suites: importing `.mjs`, `package.json` `"type": "module"`, and **errors importing test files**. Those versions do not match Node 12+ exit codes / loader behavior for dynamic `import()` in this harness.
- **`test/stackTrace.js`** — On Node 10/11, skip the **ESM** subtest under “CJS vs ESM: `at`”. ESLint: satisfy `no-extra-parens` on the `skip` option.

### Dependencies & packaging

- Replace the **`readable-stream` tarball** with a normal dependency `**@leichtgewicht/readable-stream@3.6.0**` and update `**require()**` call sites. Keeps the same streams3 userland stack the README relies on for **webpack-friendly** builds.
- **`prepublish`**: replace the old `not-in-publish || npm run prepublishOnly` pattern (problematic when **`npm`** is not the script runner, e.g. **bun** / **pnpm**) with a **no-op** `prepublish` so tooling that expects the script name still sees it; **`prepublishOnly`** continues to run **`safe-publish-latest`** on publish.
- Remove unused **`in-publish`** devDependency.

### `tap` / CI (Node 22+)

**node-tap** defaults **`coverage: true`**, which respawns the runner under **`nyc`** and **`spawn-wrap`**. That stack can fail on **Node 22** (e.g. errors inside the spawn-wrap shim). **`--no-check-coverage` alone does not disable instrumentation.**

- Add **`--no-coverage`** so tests run without nyc/spawn-wrap.
- Add **`--no-esm`** so child processes do not preload tap’s legacy **`esm`** loader for plain `.js` tests (this repo’s tests are CommonJS).

Applied in **`package.json`** (`tests-only`, `tests-compat`, `tests-only:windows`, `test:example`) and **`scripts/run-baseline.sh`** (tap stages).

---

## Relationship to `CHANGELOG.md` / `README.md`

- **CHANGELOG.md** **[Unreleased]** already records fork-specific dependency and typing work; this PR’s CI/test/packaging edits complement that story (reliable tests on all supported Node versions, cleaner installs).
- **README.md** documents webpack compilation, TAP output, CLI flags (`--strict`, `-r`), and the ESM CLI note above—none of that is contradicted by these changes; tests are adjusted only where **Node 10/11** cannot match ESM integration expectations.

---

## Testing

- `npm run lint`
- `npm run tests-only` / `npm run tests-compat`
- Optional: `npm run test:baseline`

---

## Notes

- For **coverage** via tap locally, invoke **`tap`** with coverage enabled explicitly; default **`npm run tests-only`** prioritizes **stable CI** across Node versions.
