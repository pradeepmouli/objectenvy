# objectenvy

## 1.4.1

### Patch Changes

- [#111](https://github.com/pradeepmouli/objectenvy/pull/111) [`0a6d365`](https://github.com/pradeepmouli/objectenvy/commit/0a6d3651162128ad788c324a694f81e95f3827d3) Thanks [@pradeepmouli](https://github.com/pradeepmouli)! - - chore: also drop .github/agents, prompts, skills, copilot from master
  - chore: drop AI tooling files from master

## 1.4.0

### Minor Changes

- [#88](https://github.com/pradeepmouli/objectenvy/pull/88) [`43e8780`](https://github.com/pradeepmouli/objectenvy/commit/43e87806f15df7cad0d11a1adaa8ce435edff421) Thanks [@pradeepmouli](https://github.com/pradeepmouli)! - - feat: `transform` option — post-parse hook; overloads now infer the widened return type (`TOut`) when transform adds fields not in the schema
  - feat: `defaults` factory — context-aware fallback env values; empty strings (when `coerce: true`) now correctly fall through to defaults
  - feat: `safeObjectify` — non-throwing variant returning a discriminated union; supports `TOut` widening overload
  - feat: `defaultNonNestingPrefixes` — exported constant for the built-in prefix blocklist
  - fix: empty strings treated as absent before the defaults merge when `coerce: true`
  - fix: `objectEnvy` factory no longer caches results when `transform` or `defaults` are present (per-call function overrides previously collided)
  - fix: vscode extension tsconfig updated to `module: node16` + `moduleResolution: node16` with `"type": "module"` (was invalid `module: commonjs` + `moduleResolution: bundler`)
  - refactor: removed dead `parseEnvKeyToPath` export from utils

### Patch Changes

- [#60](https://github.com/pradeepmouli/objectenvy/pull/60) [`df6068f`](https://github.com/pradeepmouli/objectenvy/commit/df6068fb13ce251dc63ddc8ce5365305685239e5) Thanks [@pradeepmouli](https://github.com/pradeepmouli)! - - revert: restore aspirational CLI types for external library use
  - style: apply oxfmt formatting to changed files
  - refactor: simplify code by removing duplicates and dead code

## 1.3.1

### Patch Changes

- [#57](https://github.com/pradeepmouli/objectenvy/pull/57) [`d7a0cbc`](https://github.com/pradeepmouli/objectenvy/commit/d7a0cbccde5557f2bf0272ca507e3c63d7072106) Thanks [@pradeepmouli](https://github.com/pradeepmouli)! - - test: validate full CI/CD automation pipeline

## 1.3.0

### Minor Changes

- cleanup

## 1.2.0

### Minor Changes

- Added field filtering support with `include` and `exclude` options
- Filters work with prefix and are case-insensitive
- Renamed `apply` to `override` with swapped parameter order (defaults first, config second)

## 1.1.0

### Minor Changes

- array merging support
