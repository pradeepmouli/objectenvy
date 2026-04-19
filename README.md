# objectenvy

> Map `process.env` into a strongly-typed, nested, camelCased config object — with optional Zod validation, schema-guided structure, and a type-level round-trip so your `.env` files stay in sync with your code.

> **⚠️ Pre-1.0 software** — APIs are subject to change between minor versions. Pin to exact versions in production. See the [CHANGELOG](./CHANGELOG.md) for breaking changes between releases.

<p align="center">
  <a href="https://www.npmjs.com/package/objectenvy"><img src="https://img.shields.io/npm/v/objectenvy?style=flat-square&label=objectenvy" alt="npm version" /></a>
  <a href="https://github.com/pradeepmouli/objectenvy/actions/workflows/ci.yml"><img src="https://img.shields.io/github/actions/workflow/status/pradeepmouli/objectenvy/ci.yml?style=flat-square" alt="ci" /></a>
  <img src="https://img.shields.io/badge/license-MIT-blue?style=flat-square" alt="license" />
  <img src="https://img.shields.io/badge/node-%3E%3D20-brightgreen?style=flat-square" alt="node" />
</p>

📚 **Documentation:** <https://pradeepmouli.github.io/objectenvy/>

## Overview

Every Node service eventually grows an "environment to config" shim: read a dozen `SCREAMING_SNAKE_CASE` variables out of `process.env`, coerce them to the right type, group them into nested objects, validate them, and expose a typed `config` object to the rest of the app. `objectenvy` replaces that shim with a single call.

Given `process.env`, `objectify(...)` produces a nested, camelCased object: `DATABASE_HOST` and `DATABASE_PORT` become `{ database: { host, port } }`, `LOG_LEVEL` and `LOG_PATH` become `{ log: { level, path } }`, and single entries like `PORT_NUMBER` stay flat as `{ portNumber }`. Strings are coerced to numbers and booleans automatically. Prefix filtering lets you scope the result to `APP_*` variables. Pass a Zod schema and the output shape follows the schema exactly — so you can design the config type first and let `objectenvy` deliver a validated, fully-typed instance without hand-writing any glue.

The type utilities (`ToEnv`, `FromEnv`, `WithPrefix`, `SchemaToEnv`) let you go the other way too: derive the `SCREAMING_SNAKE_CASE` env shape from your config type (with template-literal and union types preserved) and use it to statically check `.env.example` generators, deployment manifests, or config documentation.

## Features

- **Automatic nesting** — shared prefixes become nested objects (`LOG_LEVEL` + `LOG_PATH` → `{ log: { level, path } }`); single-entry prefixes stay flat.
- **Smart-nesting guardrails** — keys starting with `max`, `min`, `is`, `enable`, `disable` stay flat even when they share a prefix (`MAX_CONNECTIONS` + `MAX_TIMEOUT` → `{ maxConnections, maxTimeout }`, not `{ max: { ... } }`). The list is configurable.
- **Schema-guided structure** — with a Zod schema, the output shape follows the schema exactly; nesting is never a surprise.
- **Type coercion** — strings that look like numbers or booleans are converted automatically; disable with `coerce: false`.
- **Prefix filtering** — scope a call to `APP_*` (or any prefix) and get results without the prefix in the output.
- **Configurable delimiter** — default single underscore; switch to `'__'` for double-underscore nesting.
- **Zod validation** — optional, opt-in; pulled in only when you use it, so the core runtime stays dependency-light.
- **Type utilities** — `ToEnv<T>`, `FromEnv<T>`, `WithPrefix<T>`, `WithoutPrefix<T>`, `SchemaToEnv<T>` for compile-time round-trips between config types and env records, with template-literal and union types preserved.
- **`override()` / `merge()` helpers** — layer defaults under environment config without losing type information.
- **Companion CLI and VS Code extension** — scaffold `.env` files, generate typed accessors, and lint env usage directly from your editor.

