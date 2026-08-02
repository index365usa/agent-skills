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
allowed-tools: Bash(index365 *) Bash(npx -y @index365/cli *)
---

# index365

[index365](https://index365.co) scans a website and returns a score plus findings
with stable IDs, evidence, and machine-readable remediation. Everything the dashboard
does is also available to your agent over the public `/api/v1`, wrapped by the
`@index365/cli` and `@index365/mcp` packages. These skills wrap the CLI; the CLI wraps
the API. The API holds all the logic, so the skills stay thin and never go stale.

## No command needs an id

Every read defaults to your latest completed run and echoes back what it resolved.
`index365 findings`, `index365 report`, and `index365 check` work with no arguments;
a domain narrows any of them to that site. `index365 scan yoursite.com` resolves the
project from the domain and offers to create it on a new domain (one [Y/n] question;
`--yes` answers it for scripts). Never ask the user for a run id or project id, and
never tell the user to note one for later.

## The two audits

| Audit | Answers | Run with |
| --- | --- | --- |
| **AI-Readiness** | Can AI agents and AI search read, understand, and act on this site? | `index365 scan yoursite.com` |
| **Marketing Signal** | Can demand find the site, trust the offer, act, and be measured? | `index365 scan yoursite.com --product marketing-signal` |

Each scan produces a 0–100 score and findings. Findings carry a stable `findingId`,
`severity`, `category` (AI-Readiness) or `stage` (Marketing Signal: Find / Trust /
Act / Measure / Improve), `affectedUrls`, human `remediation`, and machine-readable
`agentActions`. `index365 findings get 1` reads the first finding in full and prints
a copy-pasteable fix prompt.

## The ladder (route to the sub-skill)

| The user wants to… | Skill |
| --- | --- |
| First-time setup, a 401, "connect index365", exit code 3 | **index365-setup** |
| Add a site / "start auditing yoursite.com" | **index365-add-project** |
| Run or re-run a scan | **index365-run-audit** |
| See the score / read findings / "what's wrong" | **index365-read-report** |
| Prioritize / "what do I fix first" | **index365-triage-findings** |
| Fix one finding (a pasted `findingId`, the copy-prompt button) | **index365-apply-fix** |
| "Make my site AI-ready", audit AND fix the whole thing | **index365-audit-and-fix** (flagship) |
| Re-check the score after a change | **index365-run-audit** then **index365-read-report** |
| Remove a project | **index365-delete-project** (archives, reversible, confirms first) |

## Trust exit codes, not pre-flight checks

Do not run `doctor` before commands. Run the command: `0` is success, and every
non-zero error explains itself and carries a `next:` line with the exact command to
run. Exit codes: `0` ok, `1` error, `2` usage, `3` auth, `4` not found, `5`
quota/conflict/rate. On exit `3`, go to **index365-setup**.

## Output discipline

Add `--json` to any command for machine-readable output; run-scoped responses carry
a `resolved` block naming the run they resolved to. `index365 report --save` writes
the full report (context plus every finding) into the git-ignored `.index365/` dir
by default. Read saved reports with `jq` / `grep` / `head`; never paste a whole
report into context.

## Single calls don't need a skill

`index365 results`, `index365 check`, `index365 projects list`, and
`index365 findings get 1` are single commands with no added judgment, just run them.
Skills exist for the steps that need judgment (which audit, what to fix first,
applying a fix safely).
