---
name: index365-add-project
description: |
  Use when the user wants to start auditing a domain that index365 does not track yet.
  Triggers: "add a site to index365", "start auditing yoursite.com", "track this domain",
  "create an index365 project for…". Scanning a new domain creates its project in the
  same command, so the usual answer is one `scan`. Use the explicit create only to
  pre-register a domain without spending credits on a scan.
allowed-tools: Bash(index365 *)
---

# index365 add project

Projects anchor scan history to a domain. You almost never create one as a separate
step: the first scan of a new domain creates it.

## The normal path: just scan

```bash
index365 scan yoursite.com
```

`scan` resolves the project from the url's domain. On a new domain it asks exactly
one question, `yoursite.com is new. Create the project and scan it for 10 credits?
[Y/n]`, showing the price and your credit balance. Answering yes creates the project
and starts the scan in one go.

Agents and CI add `--yes`: a non-interactive shell never prompts, and without `--yes`
it refuses to create silently (exit 2, with the exact `--yes` command in the `next:`
hint). Nothing is ever created or spent without that opt-in.

Hand off to **index365-run-audit** for scan options, or straight to
**index365-read-report** once the score card prints.

## Pre-create without scanning

Only when the user explicitly wants to register the domain now and scan later:

```bash
index365 projects create --domain yoursite.com --name "YourSite"
```

- `--domain` is required; `--name` is optional (defaults from the domain).
- **Idempotent by domain.** If the domain already has a project, the same project is
  returned (`[already existed]` in human output, `"idempotent": true` in `--json`).
  Safe to re-run, it never creates a duplicate.
- Creating spends nothing. Projects are unlimited on every plan, including Free;
  only scans cost credits.

## Good to know

- One project covers every subdomain of its domain. If the user asks to audit a
  subdomain of a site already tracked, no new project is needed.
- `index365 projects list` shows what is already tracked, but you do not need to
  check first: `scan` tells you when a domain is new, and `projects create` is
  idempotent.
