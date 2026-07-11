# Scan and fix one finding

Use this example only on a website you are authorized to assess and change. It requests an index365 AI-Readiness or Marketing Signal scan and works from the prioritized findings returned. It does not run a dedicated Website Security scan, replace a full crawler, monitor AI visibility, or authorize autonomous fixes.

## Prerequisites

- Node.js 20.18 or newer.
- An index365 account. Browser login is the default; in a supported non-browser environment, use a dedicated revocable organization-scoped API key and verify it with `index365 doctor`.
- A local repository that serves the website being assessed.

## Install and verify

```bash
npx skills add index365usa/agent-skills
npm install -g @index365/cli
index365 login
index365 doctor
```

## Ask the coding agent

```text
Use the index365-audit-and-fix skill on https://example.com. Request the appropriate index365 scan, read the returned findings, choose one in-repo finding with a bounded safe correction, show me the proposed diff, and stop for approval before applying it. After approval, apply only that correction and re-run the same scan to verify the result. Do not claim a score improvement unless the re-run proves it.
```

Replace `https://example.com` with the authorized project URL. Keep generated reports in the skill's ignored artifact directory. Review every proposed change before approval. A finding or score is evidence from one run, not a guarantee of search performance, organizational AI readiness, security, or revenue.
