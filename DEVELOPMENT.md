# Development & Release Process

## Branch model

- `develop` — integration branch. All feature/fix work merges here first.
- `master` — release branch. Kept in sync with `develop` via a standing "Sync develop into master" PR.

Work happens on short-lived branches off `develop`, merged via PR. Once `develop` is in a good state, the develop→master PR is merged to promote it.

## Packages

- `objectenvy` — the main library, published.
- `objectenvy-vscode` — private, not published.
- `objectenvy-cli` — published to npm on its own, but **`.changeset/config.json` lists it in `"ignore"`** — changesets will never version or publish it automatically. Don't put it in the same changeset as `objectenvy`; a changeset that mixes an ignored package with a non-ignored one fails outright with `Mixed changesets that contain both ignored and not ignored packages are not allowed`. If `objectenvy-cli` needs a release, handle it separately from the changeset flow.

## Adding a changeset

```bash
pnpm changeset
```

Select `objectenvy` (and/or other non-ignored packages) and a bump type, write a real summary, commit the generated `.changeset/*.md` alongside your change.

If you forget, the "Auto-generate Changeset" workflow (`.github/workflows/changeset.yml`) will synthesize one from your commit messages when your PR opens/updates. **Check the generated file before merging** — the auto-generator scans all non-private `packages/*/package.json` and doesn't know about the ignore-list rule above, so it can (and has) produced a mixed changeset that fails in the Release job. Split or trim it if so.

## Release automation (fully automatic once a valid changeset lands)

The `Release` workflow (`.github/workflows/release.yml`) runs on every push to `develop` or `master`. When it finds pending changesets, it:

1. Opens or updates a **"chore: version packages"** PR from `changeset-release/<branch>` targeting that same branch. This PR contains the version bump + CHANGELOG update — don't edit it by hand, just let it accumulate changesets.
2. Attempts to enable GitHub's native auto-merge on that PR (needs "Allow auto-merge" on in repo settings — if it's off, the PR just sits there and needs a manual merge).
3. When that Version Packages PR merges, the *next* run of the Release workflow (triggered by that merge) runs `pnpm changeset:publish`, which publishes the bumped package(s) to npm with provenance.

So: merge your PR to `develop` → Version Packages PR appears → merge it (or let auto-merge do it) → package publishes. No manual `npm publish` ever.

The `Release` job uses **Node 22** specifically — keep this in sync if you copy the workflow to another repo.

## CI

`.github/workflows/ci.yml` runs the matrix (Node 24.x, 26.x): install, build, type-check, test, lint. `CodeQL` and `Dependency Security Audit` run as separate checks on the same PR.

If CodeQL flags something and you're confident it's a false positive, dismiss it from the repo's Security → Code scanning tab with a specific reason — don't silence it in code just to turn the check green.

## Local commands

```bash
pnpm install --frozen-lockfile   # match CI exactly
pnpm build
pnpm test
pnpm type-check
pnpm lint
```

`pnpm run <script>` and `pnpm --filter <pkg> <script>` re-verify the lockfile against pnpm's `minimumReleaseAge` policy even with a fresh install — this repo sets `minimumReleaseAge: 0` in `pnpm-workspace.yaml` so a freshly-published transitive dependency never blocks a local install or CI run.

If a git hook (pre-commit/pre-push) is getting in the way of something you've already verified manually, bypass it with `SKIP_SIMPLE_GIT_HOOKS=1` rather than `--no-verify` — it's the hook's own documented escape hatch and shows up explicitly in its output.

## Current gap: branch protection

Branch protection on `master`/`develop` is currently **disabled** (as of 2026-07-30) — the auto-changeset bot's `GITHUB_TOKEN` couldn't push past it (only `RELEASE_TOKEN`, a real user PAT, can), and GitHub's newer Rulesets don't support bot bypass on personal (non-org) repos either. If you re-enable protection, expect the `Auto-generate Changeset` workflow to start failing again unless you also switch it to use `RELEASE_TOKEN` (or an equivalent PAT/GitHub App) instead of the default `GITHUB_TOKEN`.
