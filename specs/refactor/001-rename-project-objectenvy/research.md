# Research — Refactor 001: Rename to ObjectEnvy

## Decisions

- Decision: Unify naming to `objectenvy`, `objectenvy-cli`, `objectenvy-vscode`.
  - Rationale: Consistent branding, clearer scope, easier onboarding.
  - Alternatives considered: Keep existing names; deprecate over time. Rejected due to ongoing confusion and duplicated CLI surface.

- Decision: Merge `env-y-config` and `config-y-env` into a single CLI (`objectenvy-cli`).
  - Rationale: Reduce duplication, single entrypoint, simpler docs and support.
  - Alternatives considered: Keep separate CLIs; create meta-runner that proxies. Rejected to avoid indirection and maintenance cost.

- Decision: Preserve core library behavior and types; zero-runtime dependencies remain mandatory.
  - Rationale: Constitution Principle VII; avoid regressions and preserve consumer expectations.
  - Alternatives considered: Introduce helpers as runtime deps. Rejected per Constitution.

- Decision: Treat publication as MAJOR releases for renamed packages.
  - Rationale: Package name changes are breaking for consumers’ package.json.
  - Alternatives considered: Publish under old names with deprecations only. Rejected; we will publish deprecation stubs but primary channel moves to new names.

- Decision: Update tsconfig path mappings and pnpm workspace references in a single, validated commit per package move.
  - Rationale: Minimize cross-commit breakage; keep each step buildable and testable.
  - Alternatives considered: One-shot repo-wide rename. Rejected to keep revertability and easier review.

- Decision: VS Code extension renamed to `objectenvy-vscode` with identical activation events and commands updated to the new naming scheme.
  - Rationale: Align with ecosystem discovery and reduce confusion.
  - Alternatives considered: Keep old extension ID and just change displayName. Rejected; long-term identity should match package and repo names.

## Open Questions (Resolved)

- Public API changes: None. Only package names and import paths change.
- CLI arguments: Unchanged. Command names/flags preserved across the merge.
- Test strategy: Add critical tests before baseline (core API, CLI exec, extension activation, cross-package imports) as per testing-gaps.md.

## Implementation Notes

- Incremental steps with tests after each: rename core library → unify CLI → rename extension → docs/config updates.
- Use grep-driven validation to remove all references to old names before completion.
- Ensure Changesets prepared for MAJOR publishes and deprecation notices on old packages.

## References

- Spec: specs/refactor/001-rename-project-objectenvy/spec.md
- Constitution v1.1.0: .specify/memory/constitution.md
- AGENTS.md: project-wide coding standards
