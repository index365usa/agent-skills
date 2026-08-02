---
name: index365-run-audit
description: |
  Use when the user wants to run or re-run an index365 scan. Triggers: "run an audit",
  "scan my site", "check my AI-readiness score", "re-run the audit", "run a marketing
  signal audit", "audit yoursite.com again". Covers both audit types (AI-Readiness and
  Marketing Signal), local pre-deploy scans, and async runs. A scan is a paid action,
  see below.
allowed-tools: Bash(index365 *)
---

# index365 run audit

One command. `scan` resolves the project from the domain, waits, and prints the
score card.

```bash
index365 scan https://yoursite.com --yes
```

- **AI-Readiness is the default.** For Marketing Signal (demand / traffic /
  conversion questions) add `--product marketing-signal`. If unsure, default to
  AI-Readiness; ask only if the user's intent is genuinely split.
- **Waiting is the default.** The command blocks until the score lands and renders
  the score card plus top findings. No polling, no ids to track.
- **`--yes` is for agents and CI.** A new domain normally asks one [Y/n] before
  creating the project and spending credits; `--yes` answers it. Non-interactive
  shells never prompt: without `--yes` a new domain exits 2 with the `--yes` command
  in the `next:` hint.
- **A scan spends 10 credits.** To make a retry safe (network blip, agent re-entry),
  pass a stable `--idempotency-key`; a repeat with the same key returns the same run
  instead of double-spending.

## Async (CI, long queues)

```bash
index365 scan yoursite.com --yes --no-wait   # queue it
index365 check                               # is it done yet?
```

`check` with no argument checks your most recent scan; `check yoursite.com` checks
that site's. When it completes, `index365 report` and `index365 findings` read it
with no ids.

## Local pre-deploy scan

`index365 scan local http://localhost:3000/` scores a page served on this machine
before you deploy (AI-Readiness only; the CLI uploads the capture, the server fetches
nothing). Add `--fail-under 80` to exit non-zero below a score floor: that is the CI
gate.

## After the scan

The score card already answers "what's my score". For findings, hand off to
**index365-read-report**; to compare against previous scans,
`index365 results yoursite.com` shows that site's score over time. A `--json` scan
response carries a `resolved` block naming the run it created, but downstream
commands do not need it: they default to the latest run.