## Install

```bash
pnpm add objectenvy
# or
npm install objectenvy
```

Requires **Node.js ≥ 20**. Zod is an optional peer dependency — install it only if you plan to use schema validation:

```bash
pnpm add zod
```

## Quick Start

```typescript
import { objectify } from 'objectenvy';

// Given these environment variables:
// PORT_NUMBER=3000
// LOG_LEVEL=debug
// LOG_PATH=/var/log
// DATABASE_HOST=localhost
// DATABASE_PORT=5432

const config = objectify({ env: process.env });

// {
//   portNumber: 3000,        // flat — only one PORT_* entry
//   log: { level: 'debug', path: '/var/log' },
//   database: { host: 'localhost', port: 5432 }
// }
```

## Usage

### Prefix filtering

```typescript
// APP_PORT=3000, APP_DEBUG=true, OTHER_VAR=ignored
const result = objectify({ env: process.env, prefix: 'APP' });
// { port: 3000, debug: true }
```

### Schema-guided nesting with Zod

When a schema is provided, structure follows the schema exactly — nesting is no longer heuristic:

```typescript
import { buildConfigWithSchema } from 'objectenvy';
import { z } from 'zod';

const schema = z.object({
  portNumber: z.number(),
  log: z.object({
    level: z.enum(['debug', 'info', 'warn', 'error']),
    path: z.string()
  }),
  database: z.object({
    host: z.string(),
    port: z.number(),
    ssl: z.boolean().default(false)
  })
});

// PORT_NUMBER=3000, LOG_LEVEL=debug, LOG_PATH=/var/log, DATABASE_HOST=localhost, DATABASE_PORT=5432
const result = buildConfigWithSchema({ env: process.env, schema, prefix: 'APP' });

// Result matches the schema exactly, and result.log.level is the literal union type.
```

### Merging defaults

```typescript
import { objectify, override } from 'objectenvy';

const defaults = { port: 3000, debug: false };
const envConfig = objectify({ env: process.env, prefix: 'APP' });

const config = override(defaults, envConfig);
```

### Custom delimiter

```typescript
// LOG__LEVEL=debug, LOG__FILE_PATH=/var/log
const result = objectify({ env: process.env, delimiter: '__' });
// { log: { level: 'debug', filePath: '/var/log' } }
```

### Non-nesting prefixes

Common qualifier segments stay flat by default: `max`, `min`, `is`, `enable`, `disable`. Customize with `nonNestingPrefixes`:

```typescript
// MAX_CONNECTIONS=100, MAX_TIMEOUT=30, IS_DEBUG=true, ENABLE_FEATURE_X=true
const result = objectify({ env: process.env });
// { maxConnections: 100, maxTimeout: 30, isDebug: true, enableFeatureX: true }

const custom = objectify({ env: process.env, nonNestingPrefixes: ['flag', 'has'] });
```

### Disable coercion

```typescript
const result = objectify({ env: process.env, coerce: false });
// All values remain strings
```

## API Reference

### `objectify(options)`

Parse environment variables into a nested config object.

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `env` | `NodeJS.ProcessEnv` | `process.env` | Custom environment object |
| `prefix` | `string` | — | Only include vars starting with this prefix (stripped from keys) |
| `schema` | `z.ZodType` | — | Zod schema for validation, type inference, and structure guidance |
| `coerce` | `boolean` | `true` | Auto-convert strings to numbers/booleans |
| `delimiter` | `string` | `'_'` | Delimiter for nesting |
| `nonNestingPrefixes` | `string[]` | `['max','min','is','enable','disable']` | First segments that should never trigger nesting in smart mode. Ignored when `schema` is provided. |

### `override(defaults, config)` / `merge(a, b)`

Merge config objects. `override` lets the second argument win; `merge` performs a deep merge.

```typescript
const defaults = { port: 3000, debug: false };
const config = { debug: true };
override(defaults, config); // { port: 3000, debug: true }
```

