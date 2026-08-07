# Git Workflow Documentation

## Branching Strategy

This project uses the three-tier branching strategy required by the lab:

- **`main`** — production-ready, stable code only. Nothing is committed here directly; it only receives merges from `dev` once a batch of features has been reviewed and integrated.
- **`dev`** — the integration branch. Every feature branch is created from `dev` and merged back into `dev` via a reviewed pull request. This is where the TA reviews and approves each feature independently before it becomes part of the shared codebase.
- **`feature/*`** — one branch per feature, each cut from the tip of `dev`:
  - `feature/export-import-notes`
  - `feature/note-categories`
  - `feature/rich-text-formatting`
  - `feature/note-sharing`

Each feature branch was built, tested standalone, committed in logical units, and pushed for its own pull request into `dev`. Because the four features were implemented together in one working session and then split apart afterward, each branch was built **sequentially** — `feature/note-categories` was prepared on top of a `dev` that already had Feature 1's commits (locally advanced ahead of the real `dev` in anticipation of that PR being merged), and so on for Features 3 and 4. Each branch was verified to run correctly **on its own** (a fresh signup + a full smoke test of that feature, with zero console errors) before being committed, so every PR is a clean, self-contained diff against `dev` — not a mixed dump of all four features at once.

A short-lived `demo/merge-conflict-example` branch was also created, isolated from all four feature branches, specifically to demonstrate resolving a real merge conflict (see below) without putting any unreviewed content into the four real pull requests.

## Commit Conventions

Commit messages follow a `type(scope): description` style, e.g.:

```
feat(export-import): add note validation and merge logic to noteManager
feat(categories): add category assignment, filtering, and badges
feat(rich-text): add formatting toolbar and contenteditable note editor
feat(note-sharing): add read-only shared note view
docs: mention the four new lab features in the README
merge: resolve README conflict between demo branch and dev
```

- `feat(scope)` — new functionality, grouped by feature.
- `docs` — documentation-only changes.
- `fix` — bug fixes (used earlier in the project's history for the pre-existing bugs found during testing).
- Each feature has a **minimum of 3 commits**, and each commit is a discrete, reviewable unit of work rather than one giant "add feature" commit — e.g. Feature 2 (Categories) is split into: (1) the data model, (2) the events/rendering wiring, (3) the UI markup and styling.

## Merge Conflicts Encountered

A conflict was deliberately reproduced and resolved to demonstrate the process, kept isolated from the four real feature PRs so it wouldn't put unreviewed noise in front of the TA:

1. Branched `demo/merge-conflict-example` from `dev`, and added a line to `README.md`'s Features section:
   > "This lab extension adds four features on top of the base app: Export/Import, Categories, Rich Text formatting, and Note Sharing Links..."
2. Switched to `dev` and added a **different** line at the exact same spot in `README.md` (simulating a teammate's small doc edit landing on `dev` while the branch was open):
   > "Note: four Git-workflow lab features ... are being added via separate feature branches..."
3. Merging `dev` into `demo/merge-conflict-example` (`git merge dev`) produced a real conflict:

   ```
   <<<<<<< HEAD
   > This lab extension adds four features on top of the base app: Export/Import, Categories, Rich Text formatting, and Note Sharing Links. See [GIT_WORKFLOW.md](GIT_WORKFLOW.md) for the branching/PR process used to build them.
   =======
   _Note: four Git-workflow lab features (export/import, categories, rich text, and note sharing) are being added via separate feature branches — see the open pull requests._
   >>>>>>> dev
   ```

4. **Resolution**: opened `README.md`, removed the `<<<<<<<` / `=======` / `>>>>>>>` markers, and combined the two into a single sentence that kept the most useful part of each (the link to this file, plus the "built via feature branches" framing):
   > "This lab extension adds four features on top of the base app: Export/Import, Categories, Rich Text formatting, and Note Sharing Links, built via separate feature branches and pull requests. See [GIT_WORKFLOW.md](GIT_WORKFLOW.md) for the branching/PR process used to build them."
5. Staged the resolved file and completed the merge: `git add README.md && git commit`. Git automatically produces a merge commit at that point (`merge: resolve README conflict between demo branch and dev`).

## Git Commands Used

Commands used most throughout this workflow:

```bash
git checkout dev && git pull origin dev        # start each feature from an up-to-date dev
git checkout -b feature/feature-name           # create a feature branch
git status                                      # check what's staged/modified before committing
git diff / git diff --stat                      # review exactly what a commit will contain
git add <specific files>                        # stage only the files relevant to one logical commit
git commit -m "type(scope): message"            # commit in discrete, reviewable units
git push -u origin feature/feature-name         # publish the branch and set upstream
git log --oneline / --oneline --graph           # review commit history and branch structure
git merge <branch> --ff-only                    # fast-forward dev once a PR is merged
git merge <branch>                              # trigger/resolve a merge conflict
git branch -a                                   # list local + remote branches
git branch -d <branch> / git push origin --delete <branch>   # clean up after a PR is merged
```

## Screenshots

_Add these from your own GitHub repo and terminal before submitting:_

- [ ] `git log --oneline --graph --all` output showing commit history across `main`, `dev`, and the feature branches
- [ ] GitHub's branch list (Insights → Branches, or the branch dropdown) showing `main`, `dev`, and all `feature/*` branches
- [ ] The resolved conflict — either the terminal output of `git merge dev` showing `CONFLICT (content): Merge conflict in README.md`, or the diff of the merge commit (`f490686` on `demo/merge-conflict-example`) showing the before/after
- [ ] One of the four pull requests (e.g. `feature/export-import-notes` → `dev`) showing its title, description, and commit list
