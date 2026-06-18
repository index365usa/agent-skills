---
name: index365-run-audit
description: |
  Use when the user wants to run or re-run an index365 audit on a project. Triggers:
  "run an audit", "scan my site", "check my AI-readiness score", "re-run the audit",
  "run a marketing signal audit", "audit example.com again". Covers both audit types
  (AI-Readiness and Marketing Signal) and how to wait for the score. A run is a paid
  action, see below.
allowed-tools:
  - Bash(index365 *)
---

# index365 run audit

Start an audit and (optionally) wait for the score.

## Prerequisites

- A `projectId` (from **index365-add-project** or `index365 projects list`).
- A key with `runs:write` (`index365 doctor` shows scopes). Missing → **index365-setup**.

## Pick the audit type

| Run this | When the user cares about | scanMode |
| --- | --- | --- |
| `index365 runs start` | how AI agents + AI search read the site (AI-Readiness) | `paid_ai_readiness` |
| `index365 marketing run` | whether demand can find, trust, act, and be measured (Marketing Signal) | `paid_marketing_signal` |

If unsure, default to AI-Readiness; ask only if the user's intent is genuinely split.

## Run and wait

```bash
# AI-Readiness, block until the score lands (~2–5 min; polls every 5s):
index365 runs start --project prj_xxx --wait --json

# Marketing Signal:
index365 marketing run --project prj_xxx --wait --json
```

- `--wait` polls until the run reaches a terminal status (`completed`, `failed`,
  `failed_auto_credit`, `refunded`), then prints the final run with `score` and
  `findingsTotal`. Without `--wait` it returns immediately with a `runId` to poll via
  `index365 runs get <runId>`.
- Record the `runId` and the baseline `score`, re-runs compare against it.

## Paid action, retry safely

A run consumes credits. To make a retry safe (network blip, agent re-entry), pass a
stable idempotency key so a repeat returns the same run instead of double-spending:

```bash
index365 runs start --project prj_xxx --idempotency-key "$(date +%F)-prj_xxx-airead" --wait --json
```

## Next

Hand off to **index365-read-report** with the `runId` to read the score and findings,
or **index365-audit-and-fix** to run, read, and fix in one loop.
