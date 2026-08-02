---
name: index365-delete-project
description: |
  Use when the user wants to remove a project from index365. Triggers: "delete the
  index365 project for…", "remove yoursite.com from index365", "stop tracking this site",
  "clean up old projects". Removal archives the project and is reversible with
  `index365 projects restore`, and it still requires exact-domain confirmation. Use this
  skill whenever a removal is requested, never call `index365 projects archive` ad hoc.
allowed-tools: Bash(index365 *)
---

# index365 archive project

Remove an index365 project from the active set by archiving it.

**Archiving is reversible.** The project moves to `archived` status, scan history and
project-scoped API keys stay available, and `index365 projects restore <project-id>`
reactivates the same project. Archived projects remain listable with
`index365 projects list --status archived`. This is not a hard delete, nothing
cascades, and there is no unrecoverable state to warn the user about.

The confirmation gate stays regardless. Archiving the wrong project pulls a live site
out of the active set and out of any scheduled work, and the user is the only one who
can say which domain they meant.

This is the one index365 command that takes a project id, because the API requires
the id paired with the exact domain as a cross-check. Read the id from
`projects list` in this conversation; never reuse one from memory or a prior session.

## Iron rule

**Never archive a project the user did not name by its exact domain in this
conversation.** You must read the project first and confirm the exact domain back to
the user before archiving.

## Workflow

1. **Find it: read before you act.**
   ```bash
   index365 projects list
   ```
   Identify the single project the user means and its project id from the listing.
   If more than one could match, list the candidates and ask which one. Never guess.

2. **Confirm the exact domain with the user.** State what will happen and what is
   preserved:
   > "This archives the `yoursite.com` project. Scan history and project-scoped API
   > keys stay available, and `index365 projects restore <project-id>` reactivates
   > it. Confirm the domain to proceed."
   Wait for the user to confirm the exact domain.

3. **Archive with the echo-confirm.** The API requires the project's exact domain as
   `--confirm`; a mismatch is rejected. The CLI also re-reads the project first.
   ```bash
   index365 projects archive <project-id> --confirm yoursite.com
   ```

4. **Report** what was archived (domain + project id) and how to undo it:
   `index365 projects restore <project-id>`.

## Red flags: STOP

- The user said "delete all my projects" / "delete everything" / used a wildcard →
  **refuse the bulk form.** Archive one project at a time, each with its own
  confirmation.
- You're about to pass `--confirm` with a domain you inferred rather than read from
  `projects list` → STOP, read it first.
- You're tempted to skip the confirmation "because the user is in a hurry" → the
  confirmation is the safety; it stays.
- You can't tell which of several projects the user means → ask, don't pick.

## Rationalizations (all false)

| Excuse | Reality |
| --- | --- |
| "It's obviously the only project" | Read `projects list` and confirm anyway. Cheap. |
| "The user clearly wants all of them gone" | Confirm each domain individually. No bulk archive. |
| "Archiving is reversible, so I can archive first and ask later" | Reversible is not harmless. The site leaves the active set and any scheduled work until someone notices. Confirm first. |
| "Echo-confirm is just ceremony" | It's the thing that makes archiving the wrong domain impossible. |
