---
description: "Documentation site for objectenvy Use when: You need to turn raw `process.env` into a typed, nested config object at...."
name: objectenvy-docs
---

# @objectenvy/docs

Documentation site for objectenvy

## When to Use

**Use this skill when:**
- You need to turn raw `process.env` into a typed, nested config object at application startup. → use `objectify`
- You have a Zod schema and want validated, fully-typed config in a single call. → use `objectify`
- You want to scope config to one namespace using `prefix: 'APP'` and strip the prefix from keys. → use `objectify`
- You use double-underscore env naming (`LOG__LEVEL`) and want `{ log: { level } }` nesting. → use `objectify`
- You have a single canonical app-config module and want to read config exactly once per process lifecycle. → use `objectEnvy`
- You need to inject a different `env` object in tests while keeping the same schema and prefix. → use `objectEnvy`
- You want a named handle that bundles both directions of the round-trip (`objectify` + `envy`). → use `objectEnvy`
- You need to spawn a child process and want to pass typed config as env variables. → use `envy`
- You're writing a `.env` file from a config object (e.g., for CI scaffolding or test fixtures). → use `envy`
- You use `ToEnv<T>` for compile-time validation and need the runtime values to match. → use `envy`
- You're round-tripping: `objectify()` → mutate config → `envy()` → write back to env. → use `envy`
- You want to layer environment config on top of hard-coded application defaults. → use `override`
- You have partial user-supplied configs and need safe fallback values for unset fields. → use `override`
- You're building a plugin or middleware layer that injects sensible defaults without overriding user intent. → use `override`
- You need to combine two configuration objects where neither is the authoritative "defaults" → use `merge` — e.g., merging a base config with a feature-flag overlay.
- You're composing multiple partial config slices loaded from different sources. → use `merge`
- You need array concatenation across config layers (`concat` or `concat-unique`). → use `merge`
- You need to convert a raw environment variable key to a JavaScript property name. → use `toCamelCase`
- You're normalising keys before building a config object. → use `toCamelCase`
- You need to convert a camelCase config key to an env variable name for `envy()`. → use `toSnakeCase`
- You're generating `.env` documentation or scaffolding from TypeScript property names. → use `toSnakeCase`
- You want to apply the same type-coercion rules that `objectify()` uses internally to an individual value. → use `coerceValue`
- You're processing env values outside `objectify()` and need consistent boolean/number parsing. → use `coerceValue`

**Do NOT use when:**
- You need per-variable access with `.required()` / `.asInt()` semantics — use `env-var` instead. (`objectify`)
- You already have a fully validated config object and just want to merge defaults — use `override()`. (`objectify`)
- You need multiple env sources (files + remote secrets) — load them first, then pass as `env:`. (`objectify`)
- You need a fresh re-read on every call (e.g., dynamic secrets) — memoization will return stale data. (`objectEnvy`)
- You use different schemas in different parts of the app — create separate `objectEnvy` instances instead. (`objectEnvy`)
- You only need the `ToEnv<T>` type at compile time — no need to call `envy()` at runtime. (`envy`)
- The config contains `Date`, `Map`, `Set`, or class instances — `envy()` serializes them as `[object Object]` via `String()`. (`envy`)
- You need a symmetric deep merge where neither object has priority — use `merge()` instead. (`override`)
- You need to merge more than two objects at once — chain multiple `override()` calls. (`override`)
- You want one object to be authoritative "defaults" and the other to win — use `override()` instead. (`merge`)
- You need to merge more than two objects — chain `merge(merge(a, b), c)` calls. (`merge`)
- Input may contain non-ASCII letters — the regex captures only `[a-z]` after the underscore. (`toCamelCase`)
- You need `PascalCase` output — capitalise the first character of the result separately. (`toCamelCase`)
- You need a strictly reversible transform — `toCamelCase(toSnakeCase('apiURL'))` yields `'apiUrl'`, not `'apiURL'`. (`toSnakeCase`)
- The value must stay a string regardless of content (e.g., `'123'` must stay `'123'`) — pass `coerce: false` to `objectify()` instead, or handle the type downstream. (`coerceValue`)
- You need locale-aware number parsing — `parseFloat`/`parseInt` are locale-independent but only handle decimal notation; scientific notation (`'1e5'`) is NOT coerced to a number. (`coerceValue`)

API surface: 9 functions, 8 types, 1 constants

## Configuration

2 configuration interfaces — see references/config.md for details.

## Quick Reference

**Parsing:** `objectify` (Parse `process), `safeObjectify` (Non-throwing variant of objectify), `objectEnvy` (Create a memoized configuration loader with preset options, returning bound `objectify` and `envy` helpers), `toCamelCase` (Convert a `SCREAMING_SNAKE_CASE` string to `camelCase`), `coerceValue` (Coerce a raw environment variable string to its most appropriate JavaScript type), `defaultNonNestingPrefixes` (Prefix segments that are never treated as nesting roots regardless of how many env vars share them)
**Serialization:** `envy` (Serialize a nested camelCased config object back to a flat `SCREAMING_SNAKE_CASE` env record), `toSnakeCase` (Convert a `camelCase` or `PascalCase` string to `SCREAMING_SNAKE_CASE`)
**Merging:** `override` (Apply default values to a config object, filling in only the keys that are absent in `config`), `merge` (Recursively merge two configuration objects, with `obj2` winning on conflicts)
**Type Utilities:** `ConfigObject` (Nested configuration object with string keys and recursively nested values), `ConfigValue` (A single configuration value — either a primitive string/number/boolean,
an array of primitives/objects, or a nested `ConfigObject`), `ArrayMergeStrategy` (Strategy for merging arrays when combining configuration objects via `merge()` or `override()`), `ToEnv` (Convert a nested camelCase config type to a flat `SCREAMING_SNAKE_CASE` env record, preserving
string literal and template literal types), `FromEnv` (Convert a flat `SCREAMING_SNAKE_CASE` env record type to a nested camelCase config type), `WithPrefix` (Add a `Prefix_` to all keys in an env record type), `WithoutPrefix` (Remove a `Prefix_` from all keys in an env record type, keeping only the matching keys), `SchemaToEnv` (Extract the flat `SCREAMING_SNAKE_CASE` env record type from a Zod schema or a plain config type)

## References

Load these on demand — do NOT read all at once:

- When calling any function → browse `references/functions/` for grouped indexes, full signatures, parameters, and return types
- When defining typed variables or function parameters → read `references/types.md`
- When using exported constants → read `references/variables.md`
- When configuring options → read `references/config.md` for all settings and defaults

## Links

- Author: Pradeep Mouli <pmouli@mac.com> (https://github.com/pradeepmouli)