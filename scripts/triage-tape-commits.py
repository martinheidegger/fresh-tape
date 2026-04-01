#!/usr/bin/env python3
"""Triage helper: upstream tape v5.5.3..v5.9.0 — kind + merge action for fresh-tape."""
import re
import subprocess
import sys

CATEGORIES = ("API", "CLI", "lib", "deps", "meta", "tests")
# longest: cherry-pick
ACTIONS = ("cherry-pick", "reimplement", "skip", "replace", "TBD")

# Identical subject appears twice on parallel branches; apply only once.
_DEDUPE_SUBJECTS = frozenset(
    [
        "[Deps] switch from `through` and `resumer` to `@ljharb/through` and `@ljharb/resumer`",
    ]
)


def triage(subject: str) -> str:
    s = subject.strip()
    if re.match(r"^v?\d+\.\d+\.\d+", s) and not s.startswith("["):
        return "meta"

    if s.startswith("[Tests]"):
        return "tests"
    if s.startswith("[readme]"):
        return "meta"
    if s.startswith("[Deps]"):
        return "deps"
    if s.startswith("[Dev Deps]"):
        return "meta"
    if s.startswith("[meta]"):
        return "meta"
    if s.startswith("[eslint]") or s.startswith("[eclint]"):
        return "meta"
    if s.startswith("[actions]"):
        return "meta"

    if s.startswith("Revert "):
        if "not-in-publish" in s or "meta" in s.lower():
            return "meta"
        if "Tests" in s or "cause" in s:
            return "tests"
        return "lib"

    if s.startswith("[New]"):
        if "`bin/tape`" in s or "bin/tape" in s:
            return "CLI"
        return "API"

    if s.startswith("[Fix]"):
        if "`bin/tape`" in s or "bin/tape" in s:
            return "CLI"
        if "dynamic import" in s:
            return "CLI"
        return "lib"

    if s.startswith("[Refactor]"):
        if "`bin/tape`" in s or s.startswith("[Refactor] `bin/tape`"):
            return "CLI"
        return "lib"

    if s.startswith("[Performance]"):
        return "lib"
    if s.startswith("[Robustness]"):
        return "lib"

    low = s.lower()
    if "bin/tape" in low or "`bin/tape`" in s:
        return "CLI"
    if "dev deps" in low or "eslint" in low:
        return "meta"
    return "lib"


def action(subject: str, kind: str, dedupe_seen: set) -> str:
    """How to absorb this commit into fresh-tape (heuristic — adjust rows that still say TBD)."""
    s = subject.strip()
    sl = s.lower()

    # --- skip: no longer relevant or already handled on the fork ---
    if "node v0.4" in sl:
        return "skip"
    if "ie < 9" in s or "ie 8" in sl:
        return "skip"
    if "node v0.8" in subject:
        return "skip"
    if "update `has-dynamic-import`" in s:
        return "skip"
    if "lack dynamic import" in sl and "output" in sl:
        return "skip"  # fresh-tape targets Node 12+; change to reimplement if you widen engines

    # Release-only tag lines (no patch to apply by itself)
    if re.match(r"^v?\d+\.\d+\.\d+\s*$", s) or re.match(r"^\d+\.\d+\.\d+\s*$", s):
        return "skip"

    # Rare: exact same patch message landed twice (e.g. 4.x and 5.x ports)
    if s in _DEDUPE_SUBJECTS:
        if s in dedupe_seen:
            return "skip"
        dedupe_seen.add(s)

    # --- replace: same intent, different deps / stream stack vs fresh-tape ---
    if "switch from `through`" in s or "`through` and `resumer`" in s:
        return "replace"
    if "@ljharb/through" in s or "@ljharb/resumer" in s:
        return "replace"

    # --- cherry-pick: likely applies cleanly ---
    if kind == "tests" and "through" in sl:
        return "reimplement"
    if kind in ("meta", "tests"):
        return "cherry-pick"
    if kind == "deps":
        return "cherry-pick"
    if kind == "CLI":
        return "cherry-pick"

    # --- reimplement: merge by hand against fork (streams, Test, etc.) ---
    if kind == "API":
        return "reimplement"
    if kind == "lib":
        return "reimplement"

    return "TBD"


def risk_order(act: str, kind: str) -> str:
    """Recommended merge order: 1 = lowest risk first; 7 = last; - = skip."""
    if act == "skip":
        return "-"
    if act == "cherry-pick":
        if kind == "meta":
            return "1"
        if kind == "tests":
            return "1"
        if kind == "deps":
            return "2"
        if kind == "CLI":
            return "3"
    if act == "replace":
        return "4"
    if act == "reimplement":
        if kind == "lib":
            return "5"
        if kind == "API":
            return "6"
        if kind == "tests":
            return "7"
    return "?"


def main() -> None:
    tape = sys.argv[1] if len(sys.argv) > 1 else "../tape"
    rng = sys.argv[2] if len(sys.argv) > 2 else "v5.5.3..v5.9.0"
    out = subprocess.check_output(
        ["git", "-C", tape, "log", rng, "--no-merges", "--reverse", "--format=%h %s"],
        text=True,
    )
    lines = [ln for ln in out.strip().splitlines() if ln.strip()]
    wk = max(max(len(c) for c in CATEGORIES), len("triage"))
    wa = max(len(a) for a in ACTIONS)

    dedupe_seen = set()
    rows = []
    for ln in lines:
        sha, _, rest = ln.partition(" ")
        kind = triage(rest)
        act = action(rest, kind, dedupe_seen)
        risk = risk_order(act, kind)
        rows.append((risk, act, kind, sha, rest))

    wr = max(len("risk"), 7)  # "risk" header + room for single digits
    print(f"{'risk':{wr}}  {'action':{wa}}  {'triage':{wk}}  sha       subject")
    print(f"{'-' * wr}  {'-' * wa}  {'-' * wk}  --------  -------")
    for risk, act, kind, sha, rest in rows:
        print(f"{risk:{wr}}  {act:{wa}}  {kind:{wk}}  {sha}  {rest}")


if __name__ == "__main__":
    main()
