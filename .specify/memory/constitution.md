<!--
Sync Impact Report - Constitution v1.1.0 (Workflow Enhancement)
================================================================================
Version Change: 1.0.0 → 1.1.0 (MINOR - Added workflow guidance)
Ratification Date: 2026-01-03
Last Amended: 2026-01-03

Amendment Summary:
  Enhanced Development Workflow section with:
  - Workflow type definitions (Core + 8 extension workflows)
  - Workflow selection criteria based on work nature
  - Quality gates specific to each workflow type
  - Clarified when to use each workflow (baseline, feature, bugfix, etc.)

Principles Established (v1.0.0):
  1. Type Safety First - TypeScript strict mode, explicit types, no `any`
  2. Test-Driven Public APIs - Unit tests mandatory for all public APIs
  3. Code Quality Standards - Automated linting, formatting, pre-commit hooks
  4. Semantic Versioning - MAJOR.MINOR.PATCH with conventional commits
  5. Documentation Discipline - JSDoc for public APIs, comprehensive README
  6. Modern TypeScript Patterns - async/await, ES2022+ features, zero dependencies
  7. Zero-Runtime Dependencies - Optional peer dependencies only (Zod)

Added in v1.1.0:
  - Workflow Types subsection under Development Workflow
  - Workflow Selection Guidelines subsection
  - Quality Gates by Workflow subsection (9 workflow types)

Template Alignment Status:
  ✅ .specify/templates/plan-template.md - Constitution Check section updated with specific gates
  ✅ .specify/templates/spec-template.md - User story testing aligns with TDD principle
  ✅ .specify/templates/tasks-template.md - Tests requirement updated from OPTIONAL to MANDATORY
  ✅ .specify/templates/checklist-template.md - General template, no updates needed
  ✅ .specify/templates/agent-file-template.md - General template, no updates needed
  ⚠️  AGENTS.md - Source document, no updates needed (constitution derived from this)
  ⚠️  README.md - Technical documentation, no governance updates needed

Follow-up Actions:
  - Delete enhancement prompt files across all agent directories
  - Verify workflow scripts in .specify/scripts/bash/ align with quality gates

Change Summary:
  Added comprehensive workflow guidance to clarify when to use each development
  workflow type (baseline, feature, bugfix, enhancement, etc.) and what quality
  gates apply to each. This prevents misuse of workflows and ensures appropriate
  rigor for each type of work.
================================================================================
-->

# envyconfig Constitution

## Core Principles

### I. Type Safety First (NON-NEGOTIABLE)

TypeScript MUST be used in strict mode with explicit return types for all public functions. The `any` type is prohibited except in rare, documented cases where type information is genuinely unavailable. All public APIs MUST provide complete type inference, enabling consumers to benefit from full IDE autocomplete and compile-time safety.

**Rationale**: Type safety is the foundation of envyconfig's value proposition. Users depend on accurate type transformations (`ToEnv`, `FromEnv`, schema inference) for build-time confidence. Weak typing undermines this core promise and creates runtime surprises.

### II. Test-Driven Public APIs (NON-NEGOTIABLE)

Every public API function, type utility, and exported interface MUST have comprehensive unit tests using Vitest. Tests MUST be written before implementation (TDD) or alongside it. Private implementation details do not require tests. Aim for high coverage of public surface area, not internal code paths.

**Rationale**: As a library handling environment variable parsing and type coercion, correctness is paramount. Untested public APIs risk breaking consumer code silently. TDD ensures APIs are designed for usability and edge cases are identified early.

### III. Code Quality Standards

All code MUST pass automated quality gates:
- **Linting**: oxlint with zero warnings
- **Formatting**: oxfmt with consistent style (2-space indent, single quotes, semicolons, no trailing commas)
- **Pre-commit**: Lint-staged hooks MUST run formatters and linters before each commit
- **Type checking**: TypeScript compiler MUST validate all code with `--noEmit`

**Rationale**: Consistency reduces cognitive load and merge conflicts. Automated enforcement prevents style debates and ensures code maintainability as the project scales.

