# /ritual refine — re-ground your build brief against the current codebase

Grounds the build brief you arrived with against the current repo+branch state. Runs codebase
recon, drops already-implemented recommendations, attaches codebase sources, rewrites the brief
on disk, syncs it back to the cloud (non-blocking), then prints the updated brief and a concrete
"what sharpened" block.

**The local `.ritual/build-brief.md` is the artifact refine grounds.** The brief already exists:
it was generated on the marketing site and pulled to `.ritual/build-brief.md` at `init`. Refine
does NOT call `generate_build_brief` and does NOT re-synthesize on the server; it sharpens the
brief you already have, in place, against real code. It may then sync the grounded result back
with `save_reconciled_brief` (a save, not a re-synthesis; non-blocking — Step 5.5), but the local
file stays the source of truth for `/ritual begin`.

**Refine = grounding a brief you already have.** By the time refine runs, you arrived with a
brief (the prelogin handoff) and a repo. Refine's job is to sharpen that brief against the
current codebase: "I have a plan built from my description, now ground it in where the code
actually is." Its output is a refined `.ritual/build-brief.md` that `/ritual begin` executes.

**Build rail is load-bearing here too.** Every top-level user-facing message in `/ritual refine`
MUST begin with the 5-stage build rail per `references/cli-output-contract.md` § Build rail,
positioned at the recommendations/brief stage — re-grounding is late-planning, not implementation.

---

## ON ENTRY

Your **first action** is Step 1 (resolve the exploration). Do not read `.ritual/build-brief.md`
first. Do not pause to ask clarifying questions.

---

## Flow

### Step 1 — Resolve the target repo and exploration

**1a. Identify the target repo.**

Check the `RITUAL_TARGET_REPO` environment variable (set by the launcher when invoked from
the CLI). If set, use that path as the repo root. Print: "Target repo: `<path>`."

If unset:
- If the current working directory is a git repo (`.git` directory present), use it.
  Print: "Target repo: `<cwd>`."
- If cwd contains child directories that are git repos, list up to 5 by recency. Print
  the list and ask: "Which repo should I ground the brief against?" Wait for the reply.
  This is the only user pause in this flow.
- If no git repo is found: print "No git repo found. Set `RITUAL_TARGET_REPO` or run from
  inside the target repo." and stop.

**1b. Determine the current branch.**

```bash
git -C <repo_path> rev-parse --abbrev-ref HEAD
```

Print: "Branch: `<branch>`."

**1c. Resolve the exploration via repo+branch binding.**

Call `mcp__ritual__list_explorations` and look for an exploration whose repo+branch matches
the current repo+branch. Prefer explorations in state `ready`, `in_flight`, or `in_progress`.

Also check `.ritual/config.json` for a pinned `explorationId` — if present, fetch it
directly via `mcp__ritual__get_exploration` and confirm it matches. The config binding
takes precedence over the list scan. A fresh prelogin exploration may be a draft the roster
does not list, so the pinned `explorationId` is the reliable path.

If an exploration is resolved, note its `id`, `name`, and `state`. `/ritual begin` uses this
id for `sync_implementation`, so surface it if found — but this is a SOFT binding.

If no exploration resolves but `.ritual/build-brief.md` exists with real content, proceed
anyway: the on-disk brief is the artifact refine grounds. Only if there is NEITHER an
exploration NOR a usable local brief:
> No build brief found for this repo+branch. Run `ritual init --token <...>` from your signup
> handoff to pull it, or `/ritual build <your problem>` to create one.

Stop only in that neither-exists case. Do not block on the server otherwise.

**1d. Staleness probe.**

```bash
git -C <repo_path> log --oneline -20
```

Note the HEAD commit SHA and count. If the exploration has a `savedAt` or `buildBriefGeneratedAt`
timestamp, count commits since that timestamp:

```bash
git -C <repo_path> log --oneline --after="<savedAt>" 2>/dev/null | wc -l
```

Surface to the user (inline, not a pause): "Re-grounding against `<branch>`, `<M>` commits
since the brief was built." If M is 0, print: "Re-grounding against `<branch>`, brief is
current." This makes stale-brief or wrong-branch/worktree runs catchable.

### Step 2 — Read the brief you're grounding

Read `.ritual/build-brief.md` fully (and `.ritual/recommendations.md` if it exists). This is
the artifact you will rewrite in place in Step 5, so note its section structure and the
recommendations it lists. You reached here because Step 1 confirmed a brief exists.

If the brief has an `explorationId` in frontmatter, cross-check it against the pinned id from
Step 1. If they differ, surface a warning and ground the on-disk brief anyway:
> Warning: local `.ritual/build-brief.md` references exploration `<local-id>` but
> `.ritual/config.json` pins `<config-id>`. Grounding the on-disk brief.

### Step 3 — Recon the codebase

Read key files relevant to the exploration topic. Do NOT run shell commands (beyond git
probes in Step 1), install dependencies, or modify any file in the repo.

Files to read (read what exists, skip what does not):
- `package.json` or `pyproject.toml` or `Cargo.toml` — dependency and script inventory
- Main source directories (infer from `package.json` `main`/`src` fields, or common defaults:
  `src/`, `app/`, `lib/`)
