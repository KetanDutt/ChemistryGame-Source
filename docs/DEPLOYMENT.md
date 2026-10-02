# Deployment & GitHub Pages Publishing

The project includes a zero-dependency deployment system that compiles the
production bundle (`dist/`), pushes the built artifacts to a dedicated branch
(default: `gh-pages`), and configures GitHub Pages to publish from that branch.

Live URL (once published):
**https://ketandutt.github.io/ChemistryGame-Source/**

---

## Architecture overview

```
Source branch (main)
   │
   ├─ 1. npm run build ─────────► dist/ (index.html + bundle.min.js)
   │
   ├─ 2. scripts/deploy.js ─────► Isolated OS temp repo:
   │                                • index.html
   │                                • 404.html (SPA fallback)
   │                                • bundle.min.js
   │                                • .nojekyll (bypasses Jekyll)
   │                                • CNAME (optional custom domain)
   │
   ├─ 3. git push --force ──────► origin/gh-pages (working branch untouched)
   │
   └─ 4. GitHub Pages REST API ─► Enables / updates Pages source (gh-pages, /)
                                  and triggers an immediate Pages build
```

### Why an isolated temporary repository?

`scripts/deploy.js` stages and commits the production output inside a fresh
temporary directory (`os.tmpdir()`) and pushes `HEAD:refs/heads/<branch>`
directly to the remote. This guarantees that:

- Your checked-out working branch is **never** switched or modified.
- `dist/` remains `.gitignore`d on source branches (`main`), keeping the source
  history free of 1.2 MiB minified bundles.
- The `gh-pages` branch contains a clean, single-commit snapshot of the static
  site root (`index.html`, `404.html`, `bundle.min.js`, `.nojekyll`).

---

## 1. Automated CI/CD (GitHub Actions)

The workflow at [`.github/workflows/deploy.yml`](../.github/workflows/deploy.yml)
runs automatically on every push to `main` and can also be triggered manually
from the **Actions** tab (`workflow_dispatch`).

### Pipeline steps

1. **Checkout** repository (`actions/checkout@v4`).
2. **Setup Node.js 20** with npm cache (`actions/setup-node@v4`).
3. **Install dependencies** (`npm ci`).
4. **Run headless test suite** (`npm test` — 15 assertions covering chemistry
   logic, levels, geometry utilities and the deployment system).
5. **Build production bundle** (`npm run build` → `dist/bundle.min.js` +
   `dist/index.html` with relative `publicPath: ""`).
6. **Push branch & publish Pages** (`node scripts/deploy.js --skip-build`) —
   pushes `dist/` to `origin/gh-pages`, configures GitHub Pages to serve from
   `gh-pages` (`/`) via the GitHub API, and writes a deployment summary to the
   GitHub Actions run page.

### Manual workflow dispatch inputs

When triggering **Build & Publish to GitHub Pages** manually in GitHub Actions,
you can optionally override:

| Input | Default | Description |
| ----- | ------- | ----------- |
| `branch` | `gh-pages` | Target branch to push the compiled build to |
| `cname` | *(empty)* | Optional custom domain written to `CNAME` |

---

## 2. Local / CLI Deployment (`npm run deploy`)

You can build, push the branch and publish to GitHub Pages directly from the
command line:

```bash
# Build dist/, push to origin/gh-pages, and publish to GitHub Pages
npm run deploy

# Dry run: build and verify the staged commit without pushing to the remote
npm run deploy:dry
```

### CLI options

Pass flags directly to `node scripts/deploy.js` (or after `--` with
`npm run deploy --`):

```bash
node scripts/deploy.js [options]
```

| Flag | Env variable | Default | Description |
| ---- | ------------ | ------- | ----------- |
| `-b, --branch <name>` | `DEPLOY_BRANCH` | `gh-pages` | Target branch to receive the production build |
| `-r, --remote <remote>` | `DEPLOY_REMOTE` | `origin` | Git remote name or repository URL/path |
| `-d, --dir <path>` | `DEPLOY_DIR` | `dist` | Build output directory to publish |
| `-m, --message <text>` | `DEPLOY_MESSAGE` | `Deploy production build from <sha>` | Commit message on the target branch |
| `--cname <domain>` | `CNAME` / `DEPLOY_CNAME` | *(none)* | Custom domain written to `CNAME` and configured via API |
| `--skip-build` | `DEPLOY_SKIP_BUILD=1` | `false` | Reuse existing `dist/` without running `npm run build` |
| `--skip-pages` | `DEPLOY_SKIP_PAGES=1` | `false` | Push the branch only; skip the GitHub Pages API call |
| `--dry-run` | `DEPLOY_DRY_RUN=1` | `false` | Stage and validate the commit in a temp repo without pushing |
| `-h, --help` | — | — | Print CLI usage |

### Examples

```bash
# Push build to a custom branch
npm run deploy -- --branch release-pages

# Deploy with a custom domain
npm run deploy -- --cname chemistry.example.org

# Push branch only (skip GitHub Pages API calls)
npm run deploy -- --skip-pages
```

---

## GitHub Pages API & Permissions

After pushing `refs/heads/<branch>`, `scripts/deploy.js` queries
`GET /repos/{owner}/{repo}/pages` using either `GITHUB_TOKEN` / `GH_TOKEN` or
an authenticated `gh` CLI session:

1. **First deployment (HTTP 404)**: Calls `POST /repos/{owner}/{repo}/pages`
   with `{"build_type":"legacy","source":{"branch":"gh-pages","path":"/"}}` to
   automatically enable GitHub Pages on the repository.
2. **Subsequent deployments (HTTP 200)**: Ensures the configured source branch
   matches `<branch>` (`PUT /repos/{owner}/{repo}/pages` if changed) and
   requests an immediate Pages build via
   `POST /repos/{owner}/{repo}/pages/builds`.
3. **Restricted token fallback**: If the token lacks repository administration
   scope on a first-time setup, the script still succeeds after pushing
   `gh-pages` and prints the one-time repo setting:
   **Settings → Pages → Build and deployment → Source: Deploy from a branch → `gh-pages` / `/ (root)`**.

---

## Related documentation

- [README.md](../README.md) — quick start, controls and project overview
- [docs/ARCHITECTURE.md](ARCHITECTURE.md) — runtime architecture, build tooling and test suite
- [docs/GAMEPLAY.md](GAMEPLAY.md) — rules, scoring and UX decisions
- [docs/CHEMISTRY.md](CHEMISTRY.md) — covalent bonding model and level campaign
