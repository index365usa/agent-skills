---
name: index365-add-project
description: |
  Use when the user wants to start auditing a domain that is not yet an index365 project.
  Triggers: "add a site to index365", "start auditing example.com", "track this domain",
  "create an index365 project for…", or any run/audit request where the domain has no
  project yet (a `projects list` doesn't show it). Creating a project is the prerequisite
  for running an audit.
allowed-tools: Bash(index365 *)
---

# index365 add project

Create a project so you can run audits against a domain.

## Prerequisite

An authenticated credential with `projects:write` (`index365 doctor` shows scopes).
Current dashboard API keys include it by default. If it is missing, use
**index365-setup** to reauthenticate through a supported path; do not work around it.

## Create

```bash
index365 projects create --domain example.com --name "Example" --json
```

- `--domain` is required; `--name` is optional (defaults from the domain).
- **Idempotent by domain.** If a project for that domain already exists, the same project
  is returned (the human output shows `[already existed]`, the JSON has `"idempotent": true`).
  Safe to re-run, it never creates a duplicate.
- Projects are unlimited on every current plan, including Free. Paid scans remain
  separately credit-gated.

Capture the returned `projectId`, every audit command needs it.

## Check first (optional)

```bash
index365 projects list --json    # is the domain already a project?
```

## Next

Hand off to **index365-run-audit** with the `projectId` to run the first audit.
