---
name: index365-read-report
description: |
  Use when the user wants to see the results of an index365 audit without changing code.
  Triggers: "show my score", "what's wrong with my site", "read the audit report", "list
  the findings", "what did the audit find", "show the marketing signal report". Read-only:
  it reads and explains, it does not fix. To fix, use index365-apply-fix or
  index365-audit-and-fix.
allowed-tools:
  - Bash(index365 *)
  - Read
  - Grep
---

# index365 read report

Read an audit's score and findings, and explain them. Read-only.

## Prerequisite

A `runId` (from `index365 runs get`, the run-audit step, or `index365 runs start --wait`).
For the latest Marketing Signal run you can pass `--project` instead.
Auth: `index365 doctor`; if it fails, use **index365-setup** if installed, otherwise
`npm install -g @index365/cli && index365 login` directly.

## Get the report payload (write to file, don't dump)

`reports context` prints the full JSON to stdout. Redirect it to the git-ignored dir,
then read selectively, never paste a whole report into context.

```bash
mkdir -p .index365
index365 reports context run_xxx > .index365/report-run_xxx.json
jq '{score, findingsTotal, severityCounts}' .index365/report-run_xxx.json
```

## Triage the findings

```bash
# list (newest contract: stable findingId, severity, category, title):
index365 findings list --run run_xxx --severity critical
index365 findings list --run run_xxx --severity high

# full detail + remediation for one finding:
index365 findings get --run run_xxx f_abcd1234 --json
```

Each finding has: `findingId` (stable), `severity`, `category`, `title`, `detail`,
`remediation` (human), `affectedUrls`, and `agentActions` (machine-readable fix steps).

## Marketing Signal reports

```bash
index365 marketing report --project prj_xxx > .index365/marketing-prj_xxx.json
index365 marketing findings --project prj_xxx --severity high
```

Marketing findings carry a `stage` (Find / Trust / Act / Measure / Improve) instead of a
category. Measure-stage findings are often public-signal-only and need a connected
analytics account to verify fully.

## Output discipline

- Write large payloads to `.index365/` (git-ignored); read with `jq` / `grep` / `head`.
- Summarize the score, the severity counts, and the top findings, don't relay the raw JSON.
- For pagination, follow `pagination.nextCursor` with `--cursor`.

## Next

To act on the findings: **index365-triage-findings** (plan), **index365-apply-fix** (one
fix), or **index365-audit-and-fix** (the full loop).
