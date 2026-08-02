---
name: index365-triage-findings
description: |
  Use when an index365 scan has findings and the user wants a plan before any code
  changes. Triggers: "what should I fix first", "prioritize the findings", "triage this
  audit", "turn the findings into a plan", "which of these matter". Produces a prioritized,
  file-mapped fix plan. It plans only, it does not edit code (use index365-apply-fix or
  index365-audit-and-fix to apply).
allowed-tools: Bash(index365 *) Read Grep Glob Agent
---

# index365 triage findings

Turn the latest run's findings into a prioritized, file-mapped plan. Planning only.
Ideally you are inside the repository that serves the audited site, so findings can
map to files.

## Workflow

1. **List findings worst-first** (defaults to the latest run, no ids needed):
   ```bash
   index365 findings --severity critical
   index365 findings --severity high
   ```
   For a big report, save the full payload instead and rank over the file, never in
   context: `index365 report --save` writes it into the git-ignored `.index365/`
   dir; dispatch a subagent to rank findings from that file.

2. **Read the ones that matter.** `index365 findings get <n> --json` per candidate,
   using the ordinal from the table. Order by user impact, group by `category` (or
   `stage` for Marketing Signal).

3. **Map each finding to repo files.** Use `affectedUrls` + `Glob`/`Grep` to find the
   route/component/template that produces each affected URL. Note findings whose
   `affectedUrls` don't resolve to a file in this repo, those are out of scope for an
   in-repo fix.

4. **Output the plan** (do not change code): an ordered list of finding ordinal +
   `findingId` → title → severity → target file(s) → the remediation from the
   finding. Cite the stable `findingId` in the plan, since ordinals are per-run
   positions while `findingId` survives a re-scan for the after-fix comparison.
   Group into 1–3 reviewable batches, smallest safe diffs first. Flag anything that
   needs a human decision.

## Shortcut via MCP prompts

If the index365 MCP server is connected, the `triage_findings` and `prepare_pr_plan`
prompts do steps 1–4 directly. Use them when you're in an MCP host; otherwise the CLI
flow above is equivalent.

## Next

Apply the plan with **index365-apply-fix** (one finding at a time) or run the whole
loop with **index365-audit-and-fix**.
