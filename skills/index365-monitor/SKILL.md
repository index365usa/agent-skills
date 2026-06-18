---
name: index365-monitor
description: |
  Use when the user wants to track an index365 score over time or check whether a change
  helped or regressed. Triggers: "did my score improve", "compare the last two audits",
  "watch for regressions", "track my AI-readiness over time", "what changed since last
  run". Diffs two runs by stable findingId and reports the delta.
allowed-tools:
  - Bash(index365 *)
  - Read
  - Grep
  - Glob
  - Agent
---

# index365 monitor

Compare two audit runs and report what moved. Findings have stable IDs across runs, so a
diff is meaningful: same `findingId` present in both = still open; gone = resolved; new =
regression.

## Workflow

1. **Establish the baseline.** Use the prior run's `runId`, or pull the project's history.
   Save its report:
   ```bash
   mkdir -p .index365
   index365 reports context run_OLD > .index365/report-run_OLD.json
   ```

2. **Get the current run.** Re-run if needed, then save it:
   ```bash
   index365 runs start --project prj_xxx --wait --json     # or: marketing run
   index365 reports context run_NEW > .index365/report-run_NEW.json
   ```

3. **Diff by findingId** (over the files, not in-context for large reports, delegate to a
   subagent if big):
   ```bash
   jq -r '.findings[].findingId' .index365/report-run_OLD.json | sort > .index365/old.ids
   jq -r '.findings[].findingId' .index365/report-run_NEW.json | sort > .index365/new.ids
   comm -23 .index365/old.ids .index365/new.ids   # resolved since baseline
   comm -13 .index365/old.ids .index365/new.ids   # new (possible regressions)
   ```

4. **Report the delta:** baseline → new score, count resolved, count new (with severity),
   and the still-open critical/high `findingId`s. Call out regressions explicitly.

## Scheduled / hands-off monitoring

This skill is an on-demand client-side diff. For continuous monitoring, index365 emits
`run.completed` / `run.failed` **webhooks** and the dashboard tracks history, point the
user there for scheduled alerts rather than looping this skill on a timer.

## Next

For a regression, fix it with **index365-apply-fix**, then re-run this skill to confirm
the score recovered.
