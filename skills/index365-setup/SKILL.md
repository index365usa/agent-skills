---
name: index365-setup
description: |
  Use when index365 is being used for the first time, when any index365 command exits 3
  or returns a 401 / auth error, when `index365 doctor` reports missing authentication,
  or when the user says "connect index365", "set up index365", "log in to index365", or
  "add my index365 API key". This is the recovery path for every other index365 skill.
  Do not work around missing or insufficient authentication, fix it here.
allowed-tools: Bash(index365 *) Bash(npx -y @index365/cli *) Bash(npm install -g @index365/cli) Bash(claude mcp add *)
---

# index365 setup

Get the `@index365/cli` installed and signed in.

## 1. Install

```bash
npm install -g @index365/cli   # then the bin is `index365`
# If global installation is unavailable, define this wrapper in the current shell:
index365() { npx -y @index365/cli "$@"; }
```

Install unpinned so a new machine gets the current CLI. The CLI reports its own updates.

## 2. Sign in

```bash
index365 login
```

`index365 login` opens the browser: you authorize on the dashboard and the key saves
itself (loopback + PKCE, nothing to copy or paste). It confirms who you are signed in
as and your credit balance. That is the whole flow on a machine with a browser.

In CI or a non-interactive runtime the browser consent cannot complete, so a bare
`login` exits 3 with the exact alternative. Create a dedicated revocable API key in
**Org settings → API keys** (available on every plan, including Free), then use one
of:

```bash
export INDEX365_API_KEY=i365_xxx   # preferred: keeps the key out of shell history
index365 login --key i365_xxx
```

The key is saved to `~/.config/index365/config.json` (mode 0600). `INDEX365_API_KEY`
overrides the file. Never print the key in shared logs.

## 3. Verify

```bash
index365 --status
```

`--status` shows auth, org, plan, credits, and your latest run at a glance. If it
shows you signed in, hand back to whatever skill triggered setup: no further
pre-flight is needed, every command self-reports failures through exit codes and a
`next:` hint.

## Troubleshooting (this is where `doctor` lives)

`index365 doctor` diagnoses auth, connectivity, version, and config permissions;
`doctor --fix` applies the safe fixes. Reach for it only when a command's own error
message is not enough.

| Symptom | Fix |
| --- | --- |
| Exit code 3 / "auth" on any command | key is missing, wrong, or revoked: run `index365 login` again, or set a fresh `INDEX365_API_KEY` in a non-browser runtime |
| `login` exits 3 saying it needs a browser | non-interactive shell: use `INDEX365_API_KEY` or `index365 login --key <key>` |
| A command says the credential lacks a scope | sign in again through `index365 login`; current keys carry the full work-area scope set. If the scope is still absent, stop and report it |
| `index365: command not found` | npm global bin not on PATH, or use `npx -y @index365/cli` |
| Exit code 5 / quota or rate | plan limit or rate limit: wait and retry, or check the plan |
| Config permission warnings | `index365 doctor --fix` |

## MCP (optional, for Claude Code / Codex / Cursor)

```bash
index365 mcp config   # prints ready-to-paste config for each host
```

The MCP server calls the same `/api/v1` as the CLI and acts with the credential's
scopes. Credit-spending and destructive calls keep their separate confirmation gates.
