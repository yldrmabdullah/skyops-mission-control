# Git branching and deployment

This repository uses a **two long-lived branch** model so **Render (and similar) can track a stable production branch** while day-to-day work lands on **`dev`**.

## Long-lived branches

| Branch       | Role                                                                                                              |
| ------------ | ----------------------------------------------------------------------------------------------------------------- |
| **`dev`**    | Integration branch. Open PRs here from feature/fix/chore branches.                                                |
| **`master`** | **Production.** Only promote tested work from `dev` (merge or PR). **Render production blueprint uses `master`.** |

### Optional: `main`

If GitHub’s default branch is still `main`, either keep it in sync with `master` for visibility or switch the default branch to `dev` / `master` per team preference. CI runs on `main`, `master`, and `dev` pushes.

### Legacy branches

Older names such as `release/dev` or `release/test` are redundant with this model; prefer **`dev`** + **`master`** to avoid confusion.

## Short-lived branches

Always branch **from `dev`**, merge back via PR into **`dev`**:

- `feature/<short-description>`
- `fix/<short-description>`
- `chore/<short-description>`

Use lowercase and hyphens.

## Daily workflow

```bash
git checkout dev
git pull origin dev
git checkout -b feature/your-change
# … commit …
git push -u origin feature/your-change
```

Open a PR into **`dev`**. After CI passes, merge.

## Release to production (Render)

When `dev` is ready for production:

```bash
git checkout master
git pull origin master
git merge dev
git push origin master
```

Render services configured with `branch: master` (see [`render.yaml`](../render.yaml)) deploy from that push.

## Staging on Render (`dev`)

Use [`render.dev.yaml`](../render.dev.yaml) for a **separate** Blueprint (or manual services) so staging builds from **`dev`** with its own database. After the first deploy, confirm the dev API hostname in the Render dashboard and adjust **`VITE_API_BASE_URL`** on the dev static site if the URL differs from the placeholder.

## Optional GitHub settings

- Protect **`master`**: require PR, required checks, no direct push if the team agrees.
- Protect **`dev`**: require CI to pass before merge.
- Default branch: **`dev`** if most work starts there.
