---
name: index365-read-report
description: |
  Use when the user wants to see the results of an index365 scan without changing code.
  Triggers: "show my score", "what's wrong with my site", "read the audit report", "list
  the findings", "what did the audit find", "show the marketing signal report". Read-only:
  it reads and explains, it does not fix. To fix, use index365-apply-fix or
  index365-audit-and-fix.
allowed-tools: Bash(index365 *) Read Grep
---

# index365 read report

Read a scan's score and findings, and explain them. Read-only, and no ids needed:
every command defaults to the latest completed run and echoes what it resolved
(`yoursite.com · scanned 2m ago`). A domain narrows to that site's latest run.

## Score first

```bash
index365 report
```

On a terminal this renders the score card; piped or with `--json` it prints the
compact agent-ready JSON context (score, severity counts, top findings, exec
summary). That JSON is bounded by construction, so it is safe to read directly.

## Then findings

```bash
index365 findings                # table from the latest run
index365 findings get 1          # first finding in full, plus a fix prompt
```

Filter the table with `--severity critical` (then `high`), `--category <c>`, or, for
Marketing Signal runs, `--stage <s>` (Find / Trust / Act / Measure / Improve).
Measure-stage findings are often public-signal-only and need a connected analytics
account to verify fully. `findings get <n>` takes the ordinal straight from the
table; each finding also has a stable `findingId` that stays constant across
re-reads, which is what you match on when comparing runs.

## Large reports: save, then read selectively

Only when you need every finding at once (full triage, cross-run diffing), save the
full report to the git-ignored `.index365/` dir and read it with `jq` / `grep`:

```bash
index365 report --save   # writes the full report into .index365/ by default
```

Never paste a whole saved report into context. Summarize the score, the severity
counts, and the top findings.

## History

`index365 results` lists your scans newest first; `index365 results yoursite.com` is
that site's score over time, the fastest way to show whether a fix moved the number.

## Next

To act on the findings: **index365-triage-findings** (plan), **index365-apply-fix**
(one fix), or **index365-audit-and-fix** (the full loop).
