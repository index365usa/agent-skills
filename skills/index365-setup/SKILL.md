---
name: index365-setup
description: |
  Use when index365 is being used for the first time, when any index365 command returns
  a 401 / auth error, when `index365 doctor` reports a missing key or a scope it needs,
  or when the user says "connect index365", "set up index365", "log in to index365", or
  "add my index365 API key". This is the prerequisite gate for every other index365 skill.
  Do not work around a missing or under-scoped key, fix it here.
allowed-tools:
  - Bash(index365 *)
  - Bash(npx -y @index365/cli *)
  - Bash(npm install -g @index365/cli)
  - Bash(claude mcp add *)
---

# index365 setup

Get the `@index365/cli` installed, authenticated, and scoped for the task.

## 1. Install

```bash
npm install -g @index365/cli   # then the bin is `index365`
# or run ad hoc without installing:
npx -y @index365/cli --help
```

## 2. Log in

Create an API key in the dashboard: **Org settings → API keys**. Keys are available on
any active paid plan. Choose the scope you need at creation time (see below), then:

```bash
index365 login          # prompts for the i365_ key (TTY)
# non-interactive (CI / agents):
index365 login --key i365_xxx
# or set the env var instead of saving a file:
export INDEX365_API_KEY=i365_xxx
```

The key is saved to `~/.config/index365/config.json` (mode 0600). `INDEX365_API_KEY`
overrides the file.

## 3. Verify

```bash
index365 doctor
```

Healthy output shows `Auth: ok`, the org, the granted scopes, and the contract version.
If `doctor` passes, hand back to whatever skill triggered setup.

## Scopes (grant only what the task needs)

| Scope | Lets the key… | Needed by |
| --- | --- | --- |
| `projects:read runs:read findings:read reports:read` | read everything (the read-only preset) | read-report, triage, monitor |
| `runs:write` | start audits | run-audit, audit-and-fix |
| `projects:write` | create projects | add-project |
| `projects:delete` | delete projects | delete-project |

Default keys are read-only. Mutating actions need the matching scope **granted at key
creation**: you cannot widen a key later, so create a new key with the right preset.

## MCP (optional, for Claude Code / Codex / Cursor)

```bash
index365 mcp config            # prints ready-to-paste config for each host
# Claude Code one-liner:
claude mcp add index365 -e INDEX365_API_KEY=i365_xxx -- npx -y @index365/mcp
```

The MCP server is read-only unless the key carries `runs:write` / `projects:write` /
`projects:delete`.

## Troubleshooting

| Symptom | Fix |
| --- | --- |
| `doctor` says key MISSING | run `index365 login` |
| Exit code 3 / "auth" on any command | key is wrong or revoked: `index365 login` with a fresh key |
| A command says it needs a scope the key lacks | create a new key with that scope, log in again |
| `index365: command not found` | npm global bin not on PATH, or use `npx -y @index365/cli` |
| Exit code 5 / quota or rate | plan limit or 60/min rate, wait and retry, or check the plan |
