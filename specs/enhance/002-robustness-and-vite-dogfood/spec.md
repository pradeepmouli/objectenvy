# Enhancement: Robustness & Vite Dogfood

**Enhancement ID**: enhance-002
**Branch**: `enhance/002-robustness-and-vite-dogfood`
**Created**: 2026-05-01
**Priority**: [x] High | [ ] Medium | [ ] Low
**Status**: [ ] Planned | [ ] In Progress | [ ] Complete

## Motivation

Attempting to migrate `rune-langium/apps/studio/src/config.ts` to use `objectify()` surfaces four
gaps in the current API. The Studio config is representative of real-world Vite app configs:
`VITE_*` prefixed vars, boolean feature flags with `true`/`false` string values, URL vars with
derived defaults (one computed from another), and mode-aware defaults (`development` vs `production`).

objectenvy already handles two things well here:
- **`env` source**: `EnvLike = Record<string, string | undefined>` matches `import.meta.env`
  exactly — pass `env: import.meta.env` and it works today with no adapter needed.
- **Delimiter**: The `delimiter` option already controls nesting split character (e.g., `'__'` for
  double-underscore nesting). No changes needed here.

The migration is **not clean** with the current API because objectenvy has no way to express:

1. Derived/computed values that depend on other resolved values
2. Mode-aware defaults (different default based on `env.MODE`)
3. Empty string treated as absent (Vite sometimes provides `VITE_FOO=` meaning "not set")
4. A non-throwing code path for browser initialization (currently only `parse`, never `safeParse`)

Fixing these makes objectenvy genuinely useful for Vite apps and removes the need for hand-rolled
helpers like `boolFromEnv(value, fallback)`.

---

## Enhancement 1 — `transform` post-parse callback

**Gap**: Fields derived from other resolved fields cannot be expressed.

**Example** (Studio):
```typescript
// Today — manual derivation after Zod parse
const lspWsUrl = env.VITE_LSP_WS_URL ?? (isProd ? PROD_WS_URL : DEV_WS_URL);
const lspSessionUrl = env.VITE_LSP_SESSION_URL ?? deriveSessionUrl(lspWsUrl);
```

**Proposed API**:
```typescript
const config = objectify({
  env: import.meta.env,
  prefix: 'VITE',
  schema: RawSchema,
  transform: (parsed) => ({
    ...parsed,
    lspSessionUrl: parsed.lspSessionUrl ?? deriveSessionUrl(parsed.lspWsUrl)
  })
});
```

`transform` runs after Zod validation passes. It receives the typed, validated object and returns
an extended/modified version. The return type of `objectify()` becomes the return type of
`transform`.

**Type signature**:
```typescript
interface ObjectEnvyOptions<T, R = T> {
  transform?: (parsed: T) => R;
}
// objectify({ schema, transform }) returns R
```

**Constraints**:
- `transform` runs after schema validation — it sees fully coerced, validated values
- Returning a new key that is not in the schema is allowed (useful for derived fields)
- Throwing inside `transform` propagates; `safeObjectify` catches it

---

## Enhancement 2 — Context-aware defaults (mode-based)

**Gap**: Default values need to vary by `env.MODE` (or any other env var).

**Example** (Studio):
```typescript
// Today
const lspWsDefault = isProd ? 'wss://prod.example.com/lsp' : 'ws://localhost:3001';
```

**Proposed API** — factory default via Zod `.default()` is not possible (Zod takes static values).
The clean solution is a `defaults` factory option:

```typescript
const config = objectify({
  env: import.meta.env,
  prefix: 'VITE',
  schema: RawSchema,
  defaults: (env) => ({
    lspWsUrl: env.MODE === 'production' ? 'wss://prod.example.com/lsp' : 'ws://localhost:3001',
    telemetryEndpoint: `${window?.location.origin ?? 'http://localhost:5173'}/api/telemetry/v1/event`
  })
});
```

`defaults` is a function that receives the raw `EnvLike` (before coercion/nesting) and returns a
partial defaults object. These defaults are applied **before** Zod parse — they fill in missing
`VITE_*` keys so that Zod `.default()` values remain a static fallback for non-Vite contexts.

**Merge order** (lower index = lower priority):
1. Zod schema `.default()` values
2. `defaults` factory return (overwrites Zod defaults for keys it provides)
3. Actual env values (always wins)

**Type signature**:
```typescript
interface ObjectEnvyOptions<T> {
  defaults?: (raw: EnvLike) => Partial<Record<string, string | undefined>>;
}
```

---

## Enhancement 3 — Empty string treated as absent

**Gap**: Vite sometimes surfaces `VITE_ENABLE_LSP=` (empty string) meaning "not set". Currently
objectenvy passes empty strings through, causing coercion to `''` or Zod validation errors on
required fields.

**Proposed behavior**: When `coerce: true` (default), treat `''` as `undefined` — allowing Zod
`.default()` or `defaults` factory to fill in the value.

**Existing workaround (Studio)**:
```typescript
function boolFromEnv(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined || value === '') return fallback;
  return value === 'true' || value === '1';
}
```

**After this change**: `boolFromEnv` disappears entirely from consumer code.

