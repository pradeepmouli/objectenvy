---
name: objectenvy-docs
description: Documentation site for objectenvy
---

# @objectenvy/docs

Documentation site for objectenvy

## When to Use

- You need to turn raw `process.env` into a typed, nested config object at application startup.
- You have a Zod schema and want validated, fully-typed config in a single call.
- You want to scope config to one namespace using `prefix: 'APP'` and strip the prefix from keys.
- You use double-underscore env naming (`LOG__LEVEL`) and want `{ log: { level } }` nesting.
- You have a single canonical app-config module and want to read config exactly once per process lifecycle.
- You need to inject a different `env` object in tests while keeping the same schema and prefix.
- You want a named handle that bundles both directions of the round-trip (`objectify` + `envy`).
- You need to spawn a child process and want to pass typed config as env variables.
- You're writing a `.env` file from a config object (e.g., for CI scaffolding or test fixtures).
- You use `ToEnv<T>` for compile-time validation and need the runtime values to match.
- You're round-tripping: `objectify()` → mutate config → `envy()` → write back to env.
- You want to layer environment config on top of hard-coded application defaults.
- You have partial user-supplied configs and need safe fallback values for unset fields.
- You're building a plugin or middleware layer that injects sensible defaults without overriding user intent.
- You need to combine two configuration objects where neither is the authoritative "defaults" — e.g.,
- merging a base config with a feature-flag overlay.
- You're composing multiple partial config slices loaded from different sources.
- You need array concatenation across config layers (`concat` or `concat-unique`).
- You need to convert a raw environment variable key to a JavaScript property name.
- You're normalising keys before building a config object.
- You need to convert a camelCase config key to an env variable name for `envy()`.
- You're generating `.env` documentation or scaffolding from TypeScript property names.
- You want to apply the same type-coercion rules that `objectify()` uses internally to an individual value.
- You're processing env values outside `objectify()` and need consistent boolean/number parsing.

**Avoid when:**
- You need per-variable access with `.required()` / `.asInt()` semantics — use `env-var` instead.
- You already have a fully validated config object and just want to merge defaults — use `override()`.
- You need multiple env sources (files + remote secrets) — load them first, then pass as `env:`.
- You need a fresh re-read on every call (e.g., dynamic secrets) — memoization will return stale data.
- You use different schemas in different parts of the app — create separate `objectEnvy` instances instead.
- You only need the `ToEnv<T>` type at compile time — no need to call `envy()` at runtime.
- The config contains `Date`, `Map`, `Set`, or class instances — `envy()` serializes them as
- `[object Object]` via `String()`.
- You need a symmetric deep merge where neither object has priority — use `merge()` instead.
- You need to merge more than two objects at once — chain multiple `override()` calls.
- You want one object to be authoritative "defaults" and the other to win — use `override()` instead.
- You need to merge more than two objects — chain `merge(merge(a, b), c)` calls.
- Input may contain non-ASCII letters — the regex captures only `[a-z]` after the underscore.
- You need `PascalCase` output — capitalise the first character of the result separately.
- You need a strictly reversible transform — `toCamelCase(toSnakeCase('apiURL'))` yields `'apiUrl'`,
- not `'apiURL'`.
- The value must stay a string regardless of content (e.g., `'123'` must stay `'123'`) — pass
- `coerce: false` to `objectify()` instead, or handle the type downstream.
- You need locale-aware number parsing — `parseFloat`/`parseInt` are locale-independent but only
- handle decimal notation; scientific notation (`'1e5'`) is NOT coerced to a number.
- API surface: 8 functions, 8 types

## Pitfalls

