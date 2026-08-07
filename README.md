# index365 Agent Skills

**Power AI agents with intelligence.**

Agent Skills for index365, an agent-native website findings platform. Scan an authorized URL for AI-Readiness or Marketing Signal, read prioritized findings with evidence and remediation, make a bounded correction in the local project, and re-scan for proof.

These skills wrap [`@index365/cli`](https://www.npmjs.com/package/@index365/cli), which wraps the public `/api/v1`. The API owns product logic. Skills teach a coding agent which supported command to run and how to judge the result.

## How the CLI behaves

- **No command requires an id.** Every read defaults to your latest completed run: `index365 findings`, `index365 report`, and `index365 check` take no arguments, and a domain narrows any of them to that site. `index365 findings get 1` reads the first finding and prints a copy-pasteable fix prompt.
- **One question, at most.** `index365 scan yoursite.com` resolves the project from the domain. A new domain asks exactly one [Y/n] question before creating the project and spending credits; `--yes` answers it for scripts, and a non-interactive shell never prompts. Nothing else on the scan-and-read path ever asks (only the reversible `projects archive` keeps its own type-the-domain confirmation).
- **Scans wait by default** and render the score card. `--no-wait` queues for CI; `index365 check` answers "is it done yet".
- **Browser-default login.** `index365 login` opens the browser and the key saves itself. CI sets `INDEX365_API_KEY`.
- **Errors carry the fix.** Exit codes are stable (`0` ok, `1` error, `2` usage, `3` auth, `4` not found, `5` quota/conflict/rate) and every error prints a `next:` line with the exact command to run.

## Install

### Claude Code

```bash
/plugin marketplace add index365usa/agent-skills
/plugin install index365
```

Installs all nine skills as one plugin, with no per-skill picker.

### Codex, Cursor, Windsurf, and other supported agents

```bash
npx -y skills add index365usa/agent-skills --all
```

The [`skills`](https://github.com/vercel-labs/skills) installer adds all nine skills to
supported coding-agent runtimes. `--all` is what skips the per-skill picker.

### Agent Plugins (ChatGPT, Codex, Cursor, Copilot, Kiro, VS Code)

This repository is also a valid [Agent Plugins](https://agent-plugins.org/) 1.0 package:
`plugin.json` and `mcp.json` at the root, skills under `skills/`. Clients that support the
standard can load it directly from this repository using their own plugin install flow.

The bundled `mcp.json` points at the hosted index365 MCP server
(`https://index365.co/api/mcp`) with no credentials baked in. Clients that support MCP
OAuth sign in through the browser; clients that use header auth add an
`Authorization: Bearer` key from the [dashboard](https://index365.co/docs/developers/authentication).
The skills call the index365 CLI, so they run in clients with shell access and the CLI
installed (see the prerequisite below).

## Prerequisite: index365 CLI and login

```bash
npm install -g @index365/cli
index365 login
index365 --status
```

Install unpinned. The CLI reports its own updates, and an unpinned install line cannot go stale here.

`index365 login` opens the browser; you authorize on the dashboard and the key is saved automatically (loopback and PKCE, nothing to paste). In CI or a non-interactive runtime, set `INDEX365_API_KEY` to a dedicated revocable organization-scoped API key, or pass `index365 login --key`. The **index365-setup** skill handles first use, authentication failures, and MCP configuration.

## Skills

| Skill | Purpose |
| --- | --- |
| **index365** | Route an index365 request to the correct skill. |
| **index365-setup** | Install, sign in, verify, and configure MCP. |
| **index365-add-project** | Start tracking a domain. The first scan creates the project; explicit create is for pre-registering only. |
| **index365-run-audit** | Run an AI-Readiness or Marketing Signal scan; the command waits and prints the score. |
| **index365-read-report** | Read the score and prioritized findings without changing code. |
| **index365-triage-findings** | Turn findings into a prioritized, file-mapped correction plan. |
| **index365-apply-fix** | Apply one approved finding correction and show the diff. |
| **index365-audit-and-fix** | Run the bounded scan, findings, correction, approval, and re-scan workflow. |
| **index365-delete-project** | Archive a project after exact-domain confirmation. Reversible with `projects restore`. |

The current skills cover AI-Readiness and Marketing Signal. They do not add a dedicated Website Security scan, replace a full crawler, monitor AI visibility, or authorize autonomous fixes.

## How it works

```text
Agent Skills -> @index365/cli -> /api/v1 -> index365 findings
```

A skill does not hand-build authentication headers, copy the product schema, or reimplement API pagination. Findings remain the source for evidence, severity, affected URLs, remediation, and supported agent actions.

## Output discipline

`index365 report --save` writes the full report into the git-ignored `.index365/` directory; agents read it selectively with `jq`/`grep`. Do not dump a complete report into agent context. Review every proposed correction before applying it, then re-run the same scan before claiming improvement.

## Migrating from the 0.x grammar

CLI 1.x unified the command surface around `scan`, `results`, `check`, `findings`, and `report`, and removed every required id. The old spellings (`runs list`, `runs get`, per-run finding flags, `projects delete`) keep working as hidden aliases that print a one-line redirect note, but these skills teach only the current grammar. If an older skill or script taught you to save a run or project id, you can stop: reads default to the latest run, and a domain always works where an id would.

## Documentation and license

- Developer documentation: https://index365.co/docs/developers
- CLI: https://www.npmjs.com/package/@index365/cli
- MCP: https://www.npmjs.com/package/@index365/mcp
- License: [MIT](LICENSE)
