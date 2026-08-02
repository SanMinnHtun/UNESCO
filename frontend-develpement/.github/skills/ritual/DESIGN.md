# Ritual skill design notes

This file is for humans reviewing or maintaining the Ritual skill. Runtime instructions live in `SKILL.md` and `references/*.md`.

## Product intent

Ritual helps coding agents avoid jumping straight into implementation when the feature depends on context the agent cannot infer on its own: strategic intent, constraints, prior decisions, trade-offs, and non-obvious scope boundaries.

The workflow surfaces that context through targeted discovery questions, combines it with codebase signals and prior explorations, and produces a validated build brief before code is written.

## Why split the skill

The previous monolithic `SKILL.md` mixed runtime instructions with design rationale, fallback formulas, version history, and long branch handlers. That made it harder for an agent to follow the right path at runtime.

The split version keeps:

- `SKILL.md` as a dispatcher/control plane
- `references/*` as runtime procedure files loaded only when needed
- `DESIGN.md` as rationale and maintenance notes

## Retired `/ritual recon`

`/ritual recon` is intentionally not part of the Ritual command surface. Its former workspace-history value is covered by `/ritual resume`; its file-decision-history value is covered by `/ritual lineage`; and its repo-reading behavior is normal coding-agent behavior in plain English.

## Context packet principle

The coding agent should contribute local codebase understanding, but not decide final scope itself. After recon, it produces a `codebase_context_packet` containing facts, evidence, hypotheses, confidence, scope pressure, corrections, and open questions. MCP/tooling remains responsible for generating and ranking final sub-problems and scope.

## Context pulse principle

Context pulse answers: can a reasoning system act safely on this yet? The primary user-facing score is Reasoning Readiness; Context Debt is the inverse. Server-side scoring is canonical for new pulses. Fallback formulas are only for older MCP servers or error recovery.

## Host assumptions

Designed primarily for Claude Code-style coding-agent sessions with filesystem, git, shell, and MCP access. Adapt commands as needed for Cursor or other agents with equivalent tools.
