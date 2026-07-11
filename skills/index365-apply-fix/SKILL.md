---
name: index365-apply-fix
description: |
  Use when the user wants to fix a single index365 finding in this repository. Triggers:
  "fix this finding", a pasted `findingId` (e.g. `f_ab12cd34`), the "copy fix prompt for
  your agent" button from the dashboard, "apply the index365 fix for…", or "resolve this
  one issue". One finding, one focused diff. For the whole report at once, use
  index365-audit-and-fix.
allowed-tools: Bash(index365 *) Read Edit Grep Glob
---

# index365 apply fix

Apply one finding's fix in the current repo and show the diff.

## Prerequisite

A `projectId` + baseline `runId` + `findingId`, the original audit command (`runs start`
or `marketing run`), its target URL when one was supplied, and the repository that serves
the audited site.

## Workflow

1. **Get the finding's full detail** (prefer the machine-readable fix):
   ```bash
   index365 findings get --run run_xxx f_ab12cd34 --json
   ```
   Read `agentActions` first, it is the product's own machine-readable remediation. Fall
   back to the human `remediation` text only if `agentActions` is absent. Note `affectedUrls`.

2. **Map the affected URL to a file.** Use `Glob`/`Grep` over the repo to find the route,
   component, template, or config that produces each `affectedUrl`.

3. **Honor the user's application boundary.** If the user asked to preview, propose, or
   approve the change before application, produce the smallest proposed patch without
   editing files, show it, and stop for approval. Otherwise, the user's direct fix/apply
   request authorizes one logical `Edit` that resolves exactly this finding. Match the
   surrounding code's style. Do not refactor or fix unrelated things.

4. **Show the result.** For preview-only work, label the patch `proposed` and do not claim
   the repository changed. For an authorized edit, show the actual diff and state which
   `findingId` it resolves.

5. **Verify only after application** by repeating the original audit command with the same
   project and target URL, plus a distinct stable key for this post-fix verification. For
   AI-Readiness, use
   `index365 runs start --project <projectId> [--url <originalUrl>] --wait --json --idempotency-key "verify-<baselineRunId>-<findingId>-1"`.
   For Marketing Signal, use the same arguments with `index365 marketing run`. Reuse the
   verification key only when retrying this verification request. Do not reuse the
   baseline audit's key, which would replay the baseline run instead of measuring the fix.
   Confirm the finding is gone. A proposed patch is not eligible for re-run proof. A fix
   that doesn't move the score isn't done.

## STOP and ask the user when

- The fix would exceed what the finding describes (scope creep).
- `affectedUrls` doesn't resolve to any file in this repo (it's an out-of-repo or
  infra/DNS/hosting fix, report it, don't invent a code change).
- The remediation requires a product/brand/content decision rather than a mechanical edit.
- The user requested a proposed diff or approval before application. Stop after the
  proposed patch and wait; do not call `Edit` or re-run the scan yet.

## Don't

- Don't re-derive a fix when `agentActions` already specifies it.
- Don't batch several findings here, that's **index365-audit-and-fix**.
- Don't claim it's fixed without a re-run or a monitor diff.
