# Git branching

This repository follows a lightweight **GitHub Flow**–style workflow.

## Branches

- **`main`** — always deployable; protected in CI via pull requests.
- **Short-lived branches** — merge back through a PR:
  - `feature/<short-description>` — new behavior
  - `fix/<short-description>` — bug fixes
  - `chore/<short-description>` — tooling, deps, docs without product change

Use lowercase, hyphens, and keep names short enough to scan in `git branch`.

## Daily workflow

```bash
git checkout main
git pull origin main
git checkout -b feature/your-change
# … commit …
git push -u origin feature/your-change
```

Open a PR into `main`, wait for green CI, squash or merge per team preference.

## Optional GitHub settings

- Require PR before merging to `main`.
- Require status checks (CI) to pass.
- Disallow force-push to `main` if the repo is shared.
