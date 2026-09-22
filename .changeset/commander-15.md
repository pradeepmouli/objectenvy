---
"objectenvy-cli": patch
---

Bump `commander` from `^14.0.3` to `^15.0.0` (runtime dependency). Commander 15 is ESM-only and requires Node ≥22.12.0 — updated `engines` accordingly (CI already runs 24.x/26.x). Verified the `--comments`/`--no-comments` default-value behavior change doesn't affect this CLI: `generate-env.ts` already normalizes with `options.comments !== false`.
