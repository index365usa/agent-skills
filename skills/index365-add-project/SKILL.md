---
name: index365-add-project
description: |
  Use when the user wants to start auditing a domain that is not yet an index365 project.
  Triggers: "add a site to index365", "start auditing example.com", "track this domain",
  "create an index365 project for…", or any run/audit request where the domain has no
  project yet (a `projects list` doesn't show it). Creating a project is the prerequisite
  for running an audit.
allowed-tools:
  - Bash(index365 *)
---

# index365 add project

Create a project so you can run audits against a domain.

## Prerequisite

A key with the `projects:write` scope (`index365 doctor` shows scopes). If it's missing,
use **index365-setup** to create a scoped key, do not work around it. Not installed?
`npm install -g @index365/cli && index365 login` gets a working key in one step.

## Create

```bash
index365 projects create --domain example.com --name "Example" --json
```

- `--domain` is required; `--name` is optional (defaults from the domain).
- **Idempotent by domain.** If a project for that domain already exists, the same project
  is returned (the human output shows `[already existed]`, the JSON has `"idempotent": true`).
  Safe to re-run, it never creates a duplicate.
- Per-plan project limits apply (Starter 1 / Pro 5 / Agency 25). Exit code `5` means the
  limit is reached.

Capture the returned `projectId`, every audit command needs it.

## Check first (optional)

```bash
index365 projects list --json    # is the domain already a project?
```

## Next

Hand off to **index365-run-audit** with the `projectId` to run the first audit.
