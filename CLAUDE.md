# ramiefathy.github.io — Claude Code project context

Your project's canonical context lives in the shared agent vault:

`~/vault/01_projects/ramiefathy.github.io.md`

Read it before starting any work. It contains current state, tech stack
gotchas, open PRs, key files, and wikilinks to related projects.

Per `~/vault/SOUL.md` §Multi-agent coordination, when you ship work:

1. Commit message format: `agent(claude-code): <summary>`
2. Append a one-line entry to `~/vault/01_projects/ramiefathy.github.io.md` under
   `## Recent updates`:

       - YYYY-MM-DD <summary>. claude-code @ <commit-hash> in <repo>.

3. Before exiting non-trivial sessions, capture session learnings to
   `~/vault/00_inbox/`.

If the vault is not present at `~/vault/`, this project is being worked
on in a context without the shared vault available. Proceed normally but
log progress only via repo commits in that case.
