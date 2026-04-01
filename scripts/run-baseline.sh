#!/usr/bin/env bash
# Run lint and test stages independently; never stop early so all failures are visible.
# Writes logs under test-baseline/. See scripts/README-baseline.md

set -u
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="${ROOT}/test-baseline"
mkdir -p "$OUT"

SUMMARY="${OUT}/summary.txt"
: >"$SUMMARY"
echo "fresh-tape baseline run — $(date -u +%Y-%m-%dT%H:%M:%SZ)" | tee -a "$SUMMARY"
echo "" | tee -a "$SUMMARY"

run_stage () {
  local name="$1"
  shift
  local logfile="${OUT}/${name}-output.txt"
  {
    echo "=== ${name} ==="
    echo "command: $*"
    echo ""
  } >"$logfile"
  ( cd "$ROOT" && "$@" ) >>"$logfile" 2>&1
  local code=$?
  echo "${name}_EXIT_CODE=${code}" >>"$logfile"
  echo "${name}: exit ${code}" | tee -a "$SUMMARY"
  return 0
}

run_stage eclint npm run eclint
run_stage eslint npx eslint --ext .js,.cjs,.mjs . bin/*
run_stage tsc npx tsc --noEmit test/typings.ts
run_stage webpack npx webpack --mode production --bail ./index.js
run_stage tap-tests npx tap -Rtap --no-coverage --no-check-coverage --no-coverage-report --no-esm --no-bail --no-color test/*.js
run_stage tap-compat npx tap -Rtap --no-coverage --no-check-coverage --no-coverage-report --no-esm --no-bail --no-color test/compat/*.js

node "${ROOT}/scripts/update-baseline-inventory.js"

{
  echo ""
  echo "---"
  echo "Logs in ${OUT}/"
  echo "  eclint-output.txt, eslint-output.txt, tsc-output.txt, webpack-output.txt, tap-tests-output.txt, tap-compat-output.txt"
  echo "  summary.txt, inventory.md"
} | tee -a "$SUMMARY"

exit 0