### IV. Semantic Versioning (NON-NEGOTIABLE)

Version numbering MUST follow MAJOR.MINOR.PATCH:
- **MAJOR**: Breaking API changes, removed exports, incompatible type changes
- **MINOR**: New features, added exports, backward-compatible enhancements
- **PATCH**: Bug fixes, documentation updates, internal refactors

Commit messages MUST follow Conventional Commits (`feat:`, `fix:`, `docs:`, `refactor:`, etc.). Releases MUST use Changesets for changelog automation.

**Rationale**: As a published npm library, consumers rely on semantic versioning to safely upgrade. Breaking changes without major version bumps violate ecosystem trust.

### V. Documentation Discipline

Public APIs MUST have JSDoc comments describing:
- Purpose and behavior
- Parameter types and constraints (even if TypeScript-typed)
- Return types and possible values
- Usage examples for complex functions

README.md MUST remain comprehensive with quick start, API reference, and type utility examples. Private functions do not require JSDoc.

**Rationale**: envyconfig's type utilities (`ToEnv`, `FromEnv`) are complex. Without clear documentation, users will misuse them or avoid them entirely, reducing the library's value.

### VI. Modern TypeScript Patterns

Code MUST use:
- **async/await** over raw Promises
- **Arrow functions** for callbacks
- **Destructuring** for object/array access
- **Template literals** for string building
- **Strict equality** (`===`, `!==`)
- **ES2022+ features** (private fields `#`, `?.`, `??`)

Avoid outdated patterns like `var`, `arguments`, `Function.prototype.bind`.

**Rationale**: Modern syntax improves readability and aligns with ecosystem standards. ES2022+ features reduce boilerplate and prevent bugs.

### VII. Zero-Runtime Dependencies (CRITICAL)

The core library (`config`, `createConfig`) MUST have zero runtime dependencies. Zod MUST remain a peer dependency, only imported when users opt in via `schema` option. Type utilities (`ToEnv`, `FromEnv`) MUST be pure TypeScript types with no runtime cost.

**Rationale**: Minimizing dependencies reduces supply chain risk, bundle size, and installation time. Users who don't need Zod validation shouldn't pay for it.

## Technology Stack Standards

The following technologies are **mandatory** for this project:

| Use Case | Technology | Version Policy |
|----------|-----------|---------------|
| Language | TypeScript | Latest stable (≥5.9) |
| Package Manager | pnpm | ≥9.0.0 |
| Runtime | Node.js | ≥20.0.0 |
| Testing | Vitest | Latest stable |
| Linting | oxlint | Latest stable |
| Formatting | oxfmt | Latest stable |
| Schema Validation | Zod (peer) | ≥4.3.4 |
| Type Utilities | type-fest | Latest stable (dev dep) |
| Changesets | @changesets/cli | Latest stable |

**Constraint**: No additional runtime dependencies may be added without explicit justification and constitution amendment. Dev dependencies must be justified based on measurable improvements.

## Development Workflow

### Workflow Types

Development activities SHALL use the appropriate workflow type based on the nature of the work. Each workflow enforces specific quality gates and documentation requirements tailored to its purpose.

#### Core Workflow (Feature Development)

1. Feature request initiates with `/speckit.specify <description>`
2. Clarification via `/speckit.clarify` to resolve ambiguities
3. Technical planning with `/speckit.plan` to create implementation design
4. Task breakdown using `/speckit.tasks` for execution roadmap
5. Implementation via `/speckit.implement` following task order

#### Extension Workflows

- **Baseline**: `/speckit.baseline` → baseline-spec.md + current-state.md establishing project context
- **Bugfix**: `/speckit.bugfix "<description>"` → bug-report.md + tasks.md with regression test requirement
- **Enhancement**: `/speckit.enhance "<description>"` → enhancement.md (condensed single-doc with spec + plan + tasks)
- **Modification**: `/speckit.modify <feature_num> "<description>"` → modification.md + impact analysis + tasks.md
- **Refactor**: `/speckit.refactor "<description>"` → refactor.md + baseline metrics + incremental tasks.md
- **Hotfix**: `/speckit.hotfix "<incident>"` → hotfix.md + expedited tasks.md + post-mortem.md (within 48 hours)
- **Deprecation**: `/speckit.deprecate <feature_num> "<reason>"` → deprecation.md + dependency scan + phased tasks.md
- **Review**: `/speckit.review <task_id>` → review implementation against spec + update tasks.md + generate report
- **Cleanup**: `/speckit.cleanup` → organize specs/ directory + archive old branches + update documentation

