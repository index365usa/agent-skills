---
name: index365-delete-project
description: |
  Use when the user wants to remove a project from index365. Triggers: "delete the
  index365 project for…", "remove example.com from index365", "stop tracking this site",
  "clean up old projects". This is the only destructive index365 action and it is
  irreversible. Use this skill whenever a delete is requested, never call
  `index365 projects delete` ad hoc.
allowed-tools:
  - Bash(index365 *)
---

# index365 delete project

Permanently delete an index365 project.

**Deleting a project is a hard, irreversible delete.** It cascades: the project's audit
runs, findings, API keys pinned to it, and monitoring are removed. There is no recovery
window and no soft-delete. Treat it accordingly.

## Iron rule

**Never delete a project the user did not name by its exact domain in this conversation.**
You must read the project first and confirm the exact domain back to the user before deleting.

## Workflow

1. **Find it: read before destroy.**
   ```bash
   index365 projects list --json
   ```
   Identify the single project the user means. If more than one could match, list the
   candidates and ask which one. Never guess.

2. **Confirm the exact domain with the user.** State what will be deleted and that it is
   permanent and cascading:
   > "This permanently deletes `example.com` (projectId `prj_…`) and all its audits and
   > findings. This cannot be undone. Confirm the domain to proceed."
   Wait for the user to confirm the exact domain.

3. **Delete with the echo-confirm.** The API requires the project's exact domain as
   `--confirm`; a mismatch is rejected (400). The CLI also re-reads the project first.
   ```bash
   index365 projects delete prj_xxx --confirm example.com
   ```

4. **Report** what was deleted (domain + projectId).

## Prerequisite

A key with the `projects:delete` scope (separate from `projects:write`, a create-capable
key cannot delete). If missing, use **index365-setup**, or `index365 login` directly if
that skill isn't installed. Project-pinned keys are blocked from deleting entirely (403).

## Red flags: STOP

- The user said "delete all my projects" / "delete everything" / used a wildcard → **refuse
  the bulk form.** Delete one project at a time, each with its own confirmation.
- You're about to pass `--confirm` with a domain you inferred rather than read from
  `projects list` → STOP, read it first.
- You're tempted to skip the confirmation "because the user is in a hurry" → the
  confirmation is the safety; it stays.
- You can't tell which of several projects the user means → ask, don't pick.

## Rationalizations (all false)

| Excuse | Reality |
| --- | --- |
| "It's obviously the only project" | Read `projects list` and confirm anyway. Cheap. |
| "The user clearly wants all of them gone" | Confirm each domain individually. No bulk delete. |
| "I'll soft-delete / it's recoverable" | It is NOT. Hard delete, cascading, no recovery. |
| "Echo-confirm is just ceremony" | It's the thing that makes a wrong delete impossible. |
