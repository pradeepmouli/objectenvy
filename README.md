# configenvy

Automatically map `process.env` entries to strongly-typed config objects with camelCase fields and nested structures.

## Features

- **Schema-Guided Nesting**: When a Zod schema is provided, the structure follows the schema exactly
  - `PORT_NUMBER` → `{ portNumber }` or `{ port: { number } }` depending on your schema
- **Smart Nesting** (without schema): Automatically nests when multiple entries share a prefix
  - `PORT_NUMBER=1234` → `{ portNumber: 1234 }` (single entry stays flat)
  - `LOG_LEVEL` + `LOG_PATH` → `{ log: { level: ..., path: ... } }` (multiple entries get nested)
- **Type Coercion**: Automatically converts strings to numbers and booleans
- **Prefix Filtering**: Only load variables with a specific prefix (e.g., `APP_`)
- **Zod Validation**: Optional schema validation with full TypeScript type inference
- **Type Utilities**: `ToEnv<T>`, `FromEnv<T>`, `WithPrefix<T>` for type-level transformations
- **Zero Dependencies Runtime**: Uses Zod only when you opt-in to schema validation

## Installation

```bash
npm install configenvy
# or
pnpm add configenvy
# or
yarn add configenvy
```

## Quick Start

```typescript
import { configEnvy } from 'configenvy';

// Given these environment variables:
// PORT_NUMBER=3000          <- single PORT_* entry, stays flat
// LOG_LEVEL=debug           <- multiple LOG_* entries, gets nested
// LOG_PATH=/var/log
// DATABASE_HOST=localhost   <- multiple DATABASE_* entries, gets nested
// DATABASE_PORT=5432

const config = configEnvy();

// Result:
// {
//   portNumber: 3000,        // flat (only one PORT_* entry)
//   log: {                   // nested (multiple LOG_* entries)
//     level: 'debug',
//     path: '/var/log'
//   },
//   database: {              // nested (multiple DATABASE_* entries)
//     host: 'localhost',
//     port: 5432
//   }
// }
```

## Usage

### Basic Usage

```typescript
import { configEnvy } from 'configenvy';

// Load all environment variables
const config = configEnvy();
```

### With Prefix Filtering

```typescript
// Given: APP_PORT=3000, APP_DEBUG=true, OTHER_VAR=ignored
const config = configEnvy({ prefix: 'APP' });

// Result: { port: 3000, debug: true }
```

### With Zod Schema (Schema-Guided Nesting)

When you provide a schema, configenvy uses the schema structure to determine nesting. This gives you full control over the output shape:

```typescript
import { configEnvy } from 'configenvy';
import { z } from 'zod';

// The schema defines exactly how env vars map to your config
const schema = z.object({
  portNumber: z.number(),                  // PORT_NUMBER -> portNumber (flat)
  log: z.object({                          // LOG_LEVEL -> log.level (nested)
    level: z.enum(['debug', 'info', 'warn', 'error']),
    path: z.string()                       // LOG_PATH -> log.path
  }),
  database: z.object({
    host: z.string(),                      // DATABASE_HOST -> database.host
    port: z.number(),                      // DATABASE_PORT -> database.port
    ssl: z.boolean().default(false)
  })
});

// Given: PORT_NUMBER=3000, LOG_LEVEL=debug, LOG_PATH=/var/log, DATABASE_HOST=localhost, DATABASE_PORT=5432
const config = configEnvy({ schema, prefix: 'APP' });

// Result matches schema structure exactly:
// {
//   portNumber: 3000,
//   log: { level: 'debug', path: '/var/log' },
//   database: { host: 'localhost', port: 5432, ssl: false }
// }

// TypeScript knows: config.portNumber is number, config.log.level is 'debug' | 'info' | 'warn' | 'error'
```

### Reusable Config Loader

```typescript
import { createConfigEnvy } from 'configenvy';
import { z } from 'zod';

const schema = z.object({
  port: z.number(),
  debug: z.boolean()
});

// Create a reusable loader with preset options
const loadConfig = createConfigEnvy({
  prefix: 'APP',
  schema
});

// Use in your app
const config = loadConfig();

// Override for testing
const testConfig = loadConfig({
  env: { APP_PORT: '3000', APP_DEBUG: 'true' }
});
```

### Custom Delimiter for Nesting

By default, each underscore creates a new nesting level. Use `delimiter: '__'` for double-underscore nesting:

```typescript
// Given: LOG__LEVEL=debug, LOG__FILE_PATH=/var/log
const config = configEnvy({ delimiter: '__' });

// Result: { log: { level: 'debug', filePath: '/var/log' } }
// Note: Single underscores become camelCase within the segment
```

### Disable Type Coercion

```typescript
const config = configEnvy({ coerce: false });
// All values remain strings
```

## API Reference

### `configEnvy(options?)`

Parse environment variables into a nested config object.

#### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `env` | `NodeJS.ProcessEnv` | `process.env` | Custom environment object |
| `prefix` | `string` | - | Only include vars starting with this prefix |
| `schema` | `z.ZodType` | - | Zod schema for validation, type inference, and structure guidance |
| `coerce` | `boolean` | `true` | Auto-convert strings to numbers/booleans |
| `delimiter` | `string` | `'_'` | Delimiter for nesting (e.g., `'__'` for double underscore) |

### `createConfigEnvy(defaultOptions)`

Create a reusable config loader with preset options.

```typescript
const loadConfig = createConfigEnvy({ prefix: 'APP', schema: mySchema });
const config = loadConfig(); // Uses defaults
const testConfig = loadConfig({ env: testEnv }); // Override env
```

## Type Utilities

configenvy exports type utilities to help with type-safe environment variable handling:

### `ToEnv<T>`

Convert a nested config type to a flat SCREAMING_SNAKE_CASE env record:

```typescript
import type { ToEnv } from 'configenvy';

type Config = {
  portNumber: number;
  log: {
    level: string;
    path: string;
  };
};

type Env = ToEnv<Config>;
// {
//   PORT_NUMBER: string;
//   LOG_LEVEL: string;
//   LOG_PATH: string;
// }
```

### `FromEnv<T>`

Convert flat env keys to camelCase (uses type-fest's `CamelCasedPropertiesDeep`):

```typescript
import type { FromEnv } from 'configenvy';

type Env = { PORT_NUMBER: string; LOG_LEVEL: string };
type Config = FromEnv<Env>;
// { portNumber: string; logLevel: string }
```

### `WithPrefix<T, P>` / `WithoutPrefix<T, P>`

Add or remove prefixes from env keys:

```typescript
import type { WithPrefix, WithoutPrefix } from 'configenvy';

type Env = { PORT: string; DEBUG: string };
type PrefixedEnv = WithPrefix<Env, 'APP'>;
// { APP_PORT: string; APP_DEBUG: string }

type Unprefixed = WithoutPrefix<PrefixedEnv, 'APP'>;
// { PORT: string; DEBUG: string }
```

### `SchemaToEnv<T>`

Extract env type from a Zod schema's inferred type:

```typescript
import type { SchemaToEnv } from 'configenvy';
import { z } from 'zod';

const schema = z.object({
  port: z.number(),
  log: z.object({ level: z.string() })
});

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

## License

MIT
