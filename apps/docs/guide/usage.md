# Usage

## Basic

```typescript
import { objectify } from 'objectenvy';

const result = objectify({ env: process.env });
```

## With prefix filtering

```typescript
// Given: APP_PORT=3000, APP_DEBUG=true, OTHER_VAR=ignored
const result = objectify({ env: process.env, prefix: 'APP' });
// Result: { port: 3000, debug: true }
```

## With Zod schema (schema-guided nesting)

```typescript
import { buildConfigWithSchema } from 'objectenvy';
import { z } from 'zod';

const schema = z.object({
  portNumber: z.number(),
  log: z.object({
    level: z.enum(['debug', 'info', 'warn', 'error']),
    path: z.string()
  })
});

const config = buildConfigWithSchema({ env: process.env, schema });
// Fully typed + validated
```

## More

See the [API Reference](../api/) for the full surface: `objectify`, `buildConfigWithSchema`, type utilities (`ToEnv`, `FromEnv`, `WithPrefix`), and merge strategies.
