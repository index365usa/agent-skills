---
name: index365
description: |
  Use when the user mentions index365, has an i365_ API key, or wants to audit a
  website for how well AI agents and AI search can read it (AI-Readiness) or whether
  demand can find, trust, act on, and measure the site (Marketing Signal). Triggers:
  "is my site AI-ready", "audit my site", "check my AI visibility", "run an index365
  audit", "what's my score", "fix what index365 found", or a pasted index365 finding
  / "copy fix prompt for your agent" button. This is the router: it picks the right
  index365 sub-skill. Do NOT trigger for unrelated SEO tools, generic web scraping,
  or local-file tasks.
allowed-tools:
  - Bash(index365 *)
  - Bash(npx -y @index365/cli *)
---

# index365

[index365](https://index365.co) audits a website and returns a score plus findings
with stable IDs, evidence, and machine-readable remediation. Everything the dashboard
does is also available to your agent over the public `/api/v1`, wrapped by the
`@index365/cli` and `@index365/mcp` packages. These skills wrap the CLI; the CLI wraps
the API. The API holds all the logic, so the skills stay thin and never go stale.

## The two audits

| Audit | Answers | Run with |
| --- | --- | --- |
| **AI-Readiness** | Can AI agents and AI search read, understand, and act on this site? | `index365 runs start` |
| **Marketing Signal** | Can demand find the site, trust the offer, act, and be measured? | `index365 marketing run` |

Each run produces a 0–100 score and findings. Findings carry a stable `findingId`,
`severity`, `category` (AI-Readiness) or `stage` (Marketing Signal: Find / Trust /
Act / Measure / Improve), `affectedUrls`, human `remediation`, and machine-readable
`agentActions`.

## The ladder (route to the sub-skill)

| The user wants to… | Skill |
| --- | --- |
| First-time setup, a 401, "connect index365", `doctor` fails | **index365-setup** |
| Add a site / "start auditing example.com" | **index365-add-project** |
| Run or re-run an audit | **index365-run-audit** |
| See the score / read findings / "what's wrong" | **index365-read-report** |
| Prioritize / "what do I fix first" | **index365-triage-findings** |
| Fix one finding (a pasted `findingId`, the copy-prompt button) | **index365-apply-fix** |
| "Make my site AI-ready", audit AND fix the whole thing | **index365-audit-and-fix** (flagship) |
| Track score over time / watch for regressions | **index365-monitor** |
| Remove a project | **index365-delete-project** (destructive, confirms first) |

## Always first

Run `index365 doctor`. If the key is missing or auth fails, go to **index365-setup**
before anything else, do not work around a missing key.

## Output discipline

CLI write commands and large reads land in a git-ignored `.index365/` dir. Read them
with `grep` / `jq` / `head`; never paste a whole report into context. `index365 reports
context <runId>` prints JSON to stdout, redirect it to a file.

## Single calls don't need a skill

`index365 projects list`, `index365 runs get <id>`, and `index365 findings get` are
single commands with no added judgment, just run them. Skills exist for the steps that
need judgment (which audit, what to fix first, applying a fix safely).