**Scope**: Only applies to empty string (`''`). Whitespace-only strings (`'  '`) are trimmed
and then treated the same way. Single space is edge-case — document as "treated as absent".

**Breaking change**: Technically yes for callers who store meaningful empty strings in env vars,
but this is vanishingly rare and matches every other env library's behavior. Gate behind existing
`coerce` flag (empty string → absent only when `coerce: true`).

---

## Enhancement 4 — `safeObjectify` (non-throwing variant)

**Gap**: In browser code, crashing at module-init on a bad env var is intentional (the Studio does
this deliberately), but not always desirable. Integrators that want to surface errors to users
gracefully need a non-throwing path.

**Proposed API**:
```typescript
export function safeObjectify<T>(
  options: ObjectEnvyOptions<T>
): { success: true; data: T } | { success: false; error: Error }
```

Mirrors Zod's `safeParse`. Catches all thrown errors including `ZodError` and errors from
`transform`. On `ZodError`, preserves the structured `issues` array on `error.cause`.

**Usage**:
```typescript
const result = safeObjectify({ env: import.meta.env, prefix: 'VITE', schema: ConfigSchema });
if (!result.success) {
  console.error('Config invalid:', result.error.message);
  // surface to user, fall back to safe defaults, etc.
}
const config = result.data;
```

---

## Enhancement 5 — `nonNestingPrefixes` default expansion

**Minor robustness fix**: The current default `nonNestingPrefixes` list is `['max', 'min', 'is',
'enable', 'disable']`. Real-world env files commonly use additional non-nesting tokens:

```
VITE_ENABLE_LSP=true        → config.enableLsp   ✓ (already in list)
VITE_LEGACY_GIT_PATH=false  → config.legacyGitPath  ✓ (no nesting)
VITE_DEV_MODE=true          → config.devMode      ✓
VITE_LSP_WS_URL=...         → config.lsp.wsUrl    ✗ (should be config.lspWsUrl)
```

`lsp`, `ws`, `http`, `https` shouldn't nest. Proposed additions to the default list:
`'has', 'use', 'show', 'hide', 'allow', 'deny', 'skip', 'force'`

Keep `lsp`, `ws`, `http`, `https` out of defaults (too project-specific) — document how users add
them via `nonNestingPrefixes: [...defaultNonNestingPrefixes, 'lsp', 'ws']`.

Export `defaultNonNestingPrefixes` as a named export so users can extend without duplicating.

---

## Dogfood Result

With these five changes, the Studio `config.ts` becomes:

```typescript
import { objectify } from 'objectenvy';
import { z } from 'zod';

const wsUrl = z.string().url()
  .refine(u => u.startsWith('ws://') || u.startsWith('wss://'));
const httpUrl = z.string().url()
  .refine(u => u.startsWith('http://') || u.startsWith('https://'));

const ConfigSchema = z.object({
  lspWsUrl: wsUrl,
  lspSessionUrl: httpUrl.optional(),
  telemetryEndpoint: httpUrl.optional(),
  enableLsp: z.boolean(),
  enableTelemetry: z.boolean(),
  enableGithubAuth: z.boolean(),
  enableCuratedMirror: z.boolean(),
  devMode: z.boolean().optional(),
  legacyGitPath: z.boolean(),
}).strict();

const isProd = import.meta.env.MODE === 'production';

export const config = objectify({
  env: import.meta.env,
  prefix: 'VITE',
  schema: ConfigSchema,
  nonNestingPrefixes: [...defaultNonNestingPrefixes, 'lsp'],
  defaults: (env) => ({
    VITE_LSP_WS_URL: isProd ? 'wss://www.daikonic.dev/rune-studio/api/lsp' : 'ws://localhost:3001',
    VITE_TELEMETRY_ENDPOINT: `${window?.location.origin ?? 'http://localhost:5173'}/api/telemetry/v1/event`
  }),
  transform: (parsed) => ({
    ...parsed,
    lspSessionUrl: parsed.lspSessionUrl ?? deriveSessionUrl(parsed.lspWsUrl),
    devMode: parsed.devMode ?? (env.MODE === 'development')
  })
});

export type StudioRuntimeConfig = typeof config;
```

~80 lines → ~35 lines. The `boolFromEnv` helper, `boolFromEnv` call sites, and all manual
`env.VITE_*` extractions go away. The schema drives everything.

---

## Out of Scope for This Enhancement

- Vite plugin (separate enhancement — generates TypeScript `.d.ts` for `import.meta.env` from the
  objectenvy schema)
- JSON array parsing (e.g., `'["a","b"]'`) — separate enhancement
- Per-field delimiter overrides (global `delimiter` option already exists and covers all real-world cases)
- `ToEnv` / `FromEnv` test helpers — separate enhancement (also useful for rune-langium)

---

## Acceptance Criteria

- [ ] `transform` option accepted by `objectify`; return type flows through correctly
- [ ] `defaults` factory called with raw env before coercion; merges as specified
- [ ] Empty string treated as absent when `coerce: true`
- [ ] `safeObjectify` exported from `objectenvy`; catches `ZodError` and `transform` errors
- [ ] `defaultNonNestingPrefixes` exported as named const
- [ ] Studio dogfood migration compiles and all existing config tests pass
- [ ] No breaking changes to existing `objectify` call sites
