# index365 Agent Skills

**Power AI agents with intelligence.**

Agent Skills for index365, an agent-native website findings platform. Request an AI-Readiness or Marketing Signal scan of an authorized URL, read prioritized findings with evidence and remediation, make a bounded correction in the local project, and re-run the scan for proof.

These skills wrap [`@index365/cli`](https://www.npmjs.com/package/@index365/cli), which wraps the public `/api/v1`. The API owns product logic. Skills teach a coding agent which supported command to run and how to judge the result.

## Install

### Claude Code, Codex, Cursor, Windsurf, and other supported agents

```bash
npx -y skills@1.5.16 add index365usa/agent-skills --all
```

The [`skills`](https://github.com/vercel-labs/skills) installer installs all nine skills
into supported coding-agent runtimes without the per-skill picker.

### Claude Code plugin alternative

```bash
/plugin marketplace add index365usa/agent-skills
/plugin install index365
```

## Prerequisite: index365 CLI and login

```bash
npm install -g @index365/cli@0.6.0
index365 login
index365 doctor
```

Browser login is the default. In a supported non-browser environment, use a dedicated revocable API key and verify it with `index365 doctor`. Current API keys are organization-scoped and carry the full work-area scope set. The **index365-setup** skill handles first use, authentication failures, scope readback, and MCP configuration.

## Skills

| Skill | Purpose |
| --- | --- |
| **index365** | Route an index365 request to the correct skill. |
| **index365-setup** | Install, authenticate, verify, and configure MCP. |
| **index365-add-project** | Add a domain as a project, idempotently by domain. |
| **index365-run-audit** | Request an AI-Readiness or Marketing Signal scan and wait for completion. |
| **index365-read-report** | Read the score and prioritized findings without changing code. |
| **index365-triage-findings** | Turn findings into a prioritized, file-mapped correction plan. |
| **index365-apply-fix** | Apply one approved finding correction and show the diff. |
| **index365-audit-and-fix** | Run the bounded scan, findings, correction, approval, and re-run workflow. |
| **index365-delete-project** | Remove a project after exact-domain confirmation. |

The current skills cover AI-Readiness and Marketing Signal. They do not add a dedicated Website Security scan, replace a full crawler, monitor AI visibility, or authorize autonomous fixes.

## How it works

```text
Agent Skills -> @index365/cli -> /api/v1 -> index365 findings
```

A skill does not hand-build authentication headers, copy the product schema, or reimplement API pagination. Findings remain the source for evidence, severity, affected URLs, remediation, and supported agent actions.

## Output discipline

Generated artifacts are written to the git-ignored `.index365/` directory and read selectively. Do not dump a complete report into agent context. Review every proposed correction before applying it, then re-run the same scan before claiming improvement.

## Documentation and license

- Developer documentation: https://index365.co/docs/developers
- CLI: https://www.npmjs.com/package/@index365/cli
- MCP: https://www.npmjs.com/package/@index365/mcp
- License: [MIT](LICENSE)
