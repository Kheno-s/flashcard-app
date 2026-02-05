# Development Workflow (Consistency Rules)

Goal: keep `main` always green and prevent divergent, inconsistent branches.

## Golden rule

**Every change happens on a fresh branch created from the latest `main`.**

```bash
git checkout main
git pull --ff-only
git checkout -b feat/<short-name>
```

No direct commits to `main`.

## PR flow (required)

1. Create a branch from latest `main`.
2. Make a focused change set (avoid drive-by refactors).
3. Local checks:
   - `npm run typecheck`
   - `npm run build:web`
4. Open a Pull Request.
5. CI must be green before merge.
6. Merge with **squash** (preferred) or **rebase**.

## CI contract (what must pass)

Our CI is intentionally *build-only* and does not rely on browser automation.

Required checks:
- TypeScript typecheck
- Expo web export (`expo export --platform web`)
- Lightweight smoke script validating the export output

## Sub-agents / automation rule

When Gizmo spawns sub-agents:
- each sub-agent must work on **its own branch** created from the latest `main`
- deliverables are submitted via PR, not via direct commits to `main`

This avoids “branch base drift” where features depend on unmerged changes.

## Repository settings (GitHub) — needs to be enabled once

These are not code changes; they’re GitHub settings:

- Protect `main`
  - Require PRs
  - Require status checks to pass (CI)
  - Disallow force-push
  - (Optional) require 1 approval

Once enabled, `main` stays consistent by construction.
