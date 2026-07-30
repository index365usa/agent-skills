---
name: index365-setup
description: |
  Use when index365 is being used for the first time, when any index365 command returns
  a 401 / auth error, when `index365 doctor` reports missing authentication or a denied scope,
  or when the user says "connect index365", "set up index365", "log in to index365", or
  "add my index365 API key". This is the prerequisite gate for every other index365 skill.
  Do not work around missing or insufficient authentication, fix it here.
allowed-tools: Bash(index365 *) Bash(npx -y @index365/cli *) Bash(npm install -g @index365/cli) Bash(claude mcp add *)
---

# index365 setup

Get the `@index365/cli` installed and authenticated for the task.

## 1. Install

```bash
npm install -g @index365/cli   # then the bin is `index365`
# If global installation is unavailable, define this wrapper in the current shell:
index365() { npx -y @index365/cli "$@"; }
```

Install unpinned so a new machine gets the current CLI. The CLI reports its own updates.

## 2. Log in

```bash
index365 login
```

Interactive `index365 login` asks how you want to sign in, and browser is the default
choice, so pressing Enter opens the browser (loopback and PKCE, nothing to paste).
`index365 login --web` skips the menu and goes straight to the browser.

A non-interactive runtime cannot show the menu, and bare `index365 login` exits 2 there
with guidance rather than picking for you. Pass `--web` if a browser can open. Otherwise
create a dedicated revocable API key in
**Org settings → API keys**. Keys are available on every plan, including Free. Current
API keys are organization-scoped and carry the full work-area scope set; the dashboard
does not offer a restricted-scope preset. Then use one supported non-browser path:

```bash
index365 login --key i365_xxx
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

## Scope readback

| Scope | Lets the credential… | Needed by |
| --- | --- | --- |
| `projects:read runs:read findings:read reports:read` | read projects, runs, findings, and reports | read-report, triage |
| `runs:write` | start audits | run-audit, audit-and-fix |
| `projects:write` | create projects | add-project |
| `projects:delete` | archive projects (the scope name predates the rename) | delete-project |

The API still enforces the named scope on every endpoint. Current dashboard API keys and
browser/OAuth credentials use the same full work-area scope set; `index365 doctor` is the
readback. If a legacy or unsupported credential reports a missing scope, reauthenticate
through the supported login path and do not work around it. Do not imply that the current
dashboard can mint a restricted key.

## MCP (optional, for Claude Code / Codex / Cursor)

```bash
index365 mcp config            # prints ready-to-paste config for each host
# Claude Code one-liner:
claude mcp add index365 -e INDEX365_API_KEY=i365_xxx -- npx -y @index365/mcp
```

The MCP server acts with the credential's scopes. Current dashboard API keys include
`runs:write`, `projects:write`, and `projects:delete`, so MCP can start scans and manage
projects. Credit-spending and destructive calls retain their separate confirmation gates.

## Troubleshooting

| Symptom | Fix |
| --- | --- |
| `doctor` says key MISSING | run `index365 login`; without a browser, use `index365 login --key <key>` or set `INDEX365_API_KEY`, and never print the key in shared logs |
| Exit code 3 / "auth" on any command | key is wrong or revoked: run browser login again, or use `index365 login --key <key>` / `INDEX365_API_KEY` with a fresh key in a non-browser runtime |
| A command says the credential lacks a scope | run browser login again or use a fresh current full-scope API key; if the scope is still absent, stop and report the unsupported grant |
| `index365: command not found` | npm global bin not on PATH, or use `npx -y @index365/cli` |
| Exit code 5 / quota or rate | plan limit or 60/min rate, wait and retry, or check the plan |