### Workflow Selection

The appropriate workflow MUST be selected based on the nature of the work:

- **Baseline** (`/speckit.baseline`): Use when establishing project context for the first time or after major changes. Requires comprehensive documentation of existing architecture and change tracking.

- **Feature Development** (`/speckit.specify`): Use for new functionality that expands the library's capabilities. Requires full specification, planning, TDD approach, and comprehensive documentation. This is the default for substantial additions.

- **Bug Fixes** (`/speckit.bugfix`): Use for defect remediation. MUST include regression test BEFORE applying fix to ensure bug is reproducible and fix is verifiable.

- **Enhancements** (`/speckit.enhance`): Use for minor improvements to existing features that can be scoped to a single-phase plan with max 7 tasks. Streamlined single-document workflow. If complexity exceeds this scope, use full feature workflow instead.

- **Modifications** (`/speckit.modify`): Use for changes to existing features. Requires impact analysis, backward compatibility assessment, and clear documentation of what's changing and why.

- **Refactoring** (`/speckit.refactor`): Use for code quality improvements without behavior changes. Requires baseline metrics (unless explicitly exempted), behavior preservation guarantee, and incremental validation after every change.

- **Hotfixes** (`/speckit.hotfix`): Use ONLY for emergency production issues requiring immediate resolution. Expedited process with deferred testing (exception to TDD rule) and mandatory post-mortem within 48 hours.

- **Deprecation** (`/speckit.deprecate`): Use for feature sunset. Requires phased rollout (warnings → disabled → removed), migration guide, stakeholder approvals, and dependency scan to identify affected code.

**CRITICAL**: The wrong workflow SHALL NOT be used. Features must not bypass specification, bugs must not skip regression tests, refactorings must not alter behavior, and enhancements requiring complex multi-phase plans must use full feature development workflow.

### Quality Gates by Workflow

Each workflow type has specific mandatory quality gates that MUST be satisfied:

#### Baseline Workflow

- [ ] Comprehensive project analysis performed covering all major components
- [ ] All major components documented in baseline-spec.md with purpose and status
- [ ] Current state enumerates all changes by workflow type (features, bugs, enhancements, etc.)
- [ ] Architecture and technology stack accurately captured and aligned with constitution
- [ ] Existing code patterns documented for future consistency

#### Feature Development Workflow

- [ ] Specification complete with user stories, acceptance criteria, and test scenarios
- [ ] Specification passed constitution checks before planning began
- [ ] Plan includes technical context, phase breakdown, and constitution compliance verification
- [ ] Plan passed constitution checks before task generation
- [ ] Tests written before implementation (TDD - NON-NEGOTIABLE per Principle II)
- [ ] All public APIs have unit tests with comprehensive coverage
- [ ] Code review verifies constitution compliance (type safety, documentation, patterns)
- [ ] Breaking changes documented with migration guide in CHANGELOG

#### Bugfix Workflow

- [ ] Bug reproduction documented with exact steps to reproduce
- [ ] Regression test written BEFORE fix is applied (NON-NEGOTIABLE)
- [ ] Regression test fails without fix, passes with fix
- [ ] Root cause identified and documented in bug report
- [ ] Prevention strategy defined to avoid similar bugs in future
- [ ] Fix does not introduce breaking changes without major version bump

#### Enhancement Workflow

- [ ] Enhancement scoped to single-phase plan with no more than 7 tasks
- [ ] Changes clearly defined in enhancement document (what, why, how)
- [ ] Tests added for new behavior (unit tests for public API changes)
- [ ] Existing tests still pass (no behavior regression)
- [ ] Documentation updated if public API surface changes
- [ ] If complexity exceeds single-phase scope, escalated to full feature workflow

