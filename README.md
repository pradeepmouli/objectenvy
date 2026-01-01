# configenvy

Automatically map `process.env` entries to strongly-typed config objects with camelCase fields and nested structures.

## Features

- **Smart Nesting**: Only nests when multiple entries share a common prefix
  - `PORT_NUMBER=1234` → `{ portNumber: 1234 }` (single entry stays flat)
  - `LOG_LEVEL` + `LOG_PATH` → `{ log: { level: ..., path: ... } }` (multiple entries get nested)
- **Type Coercion**: Automatically converts strings to numbers and booleans
- **Prefix Filtering**: Only load variables with a specific prefix (e.g., `APP_`)
- **Zod Validation**: Optional schema validation with full TypeScript type inference
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

### With Zod Schema Validation

```typescript
import { configEnvy } from 'configenvy';
import { z } from 'zod';

// Define your expected config shape
// (must match the smart nesting behavior based on your env vars)
const schema = z.object({
  port: z.number().min(1000).max(65535),  // APP_PORT (single entry)
  log: z.object({                          // APP_LOG_* (multiple entries)
    level: z.enum(['debug', 'info', 'warn', 'error']),
    path: z.string()
  }),
  database: z.object({                     // APP_DATABASE_* (multiple entries)
    host: z.string(),
    port: z.number(),
    ssl: z.boolean().default(false)
  })
});

// Fully typed config with validation
const config = configEnvy({ schema, prefix: 'APP' });

// TypeScript knows: config.port is number, config.log.level is 'debug' | 'info' | 'warn' | 'error'
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
| `schema` | `z.ZodType` | - | Zod schema for validation and type inference |
| `coerce` | `boolean` | `true` | Auto-convert strings to numbers/booleans |
| `delimiter` | `string` | `'_'` | Delimiter for nesting (e.g., `'__'` for double underscore) |

### `createConfigEnvy(defaultOptions)`

Create a reusable config loader with preset options.

```typescript
const loadConfig = createConfigEnvy({ prefix: 'APP', schema: mySchema });
const config = loadConfig(); // Uses defaults
const testConfig = loadConfig({ env: testEnv }); // Override env
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
