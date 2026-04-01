# tape upstream triage: v5.5.3 .. v5.9.0 (tape-testing/tape)

**Location:** `project-goals/tape-upstream-triage-v5.5.3-v5.9.0.md`

**Regenerate:** `python3 scripts/triage-tape-commits.py /path/to/tape`

## Phases A–G (brief; no per-commit tracking here)

| Phase | What it covered |
|-------|-----------------|
| A | Triage status column bootstrapped from git history on branch sync/phase-a. |
| B | Risk-2 dependency alignment (semver batch on sync/phase-b); lib deps such as hasown wired for the fork. |
| C | Risk-3 CLI parity for bin/fresh-tape (e.g. ignore-pattern, strict, literal paths); CLI uses import-or-require without a has-dynamic-import probe (Option B). |
| D | Risk-4 "replace" workstreams: stay on readable-stream instead of @ljharb/through/resumer; objectMode paths use Writable; nullish-safe default_stream writes; IE-era rows omitted. |
| E | Risk-5 lib-only upstream parity in lib/ (harness, Results, Test, intercept stack, throws, stack/at, assertion, perf cleanups). Out of scope: full tests-only green and eslint/eclint as gates. |
| F | Risk-6 API-only upstream parity. Details: [`Phase_F.md`](./Phase_F.md). Same exclusions as Phase E. |
| G | Quality gates: `tests-only` green, `lint` (eclint, eslint, typings, webpack), `npm test` alignment with CI. Details: [`Phase_G.md`](./Phase_G.md). |

**Phase F plan:** [`Phase_F.md`](./Phase_F.md)

**Phase G plan:** [`Phase_G.md`](./Phase_G.md)

## Project goals (fresh-tape fork)

- "Done" for the 5.9.0 release line: ship a small compatibility suite (test/compat/) plus main tests green.
- Stay on readable-stream + current architecture (not @ljharb/through); use action=replace rows accordingly.
- Node: engines >=10.17 (CLI uses dynamic import via import-or-require; no has-dynamic-import probe). CI: required tests on 10.17–24; 25+ runs as non-blocking.
- Releases: publish 5.9.0 next; subsequent releases track upstream tape version tags.

## Columns

| risk | action | triage | status | sha | subject |
|------|--------|--------|--------|-----|---------|
| (number or `-`) | cherry-pick / reimplement / replace / skip | meta, lib, deps, … | done / pending / omit / skip | 7-char git sha | upstream subject line |

### risk — recommended merge order (lowest risk first)

1. meta + tests cherry-picks (tooling, docs, test harness)
2. deps cherry-picks (semver bumps)
3. CLI cherry-picks (bin/fresh-tape parity)
4. replace (same behavior, re-express for readable-stream / fork deps)
5. reimplement lib
6. reimplement API
7. reimplement tests (after core behavior)
- skip (no merge)

action / triage — see scripts/triage-tape-commits.py; override cells as needed.

### status (sync/phase-a / phase-b progress)

- **done** — in history as this upstream sha, or same subject line in git log, or commit message cites `(upstream <sha>)` / `(partial upstream <sha>)`; Phase B: risk-2 semver rows may be satisfied by batch dep alignment vs each SHA.
- **skip** — triage row is skip (version tags, not applicable).
- **omit** — intentionally skipped (fork paths, risky eslint-only diffs, …).
- **pending** — not merged yet or not matched by the rules above (verify manually). Risk-2 hasown + mock-property: landed with lib `has` → `hasown` (see package.json).

Phase F (planned, sync/phase-f): track risk-6 "reimplement API" rows; full plan in [`Phase_F.md`](./Phase_F.md).

## Upstream commits (triage table)

