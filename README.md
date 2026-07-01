# index365 skills

Agent skills for [index365](https://index365.co): audit a website for **AI-Readiness**
(can AI agents and AI search read it?) and **Marketing Signal** (can demand find, trust,
act on, and measure it?), then fix what's found, all from your coding agent.

These skills wrap the [`@index365/cli`](https://www.npmjs.com/package/@index365/cli), which
wraps the public `/api/v1`. The API holds all the logic, so the skills stay thin and never
go stale: they teach an agent *which command to run and how to judge the result*, not how
the audit works.

## Install

### Claude Code (recommended)

```bash
/plugin marketplace add index365usa/agent-skills
/plugin install index365
```

Installs all 9 skills in one shot, no picklist.

### Other agents: Codex, Cursor, Windsurf, …

```bash
npx skills add index365usa/agent-skills --all
```

[`skills`](https://github.com/vercel-labs/skills) cross-installs to every supported coding
agent from this one repo. Without `--all` it prompts you to pick individual skills; pass
`--all` (or `-y`) to install all 9 without the prompt.

### Prerequisite: the index365 CLI + an API key

The skills call the `index365` CLI. Install it and log in once:

```bash
npm install -g @index365/cli
index365 login        # paste an i365_ key from the dashboard: Org settings → API keys
index365 doctor       # verify
```

The **index365-setup** skill walks an agent through this (install, scopes, MCP config) on
first use or any 401. API keys are available on any active paid plan.

## The skills

| Skill | Use it to |
| --- | --- |
| **index365** | Router, start here; explains the two audits and routes to the right skill. |
| **index365-setup** | Install, log in, scope a key, configure MCP. The prerequisite gate. |
| **index365-add-project** | Add a domain as a project (idempotent by domain). |
| **index365-run-audit** | Run an AI-Readiness or Marketing Signal audit and wait for the score. |
| **index365-read-report** | Read the score and findings. Read-only. |
| **index365-triage-findings** | Turn findings into a prioritized, file-mapped fix plan. |
| **index365-apply-fix** | Fix one finding in the repo and show the diff. |
| **index365-audit-and-fix** | **Flagship**: the full loop: run → read → prioritize → fix in repo → re-verify. |
| **index365-delete-project** | Remove a project. Destructive, confirms the exact domain first. |

The flagship **index365-audit-and-fix** is the one to demo: point your agent at the repo
that serves your site and it audits, fixes the in-repo findings, and re-runs to confirm
the score moved.

## How it works (the layering law)

```
skills  →  @index365/cli  →  /api/v1  →  (audit engine + DB)
```

A skill never builds a bearer header, copies a result schema inline, or paginates by hand.
If the CLI changes a flag default or a field name, the skills keep working because they
reference *behavior* (`--wait` polls; findings have a stable `findingId`), not
implementation. There's also an MCP server (`@index365/mcp`) for hosts that prefer tools
over a shell; `index365 mcp config` prints the setup.

## Output discipline

Audit artifacts (reports, PDFs) are written to a git-ignored `.index365/` directory and
read with `jq`/`grep`, never dumped whole into agent context.

## Docs & license

- Developer docs: https://index365.co/docs/developers
- CLI: https://www.npmjs.com/package/@index365/cli · MCP: https://www.npmjs.com/package/@index365/mcp
- License: [MIT](LICENSE)
