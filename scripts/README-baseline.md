# Baseline test outputs (`test-baseline/`)

Machine-generated logs from a full lint + tap pass. The folder `test-baseline/` is gitignored; after `npm run test:baseline` it contains the files below.

## Run

```sh
npm run test:baseline
```

Stages (each completes even if the command exits non-zero):

1. **eclint** → `eclint-output.txt`
2. **eslint** → `eslint-output.txt`
3. **tsc** (`test/typings.ts`) → `tsc-output.txt`
4. **webpack** → `webpack-output.txt`
5. **tap** — `test/*.js` (`--no-bail`) → `tap-tests-output.txt`
6. **tap compat** — `test/compat/*.js` (`--no-bail`) → `tap-compat-output.txt`

Then `scripts/update-baseline-inventory.js` writes **`inventory.md`** (per-file status for main + compat suites).

**Summary:** `summary.txt` lists exit codes per stage.

## Files

| File | Contents |
|------|----------|
| `tap-tests-output.txt` | Full tap output for `test/*.js` |
| `tap-compat-output.txt` | Full tap output for `test/compat/*.js` |
| `inventory.md` | Tables for each `test/*.js` and `test/compat/*.js` |

`npm test` runs `pretest` (lint + compat) before `tests-only`; **`test:baseline`** runs both tap stages after lint so you can inspect all failures in the saved logs.