| risk | action | triage | status | sha | subject |
|------|--------|--------|--------|-----|---------|
| 1 | cherry-pick | meta | done | `5a52443` | [meta] remove unused travis.yml file |
| 1 | cherry-pick | meta | done | `3960ccf` | [Dev Deps] update `eslint`, `@ljharb/eslint-config` |
| 2 | cherry-pick | deps | done | `64677e0` | [Deps] update `minimist` |
| 1 | cherry-pick | meta | done | `7c6dbbd` | [meta] improve `prelint` script when no `.git` dir is present |
| 1 | cherry-pick | meta | done | `48896e8` | [meta] ensure `prelint` works on windows |
| 5 | reimplement | lib | done | `9dbe9ad` | [Robustness] `test` observably looks up `exec` on the object |
| 1 | cherry-pick | tests | done | `53d9e18` | [Tests] handle a broken error `cause` in node 16.9/16.10 |
| - | skip | meta | skip | `678b922` | v4.15.1 |
| 5 | reimplement | lib | done | `330f8d5` | [Robustness] `test` observably looks up `exec` on the object |
| 5 | reimplement | lib | done | `4575ca4` | [Robustness] `test` observably looks up `exec` on the object |
| 1 | cherry-pick | meta | done | `7d31894` | [meta] add SECURITY.md |
| 1 | cherry-pick | meta | done | `7b0c901` | [meta] add SECURITY.md |
| 1 | cherry-pick | tests | done | `3e7b2ae` | [Tests] fix no_only tests on Windows |
| 1 | cherry-pick | tests | done | `f35f71b` | [Tests] fix no_only tests on Windows |
| 1 | cherry-pick | meta | done | `f7e3161` | [meta] create FUNDING.yml |
| 1 | cherry-pick | meta | done | `5b4752f` | [meta] create FUNDING.yml |
| 1 | cherry-pick | meta | done | `6bc8c38` | [Dev Deps] update `@ljharb/eslint-config`, `array.prototype.flatmap`, `es-value-fixtures` |
| 2 | cherry-pick | deps | done | `1a245c6` | [Deps] update `string.prototype.trim` |
| 1 | cherry-pick | meta | done | `12cc602` | [meta] use `npmignore` to autogenerate an npmignore file |
| 1 | cherry-pick | tests | done | `775ba37` | Revert "[Tests] handle a broken error `cause` in node 16.9/16.10" |
| 1 | cherry-pick | meta | done | `20ea48d` | [readme] fix version badge |
| 1 | cherry-pick | meta | done | `85d86a4` | [meta] fix repo URLs |
| 1 | cherry-pick | meta | omit | `b035590` | [eslint] fix indentation |
| 1 | cherry-pick | tests | done | `65df5a4` | [Tests] `stackTrace`: use the common `getDiag` utility |
| 1 | cherry-pick | meta | omit | `87deb68` | [eslint] enforce `no-use-before-define` |
| 1 | cherry-pick | meta | omit | `75c0c3a` | [eslint] enable `func-style` |
| 1 | cherry-pick | meta | done | `3171edd` | [eslint] clean up config a bit |
| 1 | cherry-pick | meta | done | `1645abb` | [meta] use `npmignore` to autogenerate an npmignore file |
| - | skip | lib | skip | `83d4da8` | [Fix] in node v0.4, `stream.pipe` returns `undefined` |
| 1 | cherry-pick | meta | done | `6b8e118` | [Dev Deps] update `es-value-fixtures` |
| 2 | cherry-pick | deps | done | `f6f39a2` | [Deps] update `glob`, `object-inspect`, `object.assign` |
| 3 | cherry-pick | CLI | done | `e23ec12` | [New] `bin/tape`: include the exact arg when there are no glob results; use require.resolve on `--require` files |
| 1 | cherry-pick | meta | done | `934d49b` | [Dev Deps] update `@ljharb/eslint-config`, `array.prototype.flatmap`, `es-value-fixtures`, `falafel` |
| 2 | cherry-pick | deps | done | `6a3c200` | [Deps] update `glob`, `object-inspect`, `resolve`, `string.prototype.trim` |
| 3 | cherry-pick | CLI | done | `fbdbfc9` | [Refactor] `bin/tape`: make it a bit more functional, for easier v5 backporting |
| 3 | cherry-pick | CLI | done | `6a1ce43` | [New] `bin/tape`: include the exact arg when there are no glob results; use require on `--require` files |
| - | skip | meta | skip | `6d9e782` | v5.6.0 |
| - | skip | meta | skip | `f4c7214` | v4.16.0 |
| 1 | cherry-pick | tests | done | `23fac16` | Revert "[Tests] handle a broken error `cause` in node 16.9/16.10" |
| 1 | cherry-pick | meta | done | `74e6c9e` | [readme] fix version badge |
| 1 | cherry-pick | meta | done | `a9ae3c2` | [meta] fix repo URLs |
| 1 | cherry-pick | meta | omit | `2151e06` | [eslint] fix indentation |
| 1 | cherry-pick | tests | done | `298cb80` | [Tests] `stackTrace`: use the common `getDiag` utility |
| 1 | cherry-pick | meta | omit | `f8a8a7f` | [eslint] enforce `no-use-before-define` |
| 1 | cherry-pick | meta | omit | `98b9623` | [eslint] enable `func-style` |
| 1 | cherry-pick | meta | done | `67ad201` | [eslint] clean up config a bit |
| 2 | cherry-pick | deps | done | `3327fdd` | [Deps] update `object.assign` |
| 1 | cherry-pick | meta | done | `b467b85` | [meta] add `auto-changelog` |
| 1 | cherry-pick | meta | done | `86cbbd1` | [meta] add `auto-changelog` |
| - | skip | meta | skip | `8dd3f07` | 4.16.1 |
| 1 | cherry-pick | meta | done | `5d11d84` | [meta] add missing npmrc config |
| - | skip | meta | skip | `996b2a0` | v5.6.1 |
| 1 | cherry-pick | meta | done | `15e2175` | [meta] add missing npmrc config |
| 1 | cherry-pick | meta | pending | `2f61eac` | [Dev Deps] update `tap-parser` |
| 1 | cherry-pick | meta | done | `ce81cbe` | [eclint] fix editorconfig |
| 1 | cherry-pick | meta | done | `f0fe7c0` | [Dev Deps] update `aud` |
| 2 | cherry-pick | deps | done | `83695c0` | [Deps] update `defined`, `minimist`, `resolve` |
| 1 | cherry-pick | meta | done | `b3d724e` | [actions] update rebase action |
| 1 | cherry-pick | meta | done | `8b8bf07` | [Dev Deps] update `array.prototype.flatmap` |
| 2 | cherry-pick | deps | done | `e9c9aba` | [Deps] update `array.prototype.every`, `deep-equal`, `string.prototype.trim` |
| 3 | cherry-pick | CLI | done | `8c9fe8e` | [New] `bin/tape`: add `--ignore-pattern` flag |
| 1 | cherry-pick | meta | done | `afd8f64` | [Dev Deps] update `@ljharb/eslint-config`, `aud` |
| 2 | cherry-pick | deps | done | `09906f3` | [Deps] update `deep-equal`, `object-inspect` |
| 5 | reimplement | lib | done | `0cd7a2c` | [Fix] `throws`: avoid crashing on a nonconfigurable or nonextensible `expected` |
| - | skip | meta | skip | `40f6ad3` | v5.6.2 |
| - | skip | meta | skip | `23aa477` | v5.6.3 |
| 1 | cherry-pick | meta | pending | `1b3ad24` | [Dev Deps] update `@ljharb/eslint-config`, `array.prototype.flatmap`, `aud` |
| 2 | cherry-pick | deps | done | `01edce8` | [Deps] update `defined`, `minimist`, `object-inspect`, `string.prototype.trim` |
| 1 | cherry-pick | meta | done | `834453c` | [actions] update rebase action |
| 5 | reimplement | lib | done | `0731b5f` | [Fix] `throws`: avoid crashing on a nonconfigurable or nonextensible `expected` |
| - | skip | meta | skip | `a892b65` | v4.16.2 |
| 1 | cherry-pick | meta | done | `c1b619d` | [readme] improve t.throws description for Function |
| 2 | cherry-pick | deps | done | `7e7c3d0` | [Deps] update `minimist` |
| 1 | cherry-pick | tests | done | `c656ee5` | [Tests] simplify tests |
| 1 | cherry-pick | tests | done | `83bc381` | [Tests] simplify tests |
| 1 | cherry-pick | meta | done | `0e80800` | [Dev Deps] pin `jackspeak` since 2.1.2+ depends on npm aliases, which kill the install process in npm < 6 |
| 1 | cherry-pick | meta | done | `26a75bb` | [readme] Link to explain what TAP is |
| 1 | cherry-pick | meta | done | `a576f8d` | [Dev Deps] pin `jackspeak` since 2.1.2+ depends on npm aliases, which kill the install process in npm < 6 |
| 5 | reimplement | lib | done | `e244e64` | [Refactor] `Test`: skip binding for a non-function value |
| 1 | cherry-pick | meta | done | `a6a5eee` | [Dev Deps] update `@ljharb/eslint-config`, `aud` |
| 2 | cherry-pick | deps | done | `2043b2e` | [Deps] update `deep-equal` |
| 5 | reimplement | lib | done | `70de437` | [Performance] use `call-bind` for autobinding |
| - | skip | meta | skip | `41fc81a` | v5.6.4 |
| 2 | cherry-pick | deps | done | `109a791` | [Deps] update `deep-equal` |
| 5 | reimplement | lib | done | `9bbbcfe` | [Fix] Results: show a skip string on tests, not just on assertions |
| - | skip | meta | skip | `fea1937` | v5.6.5 |
| 4 | replace | deps | omit | `c99680a` | [Deps] switch from `through` and `resumer` to `@ljharb/through` and `@ljharb/resumer` |
| 1 | cherry-pick | meta | pending | `7123111` | [Dev Deps] update `@ljharb/eslint-config`, `array.prototype.flatmap`, `aud` |
| 2 | cherry-pick | deps | done | `feee094` | [Deps] update `minimist`, `resolve`, `string.prototype.trim` |
| - | skip | deps | skip | `a8a7d67` | [Deps] switch from `through` and `resumer` to `@ljharb/through` and `@ljharb/resumer` |
| - | skip | meta | skip | `e8c56b7` | v5.6.6 |
| 1 | cherry-pick | meta | done | `1b3e0b1` | Revert "[meta] ensure `not-in-publish`‘s absence does not fail anything" |
| 1 | cherry-pick | meta | done | `92aaa51` | Revert "[meta] ensure `not-in-publish`‘s absence does not fail anything" |
| 1 | cherry-pick | meta | done | `df46769` | [Dev Deps] update `array.prototype.flatmap` |
| 2 | cherry-pick | deps | done | `4e2db4d` | [Deps] update `array.prototype.every`, `glob`, `string.prototype.trim` |
| 5 | reimplement | lib | done | `5ba89c9` | [Performance] use inline `typeof` |
| 5 | reimplement | lib | done | `135a952` | [Refactor] prefer second `.then` arg over `.catch` |
| 6 | reimplement | API | done | `9e21f7a` | [New] add `t.capture` and `t.captureFn`, modeled after tap |
| 5 | reimplement | lib | done | `c45db4e` | [Performance] use inline `typeof` |
| 6 | reimplement | API | done | `3d96d69` | [New] add `t.capture` and `t.captureFn`, modeled after tap |
| 6 | reimplement | API | done | `5d37060` | [New] add `t.intercept()` |
| 6 | reimplement | API | done | `e60aeca` | [New] add `t.intercept()` |
| - | skip | meta | skip | `e1ce53b` | v5.7.0 |
| - | skip | meta | skip | `9851ca2` | v4.17.0 |
| 4 | replace | deps | omit | `9135b40` | [Deps] update `@ljharb/through`, `resolve` |
| 5 | reimplement | lib | omit | `13f23ed` | [Fix] `default_stream`: add handling for IE < 9 |
| - | skip | meta | skip | `5a77657` | v5.7.1 |
| 2 | cherry-pick | deps | done | `de34703` | [Deps] update `call-bind`, `mock-property`, `object-inspect` |
| 7 | reimplement | tests | omit | `56d7a8b` | [Tests] use `through` properly |
| 5 | reimplement | lib | done | `489736a` | [Refactor] use `hasown` instead of `has` |
| - | skip | meta | skip | `3404436` | v5.7.2 |
| 2 | cherry-pick | deps | done | `d90c29a` | [Deps] update `mock-property` |
| 2 | cherry-pick | deps | done | `5d26485` | [Deps] update `deep-equal` |
| 1 | cherry-pick | meta | pending | `19af506` | [actions] skip `engines` check since bin/tape and the rest of the lib conflict |
| 1 | cherry-pick | tests | pending | `d1987c0` | [Tests] ensure the import tests spawn properly |
| 5 | reimplement | lib | done | `af4d109` | [Refactor] `Test`: cleaner `at` logic |
| 5 | reimplement | lib | done | `4640a91` | [Fix] `intercept`: give a proper error message with a readonly Symbol property |
| 5 | reimplement | lib | done | `9cbae8a` | [Fix] stack trace path parsing on windows |
| 3 | cherry-pick | CLI | done | `a2b74f9` | [Fix] `bin/tape`: ignore options on windows |
| 1 | cherry-pick | tests | done | `4a57fbe` | [Tests] Spawn processes during tests using execPath so that the tests pass on windows |
| 1 | cherry-pick | tests | done | `bcf6ce7` | [Tests] fix `npm test` on windows |
| 1 | cherry-pick | meta | done | `ceabd99` | [Dev Deps] update `aud`, `npmignore` |
| 2 | cherry-pick | deps | done | `201e650` | [Deps] update `object.assign` |
| 5 | reimplement | lib | done | `78fd0d6` | [Performance] avoid the extra call frame to `new` it |
| 5 | reimplement | lib | done | `8a1cccc` | [Fix] `createHarness`: when no `conf` is provided, `only` should not throw |
| 5 | reimplement | lib | done | `19cfc8f` | [Refactor] `getHarness`: avoid mutating `opts`, account for only one internal callsite for `createExitHarness` |
| 5 | reimplement | lib | done | `878a500` | [Refactor] `Results` `createStream`: clean up `_push` handler |
| 5 | reimplement | lib | done | `dc64c08` | [Refactor] `_assert`: avoid reassigning arguments |
| 5 | reimplement | lib | omit | `f6d30cf` | [Refactor] `Test`: a more precise check |
| 5 | reimplement | lib | done | `5f831b4` | [Refactor] `Results`: use `this` instead of `self` |
| 1 | cherry-pick | meta | done | `85f593b` | [meta] add `sideEffects` flag |
| - | skip | meta | skip | `56569c3` | v5.7.3 |
| - | skip | deps | skip | `1e50cb3` | [Deps] update `has-dynamic-import` |
| 5 | reimplement | lib | done | `6a5df50` | [Fix] handle native ESM URLs in `at:` |
| - | skip | meta | skip | `22befd6` | v5.7.4 |
| 4 | replace | deps | omit | `ad0dd2e` | [Deps] update `@ljharb/resumer` |
| 4 | replace | deps | omit | `5360d20` | [Deps] update `@ljharb/through` |
| 1 | cherry-pick | tests | pending | `9133c93` | [Tests] clean up throws tests |
| 5 | reimplement | lib | done | `1b2681d` | [Fix] `throws`: fix crash when throwing primitives with a non-empty expected object |
| 4 | replace | deps | omit | `bff9dad` | [Deps] update `@ljharb/resumer` |
| 5 | reimplement | lib | done | `eff3725` | [Fix] `default_stream`: do not error on nullish data |
| 4 | replace | deps | omit | `af2fe68` | [Deps] update `@ljharb/resumer` |
| 2 | cherry-pick | deps | done | `82e7d71` | [Deps] update `call-bind`, `hasown` |
| - | skip | lib | skip | `93c1d12` | [Fix] in IE 8, `TypeError` does not inherit from `Error` |
| 1 | cherry-pick | meta | pending | `410e9e4` | [actions] remove redundant finisher |
| - | skip | meta | skip | `70d8f91` | v5.7.5 |
| 1 | cherry-pick | meta | done | `77cabeb` | [meta] update URLs |
| 1 | cherry-pick | meta | done | `d39cb8d` | [meta] simplify `exports` |
| 6 | reimplement | API | done | `6cd06f5` | [New] allow TODO tests to be "ok" with env var `TODO_IS_OK` |
| 5 | reimplement | lib | done | `ce4ce8a` | [Refactor] `Test`: minor tweaks |
| 1 | cherry-pick | meta | pending | `f9eac5b` | [meta] simplify `exports` |
| 2 | cherry-pick | deps | done | `1b01656` | [Deps] update `object-is` |
| 1 | cherry-pick | meta | pending | `eafacf6` | [Dev Deps] remove unused `intl-fallback-symbol`, `is-core-module` |
| 5 | reimplement | lib | done | `91a83b6` | [Refactor] `test`: reduce binding by using polyfill entrypoints |
| 4 | replace | deps | omit | `77952d0` | [Deps] update `@ljharb/resumer`, `@ljharb/through`, `hasown` |
| 1 | cherry-pick | tests | done | `aa7de58` | [Tests] increase coverage |
| 2 | cherry-pick | deps | done | `732268b` | [Deps] update `array.prototype.every`, `string.prototype.trim` |
| 1 | cherry-pick | tests | done | `8d40837` | [Tests] strip node’s deprecation warnings |
| 1 | cherry-pick | meta | done | `7b39e14` | [Dev Deps] update `@ljharb/eslint-config` |
| 6 | reimplement | API | done | `7ba18ac` | [New] add `t.assertion` |
| 1 | cherry-pick | tests | done | `d2f0778` | [Tests] handle more stack trace variation in Node v0.8 |
| - | skip | meta | skip | `998d9cd` | v5.8.0 |
| 5 | reimplement | lib | done | `2ad86d4` | [Fix] `assertion`: pass through assertion return value, for promises |
| 1 | cherry-pick | meta | omit | `7c84990` | [meta] fix URLs |
| - | skip | meta | skip | `e52bb18` | v5.8.1 |
| 1 | cherry-pick | meta | done | `7880dd4` | [readme] remove defunct badges |
| 1 | cherry-pick | meta | done | `c827ac9` | [readme] notLooseEqual(s) is not an alias for notDeepLooseEqual |
| 2 | cherry-pick | deps | done | `9a47aba` | [Deps] update `object-inspect` |
| 1 | cherry-pick | tests | done | `681d4bd` | [Tests] use `npm audit` instead of `aud` |
| 2 | cherry-pick | deps | done | `ecfb546` | [Deps] update `mock-property` |
| 1 | cherry-pick | meta | done | `b7bc72f` | [Dev Deps] update `auto-changelog` |
| 1 | cherry-pick | meta | done | `627d1e7` | [Dev Deps] add missing peer dep |
| - | skip | CLI | skip | `2d5c8dc` | [Fix] in engines that lack dynamic import, have some output |
| 3 | cherry-pick | CLI | done | `4c97f54` | [New] `bin/tape`: add `--strict` |
| - | skip | meta | skip | `fd9cf6d` | v5.9.0 |

### Summary counts

#### By risk

| risk | count |
|------|-------|
| - | 26 |
| 1 | 77 |
| 2 | 23 |
| 3 | 6 |
| 4 | 7 |
| 5 | 29 |
| 6 | 6 |
| 7 | 1 |

#### By action

| action | count |
|--------|-------|
| cherry-pick | 106 |
| reimplement | 36 |
| replace | 7 |
| skip | 26 |

#### By triage

| triage | count |
|--------|-------|
| API | 6 |
| CLI | 7 |
| deps | 32 |
| lib | 31 |
| meta | 81 |
| tests | 18 |
