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

Apply one finding's fix in the current repo and show the diff. You need to be in the
repository that serves the audited site; the finding itself comes from the latest
run, no ids to carry.

## Workflow

1. **Get the finding's full detail** (prefer the machine-readable fix):
   ```bash
   index365 findings get 1 --json        # by ordinal from the findings table
   index365 findings get f_ab12cd34      # or by a pasted findingId
   ```
   Read `agentActions` first, it is the product's own machine-readable remediation.
   Fall back to the human `remediation` text only if `agentActions` is absent. Note
   `affectedUrls`. The non-JSON form also prints a copy-pasteable fix prompt
   (`--prompt` prints only the raw prompt, for piping).

2. **Map the affected URL to a file.** Use `Glob`/`Grep` over the repo to find the
   route, component, template, or config that produces each `affectedUrl`.

3. **Honor the user's application boundary.** If the user asked to preview, propose,
   or approve the change before application, produce the smallest proposed patch
   without editing files, show it, and stop for approval. Otherwise, the user's
   direct fix/apply request authorizes one logical `Edit` that resolves exactly this
   finding. Match the surrounding code's style. Do not refactor or fix unrelated
   things.

4. **Show the result.** For preview-only work, label the patch `proposed` and do not
   claim the repository changed. For an authorized edit, show the actual diff and
   state which `findingId` it resolves.

5. **Verify only after application** by re-scanning the same site (same `--product`
   as the original run, if it was Marketing Signal):
   ```bash
   index365 scan yoursite.com --yes --idempotency-key "verify-f_ab12cd34-1"
   ```
   The idempotency key makes a retry of this verification safe without
   double-spending; use a fresh key per verification, never one from an earlier
   scan, which would replay that earlier run instead of measuring the fix. Then
   `index365 findings` reads the new run: confirm the finding is gone by matching
   its stable `findingId` (ordinals can shift between runs). A proposed patch is not
   eligible for re-run proof. A fix that doesn't move the score isn't done.

## STOP and ask the user when

- The fix would exceed what the finding describes (scope creep).
- `affectedUrls` doesn't resolve to any file in this repo (it's an out-of-repo or
  infra/DNS/hosting fix, report it, don't invent a code change).
- The remediation requires a product/brand/content decision rather than a mechanical
  edit.
- The user requested a proposed diff or approval before application. Stop after the
  proposed patch and wait; do not call `Edit` or re-scan yet.

## Don't

- Don't re-derive a fix when `agentActions` already specifies it.
- Don't batch several findings here, that's **index365-audit-and-fix**.
- Don't claim it's fixed without a re-scan or a monitor diff.