- CI config: `.github/workflows/*.yml`, `.circleci/config.yml`, `Dockerfile`
- Any file the exploration's build brief explicitly names as relevant

While reading, for each question in the brief: check whether the codebase already answers
it. Mark it answered (internal note, not printed yet).

For each recommendation: verify whether the codebase already implements it. Note the file
and line reference if found.

### Step 4 — Update recommendations

For each recommendation from Step 3 review:
- If the code already implements it: mark it "already implemented" with a `file:line` source.
  It will be dropped from the regenerated brief.
- If it still applies: retain it, attaching the closest file source found during recon.
- If it is newly contradicted by code structure (e.g., recommends adding X but X already
  exists in a different form): mark as "needs reframe" and note what the code shows.

### Step 5 — Rewrite the brief on disk (no server call)

Rewrite `.ritual/build-brief.md` in place, grounded in the recon findings. This is an
agent-authored edit to the local file: refine does NOT call `generate_build_brief` and does
NOT re-synthesize on the server. The brief you already have (the prelogin brief pulled at
`init`) is the base; sharpen it against the code:

- Preserve the brief's existing section structure and headings. You are sharpening content,
  not restructuring. Do not invent a new format.
- For each recommendation the code already implements: drop it, and record it for the
  "what sharpened" block in Step 6.
- For each recommendation that still applies: attach the closest codebase source (`file:line`)
  found during recon.
- For each recommendation the code contradicts: reframe it to what the code shows.
- Ground the "Codebase Anchors" section (or its equivalent in this brief) in EXACT file paths
  from recon. If a path is uncertain, name what to search for instead of inventing one.
- Keep every constraint, goal, and requirement the original brief stated. Never drop substance.

Write the sharpened brief back to `.ritual/build-brief.md`. That file is the source of
truth for `/ritual begin` — no `generate_build_brief`, no re-synthesis, no polling.

### Step 5.5 — Sync the grounded brief back to the cloud (non-blocking)

This keeps the server's copy of the brief in step with the grounding you just did, recorded as
a reconciled version with provenance. It is STRICTLY OPTIONAL to the flow: it never blocks, and
`/ritual begin` runs off the LOCAL `.ritual/build-brief.md` regardless of whether it succeeds —
begin neither reads nor waits on it.

Skip this step entirely if Step 1 resolved NO exploration id (a local-brief-only run has
nothing to sync server-side); go straight to Step 6.

If an exploration id was resolved:

1. **Confirm the server brief is READY.** Call `mcp__ritual__get_build_brief_status`. If it is
   not READY (still generating, or none exists), SKIP the sync — print one line ("Server brief
   not ready; kept the grounding local.") and continue to Step 6. Do NOT wait or poll.
2. **Save the grounded brief back.** Call `mcp__ritual__save_reconciled_brief` with the
   exploration id, `content` set to the full grounded `.ritual/build-brief.md`, and a short
   `reconciliation_summary` (e.g. "Grounded against `<branch>` @ <HEAD-SHA-short>"). Do NOT pass
   a source review id. The server snapshots the original as an immutable version, saves the
   grounded one, and stamps pre-signup provenance automatically — you do not signal that.
3. **Non-blocking.** If the call errors for ANY reason, print one line ("Cloud sync skipped:
   <reason>; grounding is saved locally.") and continue. Never retry, never stop.

### Step 6 — Print output

Print in this exact order:

**1. Grounding header**

Print a single line:
```
Grounded against: `<branch>` @ <HEAD-SHA-short> (<M> commits since brief was built)
```

**2. Full updated brief**

Print the complete contents of the updated brief (from the server response or the
updated local file).

**3. What sharpened block (load-bearing — always print when recon found differences)**

Print a section headed "## What sharpened" containing 3 to 5 concrete, codebase-grounded
changes. Each item must cite a specific file, line, or metric. Examples of the required
specificity:

- "Readiness score: 62% to 84% (billing/plans.ts already has a Stripe webhook handler at line 47)"
- "Dropped recommendation 3: role-based access already implemented at src/auth/rbac.ts"
- "Phase 2 now targets billing/plans.ts line 47 instead of a generic payment module"
- "Question 5 answered by recon: CI pipeline found at .github/workflows/deploy.yml"
- "Added file source to recommendation 1: src/api/users.ts exports createUser at line 12"

If recon found no differences (all questions were already unanswered, all recommendations
still apply, no sources added): print exactly:
"Recon found no gaps. Brief is fully grounded in the codebase."

Do not omit the "What sharpened" section. It is the payoff of the flow.

---

## Constraints

- One user pause maximum (Step 1a, repo disambiguation). All other steps run without stopping.
- Do NOT run shell commands in the target repo beyond the git probes in Step 1.
- Do NOT modify any file in the target repo EXCEPT `.ritual/build-brief.md`, the brief you ground.
- refine does NOT call `generate_build_brief` and does NOT re-synthesize on the server. The
  brief already exists on disk; refine sharpens it in place. It MAY call `save_reconciled_brief`
  (Step 5.5) to sync the grounded brief back — a save, not a re-synthesis, and non-blocking;
  `/ritual begin` never depends on it.
- No em-dashes in any output.
