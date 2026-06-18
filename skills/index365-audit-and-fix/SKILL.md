---
name: index365-audit-and-fix
description: |
  Use when the user wants their coding agent to audit their site with index365 AND fix
  what it finds in the current repo, not just report it. Triggers: "make my site
  AI-ready", "audit and fix my site", "fix everything index365 finds", "improve my
  index365 score", or the user pastes a report and says "act on this". This is the full
  autonomous loop. For a single finding use index365-apply-fix; to only read, use
  index365-read-report.
allowed-tools:
  - Bash(index365 *)
  - Read
  - Edit
  - Write
  - Grep
  - Glob
  - Agent
---

# index365 audit and fix

Run an index365 audit, turn findings into a prioritized plan, apply the fixes that live in
THIS repo, and re-run to confirm the score actually moved. The agent fixes; index365
supplies the findings and per-finding remediation. This is not a summary, it fixes.

## Prerequisites

- Auth works: `index365 doctor` (needs `runs:write`; if 401 or missing scope, run
  **index365-setup**: do not work around it).
- You are in the repository that serves the audited site (so `affectedUrls` map to files).
- A `projectId` (`index365 projects list`, or **index365-add-project** for a new domain).

## Workflow (copy this checklist into your reply; check off as you go)

- [ ] **1. Confirm project + audit type**: `index365 projects list --json`. AI-Readiness
      (`runs start`) by default; Marketing Signal (`marketing run`) if the user asked about
      demand/traffic/conversion.
- [ ] **2. Run and wait**: `index365 runs start --project <id> --wait --json` (record the
      baseline `score` and `runId`). Paid action; pass `--idempotency-key` so a retry can't
      double-spend.
- [ ] **3. Read report + prioritize**:
      `index365 reports context <runId> > .index365/report.json` (this CLI prints JSON to
      stdout; redirect to a file). Delegate ranking to a subagent over the FILE; never paste
      a full report into context. Prefer each finding's machine-readable `agentActions` over
      re-deriving the fix. (This is **index365-triage-findings**.)
- [ ] **4. Apply in-repo fixes**: per top finding:
      `index365 findings get --run <runId> <findingId> --json`; map `affectedUrls` → file
      with `Glob`/`Grep`; make one logical `Edit`; show the diff. (This is
      **index365-apply-fix**, repeated.) STOP and ask if a fix exceeds the finding, or
      `affectedUrls` doesn't resolve to a file; skip out-of-repo findings.
- [ ] **5. Re-run and verify**: re-run the audit; compare the new score/findings against
      the baseline, matching by stable `findingId`. A fix that doesn't move the score or
      clear its finding is not done, re-investigate.
- [ ] **6. Report the delta**: baseline → new score, the `findingId`s fixed,
      applied-but-unmoved (re-investigate these), and out-of-repo findings with each
      `humanUrl` so the user can handle them in the dashboard.

## Output

Write all run artifacts to `.index365/` (git-ignored). Field reference:
[references/finding-schema.md](references/finding-schema.md).

## Common mistakes

- Summarizing instead of fixing (that's **index365-read-report**).
- Pasting the whole report into context instead of reading the file with `jq`/`grep`.
- Re-deriving a fix when `agentActions` already specifies it.
- Calling step 5 done without comparing scores against the baseline.
- Editing files for findings whose `affectedUrls` are DNS/hosting/infra (not in this repo).
