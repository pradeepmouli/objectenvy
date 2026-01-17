# Examples

This directory contains practical examples of integrating `objectenvy` with popular libraries and patterns.

## Examples

### 1. dotenv + objectenvy Integration

**File**: `dotenv-integration.ts`

Shows how to:
- Load environment variables from a `.env` file using `dotenv`
- Parse them with `objectenvy` and non-nesting prefixes
- Validate with a Zod schema
- Access typed configuration

**Key features demonstrated**:
- Schema-guided validation
- Non-nesting prefixes: `MAX_CONNECTIONS`, `MIN_POOL_SIZE`, `IS_DEBUG` stay flat
- Nested database config
- Feature flags

**Run it**:
```bash
# Create a .env file
cat > .env << 'EOF'
APP_PORT_NUMBER=8080
APP_HOST=0.0.0.0
APP_NODE_ENV=production
APP_DATABASE_HOST=db.example.com
APP_DATABASE_PORT=5432
APP_DATABASE_NAME=myapp
APP_DATABASE_USER=admin
APP_DATABASE_PASSWORD=secret
APP_FEATURES_ENABLE_CACHING=true
APP_FEATURES_ENABLE_LOGGING=true
APP_MAX_CONNECTIONS=200
APP_MAX_TIMEOUT=60000
APP_MIN_POOL_SIZE=5
APP_IS_DEBUG=false
APP_IS_VERBOSE=true
EOF

npx tsx examples/dotenv-integration.ts
```

**Output**:
```
✓ Configuration loaded successfully

Server:
  Host: 0.0.0.0
  Port: 8080
  Environment: production

Database:
  Host: db.example.com
  Port: 5432
  Name: myapp

Features:
  Caching: true
  Logging: true
  Metrics: false

Limits:
  Max Connections: 200
  Max Timeout: 60000ms
  Min Pool Size: 5

Debug:
  Debug Mode: false
  Verbose: true
```

---

### 2. commander + objectenvy Integration

**File**: `commander-integration.ts`

Shows how to:
- Use `commander` for CLI argument parsing
- Merge CLI args with environment variables
- Use smart array merging to concatenate origins
- Apply defaults where CLI args are not provided

**Key features demonstrated**:
- CLI option parsing
- Merging env + CLI with `arrayMergeStrategy: 'concat-unique'`
- Type-safe configuration after merge
- Zod validation

**Run it**:
```bash
# With CLI arguments
npx tsx examples/commander-integration.ts --port 8080 --debug

# With allowed origins (can be repeated)
npx tsx examples/commander-integration.ts --allowed-origins http://localhost:3000 --allowed-origins https://app.example.com

# Show help
npx tsx examples/commander-integration.ts --help

# Mix env vars and CLI args
APP_PORT_NUMBER=9000 APP_MAX_WORKERS=8 npx tsx examples/commander-integration.ts --debug
```

**Output**:
```
✓ Configuration loaded

Server: { port: 8080, host: 'localhost', env: 'production' }
Workers: 4
Debug: { debug: true, verbose: false }
Allowed Origins: [ 'localhost:3000', 'http://localhost:3000', 'https://app.example.com' ]
```

---

## Installation

To run these examples, install dependencies:

```bash
npm install dotenv commander zod
# or
pnpm add dotenv commander zod
```

## Key Concepts

### Non-Nesting Prefixes

In both examples, prefixes like `MAX_`, `MIN_`, `IS_` are configured to stay flat:

```ts
objectify({
  env,
  nonNestingPrefixes: ['max', 'min', 'is', 'enable', 'disable']
});
```

So:
- `MAX_CONNECTIONS=100` → `{ maxConnections: 100 }` (not `{ max: { connections: 100 } }`)
- `IS_DEBUG=true` → `{ isDebug: true }` (not `{ is: { debug: true } }`)

### Smart Array Merging

When merging env and CLI configs, use strategies:

```ts
merge(envConfig, cliConfig, { arrayMergeStrategy: 'concat-unique' });
```

- `'replace'`: CLI array replaces env array
- `'concat'`: Both arrays concatenated (with duplicates)
- `'concat-unique'`: Both arrays concatenated, deduplicated

### Schema Validation

Both examples use Zod schemas for:
- Type safety
- Validation
- Defaults
- Error messages

```ts
const configSchema = z.object({
  portNumber: z.number().default(3000),
  isDebug: z.boolean().default(false)
});

configSchema.parse(config);
```

---

## Integration Patterns

### Pattern 1: Env + Defaults
```ts
const envConfig = objectify({ env });
const withDefaults = merge(envConfig, defaults);
const validated = schema.parse(withDefaults);
```

### Pattern 2: Env + CLI + Defaults
```ts
const envConfig = objectify({ env });
const cliConfig = parseCliArgs(cliArgs);
const merged = merge(envConfig, cliConfig, { arrayMergeStrategy: 'concat-unique' });
const withDefaults = merge(merged, defaults);
const validated = schema.parse(withDefaults);
```

### Pattern 3: Config with Array Concatenation
```ts
const baseConfig = objectify({ env, prefix: 'APP' });
const overrides = loadFromFile('config.json');
const final = merge(baseConfig, overrides, { arrayMergeStrategy: 'concat-unique' });
```

---

## See Also

- [Main README](../README.md)
- [objectenvy API](../README.md#api)
