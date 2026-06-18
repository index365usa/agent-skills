---
name: index365-triage-findings
description: |
  Use when an index365 audit has findings and the user wants a plan before any code
  changes. Triggers: "what should I fix first", "prioritize the findings", "triage this
  audit", "turn the findings into a plan", "which of these matter". Produces a prioritized,
  file-mapped fix plan. It plans only, it does not edit code (use index365-apply-fix or
  index365-audit-and-fix to apply).
allowed-tools:
  - Bash(index365 *)
  - Read
  - Grep
  - Glob
  - Agent
---

# index365 triage findings

Turn a completed run's findings into a prioritized, file-mapped plan. Planning only.

## Prerequisite

A `runId` for a completed run, and (ideally) you are inside the repository that serves the
audited site, so findings can map to files.

## Workflow

1. **Pull the report to a file** (don't dump it into context):
   ```bash
   mkdir -p .index365
   index365 reports context run_xxx > .index365/report-run_xxx.json
   ```

2. **List findings worst-first:**
   ```bash
   index365 findings list --run run_xxx --severity critical
   index365 findings list --run run_xxx --severity high
   ```

3. **Rank over the file with a subagent.** For a large report, dispatch a subagent to
   rank findings from `.index365/report-run_xxx.json` rather than loading the whole thing
   yourself. Order by user impact, group by `category` (or `stage` for Marketing Signal).

4. **Map each finding to repo files.** Use `affectedUrls` + `Glob`/`Grep` to find the
   route/component/template that produces each affected URL. Note findings whose
   `affectedUrls` don't resolve to a file in this repo, those are out of scope for an
   in-repo fix.

5. **Output the plan** (do not change code): an ordered list of `findingId` → title →
   severity → target file(s) → the remediation from the finding. Group into 1–3 reviewable
   batches, smallest safe diffs first. Flag anything that needs a human decision.

## Shortcut via MCP prompts

If the index365 MCP server is connected, the `triage_findings` and `prepare_pr_plan`
prompts do steps 2–5 directly. Use them when you're in an MCP host; otherwise the CLI
flow above is equivalent.

## Next

Apply the plan with **index365-apply-fix** (one finding at a time) or run the whole loop
with **index365-audit-and-fix**.