- NEVER rely on heuristic nesting for shared prefixes in production — BECAUSE adding a second
- `PORT_*` variable later silently restructures `{ portNumber }` into `{ port: { number } }`,
- breaking all downstream key accesses without a type error at the call site. Prefer a Zod schema.
- NEVER pass a non-`SCREAMING_SNAKE_CASE` env object when relying on `FromEnv` types — BECAUSE
- the type utility assumes keys are uppercase snake_case; mixed-case keys produce incorrect types.
- NEVER use `coerce: true` (the default) if a value looks like a number but must stay a string —
- BECAUSE `'01'` becomes `1` (integer parse), losing the leading zero.
- NEVER pass a mutable reference to the cached env when using `objectEnvy()` — BECAUSE the
- WeakMap cache key is the object reference; mutating `process.env` after caching returns stale data.
- NEVER mutate `process.env` after calling the inner `objectify()` expecting the result to update —
- BECAUSE results are cached by WeakMap keyed on the env object reference; the cached value is returned.
- NEVER share one `objectEnvy` instance across packages that need independent schemas — BECAUSE the
- schema is baked into the instance at creation time and cannot be changed per call.
- NEVER rely on `envy()` to round-trip arrays of objects faithfully — BECAUSE object items are
- `JSON.stringify`-ed then joined; when `objectify()` re-reads the comma-separated string, it
- treats it as a string array, not an array of objects.
- NEVER pass `null` or `undefined` values in the config — BECAUSE `envy()` silently skips
- `null`/`undefined` entries, leaving no env key for them; the round-trip loses those fields.
- NEVER expect `envy()` to honour a prefix — BECAUSE it outputs bare `SCREAMING_SNAKE_CASE` keys
- with no prefix. Add the prefix yourself if your deployment expects `APP_PORT` rather than `PORT`.
- NEVER mutate the `defaults` or `config` arguments after calling `override()` — BECAUSE the
- returned object is a shallow copy at each level; nested sub-objects are NOT deep-cloned, so
- mutations to deeply nested objects propagate back through the shared reference.
- NEVER rely on `override()` to handle class instances or special objects (Date, Map, Set) — BECAUSE
- the function checks `typeof === 'object'` and recurses, which may produce unexpected results for
- non-plain-object values.
- NEVER rely on `merge()` to deep-clone the inputs — BECAUSE nested sub-objects are shallow-copied
- at each level, so mutations to deeply nested objects in the result affect the originals.
- NEVER use `'concat-unique'` to deduplicate object items if equality matters beyond JSON serialisation —
- BECAUSE the implementation uses `JSON.stringify` for comparison, which is order-sensitive and ignores
- `undefined` values, `Date` objects, and prototype methods.
- NEVER assume `merge()` handles non-plain objects (Map, Set, Date, class instances) correctly —
- BECAUSE the function checks `typeof === 'object'` and recurses, producing incorrect results for
- these types.
- NEVER assume `toCamelCase(toSnakeCase(x)) === x` for all inputs — BECAUSE acronym boundaries
- (e.g., `apiURL` → `API_URL` → `apiUrl`) collapse consecutive capitals, so the round-trip is
- lossy for strings with adjacent uppercase letters.
- NEVER assume acronym round-trips are lossless — BECAUSE `getHTTPSUrl` → `GET_HTTPS_URL` →
- `getHttpsUrl`, losing the original casing of consecutive uppercase letters.
- NEVER feed already-snake-cased input — BECAUSE `PORT_NUMBER` → `PORT__NUMBER` (double underscore)
- due to the camelCase split regex firing on the `_N` boundary.
- NEVER use `coerceValue` on values that use commas as decimal separators (e.g., `'3,14'` in
- some locales) — BECAUSE the function will treat this as an array `[3, 14]` rather than the
- float `3.14`.
- NEVER pass leading-zero strings you want preserved as strings (e.g., zip codes `'01234'`) —
- BECAUSE the integer regex matches and `parseInt('01234', 10)` returns `1234`.
- NEVER rely on `'on'`/`'off'` being coerced to booleans — BECAUSE only `true/false/yes/no/y/n`
- are in the boolean equivalents set; `'on'` stays as the string `'on'`.

## Configuration

### ObjectEnvyOptions

Configuration options for `objectify()` — controls prefix filtering,
env source, Zod schema validation, camelCase nesting behaviour, and include/exclude patterns.

| Key | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `prefix` | `string` | no | — | Filter environment variables by prefix.
e.g., "APP" will only include variables starting with "APP_" |
| `env` | `EnvLike` | no | — | Custom environment object. Defaults to process.env |
| `schema` | `T extends ConfigObject ? ZodObject<any, $strip> | T : never` | no | — | Schema for validation and type inference.
Can be either a Zod schema or a plain object with the same structure as your config.
Zod schemas will validate, plain objects provide type inference only. |
| `coerce` | `boolean` | no | — | Whether to automatically coerce values to numbers/booleans |
| `delimiter` | `string` | no | — | Delimiter used to indicate nesting depth.
By default, each underscore creates a new nesting level.
Set to '__' to use double underscores for nesting. |
| `nonNestingPrefixes` | `string[]` | no | — | Prefix segments that should not trigger nesting even when multiple entries share the prefix.
For example, keys starting with 'max', 'min', 'is', 'enable', 'disable' will stay flat:
MAX_CONNECTIONS, MAX_TIMEOUT -> { maxConnections, maxTimeout }
IS_DEBUG, IS_VERBOSE -> { isDebug, isVerbose } |
| `include` | `string[]` | no | — | Include only environment variables matching these patterns.
Matches against the normalized key (after prefix removal, in camelCase).
If specified, only variables matching at least one pattern will be included. |
| `exclude` | `string[]` | no | — | Exclude environment variables matching these patterns.
Matches against the normalized key (after prefix removal, in camelCase).
Variables matching any pattern will be excluded. |

### MergeOptions

Options for controlling the merge behaviour of `merge()` and `override()`.

| Key | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `arrayMergeStrategy` | `ArrayMergeStrategy` | no | — | Strategy to apply when both objects contain an array at the same key.

- `'replace'` — the second (higher-priority) array replaces the first entirely.
- `'concat'` — arrays are concatenated, second array appended after the first.
- `'concat-unique'` — concatenated with duplicate primitive values removed. |

## Quick Reference

**Parsing:** `objectify`, `objectEnvy`, `toCamelCase`, `coerceValue`
**Serialization:** `envy`, `toSnakeCase`
**Merging:** `override`, `merge`
**Type Utilities:** `ConfigObject`, `ConfigValue`, `ArrayMergeStrategy`, `ToEnv`, `FromEnv`, `WithPrefix`, `WithoutPrefix`, `SchemaToEnv`

## Links

- Author: Pradeep Mouli <pmouli@mac.com> (https://github.com/pradeepmouli)