# Configuration

## ObjectEnvyOptions

Configuration options for `objectify()` — controls prefix filtering,
env source, Zod schema validation, camelCase nesting behaviour, and include/exclude patterns.

Pass an `ObjectEnvyOptions` object to `objectify()` to customise how environment variables are
parsed. All fields are optional; the defaults represent the most common use case (read
`process.env`, coerce values, use single-underscore nesting).

When `schema` is provided, heuristic nesting is disabled — the schema structure governs nesting
exactly. Zod schemas additionally validate the output and throw `ZodError` on failure.

### Properties

#### prefix

Filter environment variables by prefix.
e.g., "APP" will only include variables starting with "APP_"

**Type:** `string`

#### env

Custom environment object. Defaults to process.env

**Type:** `EnvLike`

#### schema

Schema for validation and type inference.
Can be either a Zod schema or a plain object with the same structure as your config.
Zod schemas will validate, plain objects provide type inference only.

**Type:** `T extends ConfigObject ? ZodObject<any, $strip> | T : never`

#### coerce

Whether to automatically coerce values to numbers/booleans

**Type:** `boolean`

#### delimiter

Delimiter used to indicate nesting depth.
By default, each underscore creates a new nesting level.
Set to '__' to use double underscores for nesting.

**Type:** `string`

#### nonNestingPrefixes

Prefix segments that should not trigger nesting even when multiple entries share the prefix.
For example, keys starting with 'max', 'min', 'is', 'enable', 'disable' will stay flat:
MAX_CONNECTIONS, MAX_TIMEOUT -> { maxConnections, maxTimeout }
IS_DEBUG, IS_VERBOSE -> { isDebug, isVerbose }

Defaults to `defaultNonNestingPrefixes`. Extend it without repeating the defaults:
`nonNestingPrefixes: [...defaultNonNestingPrefixes, 'lsp', 'ws']`

**Type:** `string[]`

#### include

Include only environment variables matching these patterns.
Matches against the normalized key (after prefix removal, in camelCase).
If specified, only variables matching at least one pattern will be included.

**Type:** `string[]`

#### exclude

Exclude environment variables matching these patterns.
Matches against the normalized key (after prefix removal, in camelCase).
Variables matching any pattern will be excluded.

**Type:** `string[]`

#### transform

Post-parse transform applied after the config has been built and validated.
Receives the fully coerced, validated config object and may return a wider type — use
dedicated `objectify` overloads to capture the return type when adding derived fields.

**Type:** `(parsed: T) => T`

#### defaults

Factory for context-aware defaults. Receives the raw env object (before coercion or prefix
stripping) and returns raw env-style key-value pairs that fill in missing or undefined keys.
Actual env values always take precedence over factory defaults.

**Type:** `(raw: EnvLike) => Partial<Record<string, string | undefined>>`

## MergeOptions

Options for controlling the merge behaviour of `merge()` and `override()`.

### Properties

#### arrayMergeStrategy

Strategy to apply when both objects contain an array at the same key.

- `'replace'` — the second (higher-priority) array replaces the first entirely.
- `'concat'` — arrays are concatenated, second array appended after the first.
- `'concat-unique'` — concatenated with duplicate primitive values removed.

**Type:** `ArrayMergeStrategy`