# Your harness

This file is yours, and it arrives empty on purpose. The rules you hold the
agent to are part of what gets marked, so they should be rules you decided on.

Nothing about the starter is recorded here. What the repo ships is explained
where it lives --- `fly.toml`, the `Dockerfile`, the CI workflow and
`spec/README.md` each say what they fix --- and the
[course website](https://comp.anu.edu.au/courses/comp4020-agentic-coding-studio/)
publishes this deliverable's brief and spec. Read them before you plan or build;
what the agent needs to carry from any of it is your call.

## How to work in here

- Keep the dev server running so you see changes as you make them.
- Run `pnpm check` before you push.
- Open the page in a browser and look at it. The rendered page is the truth;
  your mental model of it isn't.
- When a check fails, read its output before you change anything.
- Never commit a red state.

## Gotchas found so far

- **Two Claude sessions in one working tree will clobber each other, and git
  gives you no warning at all.** `git status` shows the union of both
  sessions' edits as one indistinguishable set of modified files, so a `git
  stash`, `git restore` or `git checkout` by either one silently destroys the
  other's uncommitted work, and a `git commit -a` ships a half-finished
  feature nobody reviewed. `ListAgents` lists peer sessions and `SendMessage`
  reaches them: check file mtimes against your own edits when something you
  did not touch breaks, agree who owns which files, and verify your own
  changes in a throwaway `git worktree` at HEAD with your files copied in.
