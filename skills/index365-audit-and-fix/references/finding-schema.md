# index365 finding + report schema (agent contract v2)

Field reference for the JSON the CLI/MCP return. Authoritative source: the live API
(`/api/v1`); this is a convenience copy. Read it when mapping findings to fixes.

## Run (`index365 runs get <runId>` → `/api/v1/runs/{id}`)

| Field | Meaning |
| --- | --- |
| `runId` | Run identifier. |
| `status` | `queued` / `running` / terminal. Terminal: `completed`, `failed`, `failed_auto_credit`, `refunded`. |
| `progressPct`, `currentStep` | Live progress while running. |
| `score` | 0–100, `null` until the run completes. |
| `findingsTotal` | Total findings. |
| `severityCounts` | `{ critical, high, medium, low, info }` counts. |
| `url`, `humanUrl` | Audited URL; dashboard link for the run. |

## Report context (`index365 reports context <runId>` → `/api/v1/runs/{id}/report`)

The **orientation payload**: read this FIRST. Bounded by construction (`topFindings` is
capped at 10), so it fits in context.

| Field | Meaning |
| --- | --- |
| `schemaVersion` | `2`. |
| `product` | `ai_readiness` or `marketing_signal`. |
| `runId`, `projectId`, `url` | Identity. |
| `score`, `scoreLabel`, `execSummary` | Headline result + plain-language summary. |
| `severityCounts`, `findingsTotal` | Severity mix and total. |
| `topFindings[]` | **Capped at 10**: `{ findingId, severity, category, title, remediation }` (+ `stage` for marketing). For the FULL set, page `index365 findings list`. |
| `foundation` *(AI-Readiness)* | `{ sitemap, robotsTxt, llmsTxt: { present, notes } }`. |
| `stageScores`, `sourceCoverage`, `connectedSources`, `templatesAudited` *(Marketing Signal)* | Per-stage scores; `sourceCoverage` is `public_only` or `connected`. |
| `checks` | `{ pass, fail, info, rows[] }` deterministic check ledger (newer runs). `info` rows are emerging standards: reported, not scored. |
| `pagesCrawled`, `scanMode`, `model`, `costUsd` | Run provenance. |

## Finding (`index365 findings list/get` → `/api/v1/runs/{id}/findings[/{findingId}]`)

The full, paginated finding objects. Use these to fix.

| Field | Meaning |
| --- | --- |
| `findingId` | Stable id: `f_` + 16 hex (sha256 of run + severity + title + page url). Exact dupes get a `-2`, `-3` suffix. **Same across re-serves of the same run**: match on this to diff runs. |
| `severity` | `critical` / `high` / `medium` / `low` / `info`. |
| `category` | Fixed AI-Readiness taxonomy (e.g. `answerability`). Marketing findings also carry `stage`. |
| `stage` *(Marketing Signal only)* | `Find` / `Trust` / `Act` / `Measure` / `Improve`. |
| `confidence` | `high` (a deterministic code check verified it) / `medium` (LLM-judged). |
| `status` | `open` / `acknowledged` / `resolved` / `wont_fix`. |
| `title`, `detail` | Short title + full explanation. |
| `evidence[]` | `{ type: page \| file \| check, url?, summary }`, what the finding points at. |
| `affectedUrls[]` | The page(s) to fix. **Map these to repo files.** If they don't resolve to a file here, it's an out-of-repo fix, report it, don't invent a change. |
| `remediation` | Human fix instruction. |
| `agentActions[]` | `{ type: "remediation", description }`, the machine-readable fix. **Prefer this over re-deriving from `remediation`.** |
| `humanUrl` | Dashboard view of the run. |
| `source` | `{ scanMode, model }` provenance. |

## How to read efficiently

1. `reports context` → file → `jq '{score, severityCounts, findingsTotal}'` for orientation.
2. `findings list --run <id> --severity critical` (then `high`) for the worst items.
3. `findings get --run <id> <findingId> --json` per item you intend to fix; act on `agentActions`.
4. Never paste a whole report into context, read from `.index365/` with `jq`/`grep`.
