# objectenvy

Automatically map `process.env` to strongly-typed, nested config objects with camelCase fields. Includes schema-guided nesting (via Zod), smart nesting without schema, type coercion, and smart array merging options.

## Features

- Schema-guided nesting (with Zod): output shape follows the schema exactly
- Smart nesting (no schema): nests only when multiple env vars share a prefix
- Non-nesting prefixes (smart mode): `max`, `min`, `is`, `enable`, `disable` stay flat
- Type coercion: strings → numbers/booleans; comma-separated → arrays
- Smart array merging options for config merges
- Zero-deps runtime (Zod is optional)

## Install

```bash
pnpm add objectenvy
```

## Quick Start

```ts
import { objectify } from 'objectenvy';

const env = {
  PORT_NUMBER: '3000',
  LOG_LEVEL: 'debug',
  LOG_PATH: '/var/log'
};

const config = objectify({ env });
// {
//   portNumber: 3000,              // flat (single PORT_* key)
//   log: { level: 'debug', path: '/var/log' } // nested (multiple LOG_* keys)
// }
```

## Non-Nesting Prefixes (Smart Nesting)

In smart mode (no schema), the first segments `max`, `min`, `is`, `enable`, `disable` are treated as qualifiers and do not trigger nesting:

```ts
const env = {
  MAX_CONNECTIONS: '100',
  MAX_TIMEOUT: '30',
  IS_DEBUG: 'true',
  ENABLE_FEATURE_X: 'true',
  DISABLE_CACHE: 'false'
};

const config = objectify({ env });
// {
//   maxConnections: 100,
//   maxTimeout: 30,
//   isDebug: true,
//   enableFeatureX: true,
//   disableCache: false
// }

// Customize:
objectify({ env, nonNestingPrefixes: ['flag', 'has'] });
```

Schema-guided nesting is unaffected and always follows your schema.

## Smart Array Merging

When merging or applying defaults to config objects, choose how arrays are handled:

```ts
import { merge, apply } from 'objectenvy';

const base = { tags: ['prod'], server: { hosts: ['host1'] } };
const next = { tags: ['v1'], server: { hosts: ['host2'] } };

// 1) replace (default)
merge(base, next); // { tags: ['v1'], server: { hosts: ['host2'] } }

// 2) concat
merge(base, next, { arrayMergeStrategy: 'concat' });
// { tags: ['prod','v1'], server: { hosts: ['host1','host2'] } }

// 3) concat-unique
merge(base, next, { arrayMergeStrategy: 'concat-unique' });
// { tags: ['prod','v1'], server: { hosts: ['host1','host2'] } }

// Apply defaults with the same strategies
apply({ tags: ['prod'] }, { tags: ['v1'] }, { arrayMergeStrategy: 'concat' });
```

## Schema-Guided Nesting (Optional)

```ts
import { objectify } from 'objectenvy';
import { z } from 'zod';

const schema = z.object({
  portNumber: z.number(),
  log: z.object({ level: z.string(), path: z.string() })
});

const env = {
  PORT_NUMBER: '3000',
  LOG_LEVEL: 'debug',
  LOG_PATH: '/var/log'
};

const config = objectify({ env, schema });
// { portNumber: 3000, log: { level: 'debug', path: '/var/log' } }
```

## API

- `objectify(options)` → parse env to config
  - Options: `env`, `prefix`, `schema`, `coerce`, `delimiter`, `nonNestingPrefixes`
- `merge(obj1, obj2, options?)` → deep merge with array strategies
  - Options: `{ arrayMergeStrategy?: 'replace' | 'concat' | 'concat-unique' }`
- `apply(config, defaults, options?)` → apply defaults with array strategies
  - Options: `{ arrayMergeStrategy?: 'replace' | 'concat' | 'concat-unique' }`
- `envy(config)` → reverse to SCREAMING_SNAKE_CASE env

## License

MIT
