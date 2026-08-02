---
name: index365-audit-and-fix
description: |
  Use when the user wants their coding agent to audit their site with index365 AND fix
  what it finds in the current repo, not just report it. Triggers: "make my site
  AI-ready", "audit and fix my site", "fix everything index365 finds", "improve my
  index365 score", or the user pastes a report and says "act on this". This is the full
  autonomous loop. For a single finding use index365-apply-fix; to only read, use
  index365-read-report.
allowed-tools: Bash(index365 *) Read Edit Write Grep Glob Agent
---

# index365 audit and fix

Run an index365 scan, turn findings into a prioritized plan, apply the fixes that
live in THIS repo, and re-scan to confirm the score actually moved. The agent fixes;
index365 supplies the findings and per-finding remediation. This is not a summary,
it fixes. You need to be in the repository that serves the audited site (so
`affectedUrls` map to files); no ids are carried between steps, every read defaults
to the latest run.

## Workflow (copy this checklist into your reply; check off as you go)

- [ ] **1. Scan and wait**:
      `index365 scan https://yoursite.com --yes --idempotency-key "baseline-<date>"`.
      AI-Readiness by default; add `--product marketing-signal` if the user asked
      about demand/traffic/conversion. `--yes` creates the project on a new domain
      without a prompt. Paid action (10 credits); the idempotency key makes a retry
      safe. Record the baseline score from the score card, and the `--product` used.
- [ ] **2. Read + prioritize**: `index365 findings --severity critical` then
      `high` for the worst items. For a big report, `index365 report --save` writes
      the full payload into the git-ignored `.index365/` dir; delegate ranking to a
      subagent over the FILE, never paste a full report into context. Prefer each
      finding's machine-readable `agentActions` over re-deriving the fix. (This is
      **index365-triage-findings**.)
- [ ] **3. Apply in-repo fixes**: per top finding, `index365 findings get <n> --json`
      (ordinal from the table); map `affectedUrls` → file with `Glob`/`Grep`. If the
      user requested preview or approval before application, show a proposed patch
      and STOP without editing. Otherwise, the direct audit-and-fix request
      authorizes one logical `Edit` per finding; show the actual diff. (This is
      **index365-apply-fix**, repeated.) STOP and ask if a fix exceeds the finding,
      or `affectedUrls` doesn't resolve to a file; skip out-of-repo findings. Note
      each fixed finding's stable `findingId` for the comparison in step 4.
- [ ] **4. Re-scan and verify**: repeat the step-1 command with the same URL and
      `--product` but a NEW stable key, e.g. `--idempotency-key "verify-batch-1"`;
      reuse that new key only when retrying this verification. Never reuse the
      baseline key, which would replay the baseline run. Compare the new score and
      `index365 findings` against the baseline, matching by stable `findingId`
      (ordinals shift between runs). A fix that doesn't move the score or clear its
      finding is not done, re-investigate.
- [ ] **5. Report the delta**: baseline → new score (`index365 results yoursite.com`
      shows both runs side by side), the `findingId`s fixed, applied-but-unmoved
      (re-investigate these), and out-of-repo findings with each `humanUrl` so the
      user can handle them in the dashboard.

## Output

Write saved reports and artifacts to `.index365/` (git-ignored). Field reference:
[references/finding-schema.md](references/finding-schema.md).

## Common mistakes

- Summarizing instead of fixing (that's **index365-read-report**).
- Pasting the whole saved report into context instead of reading the file with
  `jq`/`grep`.
- Re-deriving a fix when `agentActions` already specifies it.
- Calling step 4 done without comparing scores against the baseline.
- Editing files for findings whose `affectedUrls` are DNS/hosting/infra (not in this
  repo).