#### Modification Workflow

- [ ] Impact analysis identifies all affected files, functions, and contracts
- [ ] Original feature spec linked for context and comparison
- [ ] Backward compatibility assessed with explicit statement (compatible/breaking)
- [ ] Migration path documented if breaking changes introduced
- [ ] Tests updated to reflect modified behavior
- [ ] Version bump follows semantic versioning (PATCH for compatible, MAJOR for breaking)

#### Refactor Workflow

- [ ] Baseline metrics captured before any changes (unless explicitly exempted with justification)
- [ ] Tests pass after EVERY incremental change (no batch refactoring without validation)
- [ ] Behavior preservation guaranteed (existing tests unchanged and passing)
- [ ] Target metrics show measurable improvement (unless explicitly exempted with justification)
- [ ] Code quality improvements aligned with Principles III and VI (formatting, modern patterns)
- [ ] No functional changes mixed with refactoring (separate PRs if needed)

#### Hotfix Workflow

- [ ] Severity assessed (P0/P1/P2) and documented in hotfix report
- [ ] Rollback plan prepared before deployment with clear rollback steps
- [ ] Fix deployed and verified in production before writing tests (EXCEPTION to TDD)
- [ ] Tests written after fix verification (deferred but still required)
- [ ] Post-mortem completed within 48 hours of resolution (NON-NEGOTIABLE)
- [ ] Post-mortem includes root cause, timeline, prevention measures, and action items

#### Deprecation Workflow

- [ ] Dependency scan run to identify all affected code (grep/semantic search)
- [ ] Migration guide created before Phase 1 with clear upgrade path
- [ ] All three phases complete in sequence without skipping (warnings → disabled → removed)
- [ ] Stakeholder approvals obtained before starting deprecation
- [ ] Deprecation warnings include timeline and migration guide link
- [ ] Version follows semantic versioning (MAJOR for removal of public APIs)

### Version Control

- **Branching**: Gitflow strategy (feature/, bugfix/, hotfix/ branches)
- **Commits**: Conventional Commits format enforced via pre-commit hooks
- **Reviews**: All changes require PR review before merging to main

### CI/CD Pipeline

GitHub Actions MUST run on every PR and push:
1. **Formatting check**: `pnpm format:check`
2. **Linting**: `pnpm lint`
3. **Type checking**: `pnpm type-check`
4. **Testing**: `pnpm test` with coverage report
5. **Build**: `pnpm build` to verify dist output

Releases MUST:
- Publish to npm registry on version tags
- Generate changelogs via Changesets
- Mark pre-release versions (alpha, beta, rc) as pre-releases on GitHub

### Quality Gates

PRs MUST NOT merge if:
- CI pipeline fails
- Code coverage for public APIs drops
- Linter or formatter reports errors
- Type checking fails
- Breaking changes lack migration guide in CHANGELOG

## Governance

This constitution supersedes informal practices and ad-hoc decisions. When conflicts arise between this document and other guidance (e.g., AGENTS.md), the constitution takes precedence.

### Amendment Process

1. Propose change via GitHub Issue with justification
2. Document impact on existing code and templates
3. Require maintainer approval
4. Update constitution version:
   - **MAJOR**: Principle removal or backward-incompatible governance change
   - **MINOR**: New principle or expanded guidance
   - **PATCH**: Clarifications, typo fixes, wording improvements
5. Update `.specify/templates/*` to reflect changes
6. Add Sync Impact Report as HTML comment at top of this file

### Compliance

All PRs MUST verify compliance with relevant principles. Contributors MUST reference constitution principles when requesting design changes. Complexity or principle deviations MUST be justified in writing.

For day-to-day development guidance (coding style, tooling configuration), refer to `AGENTS.md`. This constitution defines **what is non-negotiable**; AGENTS.md provides **how to implement** those requirements.

**Version**: 1.1.0 | **Ratified**: 2026-01-03 | **Last Amended**: 2026-01-03
