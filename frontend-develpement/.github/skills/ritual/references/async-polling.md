# Async polling contract

Use this for every long-running Ritual/MCP operation: discovery generation, agentic runs, requirement generation, build brief generation, and future async status surfaces.

## Standard poll loop — single short sleep per turn, never escalate

- **A CONSTANT, non-escalating `Bash sleep` per poll iteration — sized to the operation.** Match the Spark UI's cadence so both surfaces observe the same job at the same rate: **`sleep 10`** for discovery-question generation (Spark polls every 10s), **`sleep 20`** for agentic-run polling (Spark polls every 20s), and `sleep 10` by default for any other status poll (requirements, build brief). Keep the value CONSTANT for the whole loop — **never escalate it** (e.g. `5` → `15` → `20` → `25`), because the harness blocks chained-increasing sleeps the same way it blocks `sleep ≥ 30`. The duration is a fixed per-operation constant, NOT a backoff knob. (All values are < 30 and non-escalating → guard-safe.)
- **One sleep per turn**, not multiple in sequence. After the sleep, take a fresh turn → call the status tool → decide continue or exit.
- **`sleep ≥ 30` is hard-blocked**, regardless of context.
- **Do NOT use semicolons to chain** (`sleep 10; sleep 10`) — also blocked.
- **Total wall time is the same** — a slow op taking 2 minutes is 12 turns of `sleep 10` + status, not 4 turns of `sleep 30`.
- Print progress only when status/progress/current_step changes, or every ~2 polls (~20s) if unchanged.
- Keep updates to one line unless an error occurs.

### Wrong vs right

**Wrong** (this is what trips the harness — note each call is a separate turn, the sleep duration creeps up):

```
Turn 1:  Bash sleep 5   → status: still running
Turn 2:  Bash sleep 15  → status: still running           ← creeping up
Turn 3:  Bash sleep 20  → status: still running           ← creeping up
Turn 4:  Bash sleep 25  → BLOCKED ✗ "standalone sleep 25"
```

The harness sees the pattern and blocks. The error message literally says: *"Do not chain shorter sleeps to work around this block."*

**Right** — sleep stays at 5s every iteration; the loop ends when status reports done:

```
Turn 1:  Bash sleep 5   → status: still running
Turn 2:  Bash sleep 5   → status: still running
Turn 3:  Bash sleep 5   → status: still running
Turn 4:  Bash sleep 5   → status: still running
...
Turn N:  Bash sleep 5   → status: COMPLETED  → exit loop
```

User-facing: print `Still generating… ({percent}% if available)` every ~3 turns (~15s) when status hasn't changed, ONE line per progress change otherwise.

## Long waits — when polling >5 min, use Monitor + `until` loop instead

For genuinely long waits (>5 minutes), DO NOT keep the standard poll loop running for that long — switch to the harness's `Monitor` tool with an `until <check>; do sleep 2; done` pattern. The `until` loop is one Bash call that internally checks + sleeps + retries, so it doesn't trip the "chained successive sleeps across turns" guard.

```bash
# Inside a Monitor / single Bash call — NOT chained across turns.
until [ "$(curl -s ...status... | jq -r .status)" = "COMPLETED" ]; do sleep 2; done
```

Pair this with `run_in_background: true` if appropriate — start the long-running watch, get a task id back, check on it later via TaskOutput rather than blocking the conversation.

## Timeout recovery

If a write/generate call times out locally but server-side work may still be running, do not blindly regenerate. Call the matching status tool first and poll:

- `get_requirement_set_status` after requirement generation
- `get_build_brief_status` after build brief generation
- `get_agentic_run` after agentic run start/resume

Regenerate only when status proves work did not start, failed, or the user explicitly requests a fresh roll.