## Type Utilities

`objectenvy` exports type-level helpers for working with environment shapes:

### `ToEnv<T>`

Flatten a nested config type into a `SCREAMING_SNAKE_CASE` env record, **preserving string literal and template literal types** for compile-time validation:

```typescript
import type { ToEnv } from 'objectenvy';

type Config = {
  portNumber: number;
  log: {
    level: 'debug' | 'info' | 'warn' | 'error';
    path: string;
  };
  apiUrl: `https://${string}`;
};

type Env = ToEnv<Config>;
// {
//   PORT_NUMBER: `${number}`;
//   LOG_LEVEL: 'debug' | 'info' | 'warn' | 'error';
//   LOG_PATH: string;
//   API_URL: `https://${string}`;
// }
```

This enables compile-time validation of env values, IDE autocomplete for allowed options, and pattern enforcement via template literal types.

### `FromEnv<T>`

Convert a flat env record to camelCased config (uses type-fest's `CamelCasedPropertiesDeep`):

```typescript
import type { FromEnv } from 'objectenvy';

type Env = { PORT_NUMBER: string; LOG_LEVEL: string };
type Config = FromEnv<Env>; // { portNumber: string; logLevel: string }
```

### `WithPrefix<T, P>` / `WithoutPrefix<T, P>`

```typescript
import type { WithPrefix, WithoutPrefix } from 'objectenvy';

type Env = { PORT: string; DEBUG: string };
type Prefixed = WithPrefix<Env, 'APP'>;  // { APP_PORT: string; APP_DEBUG: string }
type Plain    = WithoutPrefix<Prefixed, 'APP'>; // { PORT: string; DEBUG: string }
```

### `SchemaToEnv<T>`

```typescript
import type { SchemaToEnv } from 'objectenvy';
import { z } from 'zod';

const schema = z.object({ port: z.number(), log: z.object({ level: z.string() }) });
type Env = SchemaToEnv<z.infer<typeof schema>>;
// { PORT: string; LOG_LEVEL: string }
```

## Type Coercion Rules

| Input | Output |
|-------|--------|
| `'true'`, `'TRUE'`, `'True'` | `true` |
| `'false'`, `'FALSE'`, `'False'` | `false` |
| `'123'`, `'-42'` | `123`, `-42` (integers) |
| `'3.14'`, `'-2.5'` | `3.14`, `-2.5` (floats) |
| Other strings | Unchanged |

## Packages

| Package | Description |
|---|---|
| [`objectenvy`](packages/objectenvy) | Core library — `objectify`, `buildConfigWithSchema`, `override`, `merge`, type utilities |
| [`objectenvy-cli`](packages/objectenvy-cli) | Scaffold `.env` files, generate typed config accessors, validate env against schemas |
| [`objectenvy-vscode`](packages/objectenvy-vscode) | VS Code extension — inline hints, schema-aware completion, env usage lint |

## Related projects

- **[dotenv](https://github.com/motdotla/dotenv)** — loads `.env` files into `process.env`. `objectenvy` is complementary: point it at `process.env` after `dotenv` has populated it.
- **[env-var](https://github.com/evanshortiss/env-var)** — fluent per-variable accessors (`env.get('PORT').required().asInt()`). `objectenvy` instead produces a nested object in one call.
- **[convict](https://github.com/mozilla/node-convict)** — schema-first config with multiple sources. `objectenvy` is narrower (env only), lighter (Zod-optional), and leans on TypeScript types instead of a custom schema format.
- **[@t3-oss/env-core](https://env.t3.gg/)** — client/server split with Zod validation. `objectenvy` overlaps on the server-schema story but adds automatic nesting, prefix stripping, and the `ToEnv`/`FromEnv` round-trip utilities.

## Development

```bash
pnpm install
pnpm build
pnpm test
pnpm lint
pnpm format
```

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md).

## License

MIT — see [LICENSE](./LICENSE).
