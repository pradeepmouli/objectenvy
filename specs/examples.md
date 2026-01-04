# Practical Examples & Use Cases

**Created**: January 3, 2026
**Purpose**: Demonstrate real-world usage of env-y-config and config-y-env tools

---

## Example 1: Database Configuration

### Scenario
A Node.js application needs to manage database connections for different environments (dev, staging, production).

### Starting Point: Zod Schema

**File**: `src/config.schema.ts`
```typescript
import { z } from 'zod';

export const databaseConfigSchema = z.object({
  database: z.object({
    host: z.string().describe('Database host address'),
    port: z.number().default(5432).describe('Database port'),
    username: z.string().describe('Database username'),
    password: z.string().describe('Database password'),
    database: z.string().describe('Database name'),
    ssl: z.boolean().default(false).describe('Enable SSL connection'),
    maxConnections: z.number().default(20).describe('Max connection pool size'),
    timeout: z.number().default(5000).describe('Connection timeout in ms'),
  }),
  logging: z.object({
    level: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
    queries: z.boolean().default(false).describe('Log SQL queries'),
  }),
});
```

### Generate .env Sample

**Command**:
```bash
env-y-config src/config.schema.ts --output .env.example
```

**Generated `.env.example`**:
```bash
# Database host address
DATABASE_HOST="localhost"
# Database port
DATABASE_PORT=5432
# Database username
DATABASE_USERNAME="postgres"
# Database password
DATABASE_PASSWORD="password"
# Database name
DATABASE_DATABASE="myapp_dev"
# Enable SSL connection
DATABASE_SSL=false
# Max connection pool size
DATABASE_MAX_CONNECTIONS=20
# Connection timeout in ms
DATABASE_TIMEOUT=5000

# Logging Configuration
LOGGING_LEVEL="info"
# Log SQL queries
LOGGING_QUERIES=false
```

### Generate TypeScript Types

Now switch to working with the actual `.env` file:

**File**: `.env.production`
```bash
DATABASE_HOST=prod.db.example.com
DATABASE_PORT=5432
DATABASE_USERNAME=produser
DATABASE_PASSWORD=encrypted_secret
DATABASE_DATABASE=myapp_prod
DATABASE_SSL=true
DATABASE_MAX_CONNECTIONS=50
DATABASE_TIMEOUT=10000
LOGGING_LEVEL=error
LOGGING_QUERIES=false
```

**Command**:
```bash
config-y-env .env.production --to ts -o src/types/production-config.ts
```

**Generated TypeScript**:
```typescript
export interface Config {
  database: {
    host: string;
    port: number;
    username: string;
    password: string;
    database: string;
    ssl: boolean;
    maxConnections: number;
    timeout: number;
  };
  logging: {
    level: string;
    queries: boolean;
  };
}
```

---

## Example 2: Microservices Configuration

### Scenario
Multiple microservices with different env var prefixes.

### Starting JSON Schema

**File**: `schemas/service-config.json`
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "properties": {
    "service": {
      "type": "object",
      "properties": {
        "name": { "type": "string", "default": "my-service" },
        "port": { "type": "number", "default": 3000 },
        "env": { "type": "string", "enum": ["development", "staging", "production"], "default": "development" },
        "debug": { "type": "boolean", "default": false }
      }
    },
    "cache": {
      "type": "object",
      "properties": {
        "provider": { "type": "string", "enum": ["redis", "memcached"], "default": "redis" },
        "host": { "type": "string", "default": "localhost" },
        "port": { "type": "number", "default": 6379 },
        "ttl": { "type": "number", "default": 3600, "description": "Cache TTL in seconds" }
      }
    },
    "metrics": {
      "type": "object",
      "properties": {
        "enabled": { "type": "boolean", "default": true },
        "port": { "type": "number", "default": 9090 }
      }
    }
  }
}
```

### Generate .env with Prefix

**Command**:
```bash
env-y-config schemas/service-config.json --prefix MY_SERVICE -o .env.service
```

**Generated `.env.service`**:
```bash
MY_SERVICE_SERVICE_NAME="my-service"
MY_SERVICE_SERVICE_PORT=3000
MY_SERVICE_SERVICE_ENV="development"
MY_SERVICE_SERVICE_DEBUG=false

MY_SERVICE_CACHE_PROVIDER="redis"
MY_SERVICE_CACHE_HOST="localhost"
MY_SERVICE_CACHE_PORT=6379
# Cache TTL in seconds
MY_SERVICE_CACHE_TTL=3600

MY_SERVICE_METRICS_ENABLED=true
MY_SERVICE_METRICS_PORT=9090
```

### Generate Zod Schema

**Command**:
```bash
config-y-env .env.service --to ts --zod-schema -o src/schema.ts
```

**Generated `src/schema.ts`**:
```typescript
import { z } from 'zod';

export const configSchema = z.object({
  myService: z.object({
    service: z.object({
      name: z.string(),
      port: z.number(),
      env: z.string(),
      debug: z.boolean(),
    }),
    cache: z.object({
      provider: z.string(),
      host: z.string(),
      port: z.number(),
      ttl: z.number(),
    }),
    metrics: z.object({
      enabled: z.boolean(),
      port: z.number(),
    }),
  }),
});

export interface Config {
  myService: {
    service: {
      name: string;
      port: number;
      env: string;
      debug: boolean;
    };
    cache: {
      provider: string;
      host: string;
      port: number;
      ttl: number;
    };
    metrics: {
      enabled: boolean;
      port: number;
    };
  };
}
```

---

## Example 3: API Configuration

### Scenario
Build an API with multiple integrations and secure the configuration.

### TypeScript Type Definition

**File**: `src/types/api-config.ts`
```typescript
export interface ApiConfig {
  server: {
    host: string;
    port: number;
    corsOrigins: string[];
  };
  auth: {
    jwtSecret: string;
    tokenExpiry: number;
    refreshTokenExpiry: number;
  };
  integrations: {
    stripe: {
      apiKey: string;
      webhookSecret: string;
    };
    sendGrid: {
      apiKey: string;
      senderEmail: string;
    };
    aws: {
      region: string;
      accessKeyId: string;
      secretAccessKey: string;
    };
  };
  features: {
    enableAnalytics: boolean;
    enableMetrics: boolean;
    enableRateLimiting: boolean;
  };
}
```

### Generate .env Sample

**Command**:
```bash
env-y-config src/types/api-config.ts --type ApiConfig --from ts -o .env.example
```

**Generated `.env.example`**:
```bash
# Server Configuration
SERVER_HOST="localhost"
SERVER_PORT=3000
# Comma-separated CORS origins
SERVER_CORS_ORIGINS="http://localhost:3000,http://localhost:3001"

# Authentication
AUTH_JWT_SECRET="your-secret-key-here"
# Token expiry in seconds
AUTH_TOKEN_EXPIRY=3600
# Refresh token expiry in seconds
AUTH_REFRESH_TOKEN_EXPIRY=604800

# Stripe Integration
INTEGRATIONS_STRIPE_API_KEY="sk_test_..."
INTEGRATIONS_STRIPE_WEBHOOK_SECRET="whsec_test_..."

# SendGrid Integration
INTEGRATIONS_SENDGRID_API_KEY="SG...."
INTEGRATIONS_SENDGRID_SENDER_EMAIL="noreply@example.com"

# AWS Integration
INTEGRATIONS_AWS_REGION="us-east-1"
INTEGRATIONS_AWS_ACCESS_KEY_ID="AKIA..."
INTEGRATIONS_AWS_SECRET_ACCESS_KEY="..."

# Features
FEATURES_ENABLE_ANALYTICS=true
FEATURES_ENABLE_METRICS=true
FEATURES_ENABLE_RATE_LIMITING=true
```

### Parse Production .env to JSON Schema

**File**: `.env.production`
```bash
SERVER_HOST=api.example.com
SERVER_PORT=443
SERVER_CORS_ORIGINS=https://example.com,https://app.example.com
AUTH_JWT_SECRET=super_secret_prod_key
AUTH_TOKEN_EXPIRY=7200
AUTH_REFRESH_TOKEN_EXPIRY=2592000
INTEGRATIONS_STRIPE_API_KEY=sk_live_...
INTEGRATIONS_STRIPE_WEBHOOK_SECRET=whsec_live_...
INTEGRATIONS_SENDGRID_API_KEY=SG.....
INTEGRATIONS_SENDGRID_SENDER_EMAIL=notifications@example.com
INTEGRATIONS_AWS_REGION=us-east-1
INTEGRATIONS_AWS_ACCESS_KEY_ID=AKIA...
INTEGRATIONS_AWS_SECRET_ACCESS_KEY=...
FEATURES_ENABLE_ANALYTICS=true
FEATURES_ENABLE_METRICS=true
FEATURES_ENABLE_RATE_LIMITING=true
```

**Command**:
```bash
config-y-env .env.production --to json-schema -o schemas/api-config.schema.json
```

**Generated JSON Schema**:
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "properties": {
    "server": {
      "type": "object",
      "properties": {
        "host": { "type": "string" },
        "port": { "type": "number" },
        "corsOrigins": { "type": "array", "items": { "type": "string" } }
      },
      "required": ["host", "port", "corsOrigins"]
    },
    "auth": {
      "type": "object",
      "properties": {
        "jwtSecret": { "type": "string" },
        "tokenExpiry": { "type": "number" },
        "refreshTokenExpiry": { "type": "number" }
      },
      "required": ["jwtSecret", "tokenExpiry", "refreshTokenExpiry"]
    },
    "integrations": {
      "type": "object",
      "properties": {
        "stripe": {
          "type": "object",
          "properties": {
            "apiKey": { "type": "string" },
            "webhookSecret": { "type": "string" }
          },
          "required": ["apiKey", "webhookSecret"]
        }
      }
    }
  },
  "required": ["server", "auth", "integrations"]
}
```

---

## Example 4: Using in VS Code Extension

### Workflow 1: Design-First (Schema to .env)

1. **Create Zod schema** in TypeScript file
2. **Open Command Palette** → "EnvyConfig: Generate .env from Schema"
3. **Select** "Zod" format
4. **Choose** schema file
5. **Preview** generated .env in side panel
6. **Click** "Create .env.example" to save

### Workflow 2: Implementation-First (.env to Types)

1. **Create** `.env.production` file
2. **Right-click** on file in explorer
3. **Select** "EnvyConfig: Generate TypeScript Types"
4. **Choose** output format (TypeScript, JSON Schema, Zod)
5. **Preview** generated types in side panel
6. **Click** "Insert into Editor" to paste into current file
7. **Refine** types as needed

### Workflow 3: Quick Convert

1. **Have TypeScript config file open** (e.g., `config.types.ts`)
2. **Open Command Palette** → "EnvyConfig: Quick Convert"
3. **Automatically generates** .env in new tab based on file type
4. **Copy** and save as `.env` file

---

## Example 5: Array Values

### Real-World Scenario

**File**: `.env`
```bash
ALLOWED_HOSTS=localhost,127.0.0.1,example.com
ENABLED_FEATURES=auth,logging,metrics,cache
DATABASE_REPLICAS=db1.example.com:5432,db2.example.com:5432,db3.example.com:5432
TRUSTED_ORIGINS=http://localhost:3000,https://app.example.com,https://admin.example.com
```

### Type Generation with Arrays

**Command**:
```bash
config-y-env .env --to ts -o src/config.ts
```

**Generated TypeScript**:
```typescript
export interface Config {
  allowedHosts: string[];
  enabledFeatures: string[];
  databaseReplicas: string[];
  trustedOrigins: string[];
}
```

### Usage in Application

```typescript
import { config } from 'envyconfig';
import type { Config } from './config';

const appConfig = config<Config>();

// Arrays are automatically parsed
console.log(appConfig.allowedHosts); // ['localhost', '127.0.0.1', 'example.com']
console.log(appConfig.enabledFeatures); // ['auth', 'logging', 'metrics', 'cache']

// Use directly
if (appConfig.enabledFeatures.includes('logging')) {
  setupLogger();
}
```

---

## Example 6: Environment-Specific Configurations

### Scenario
Generate different .env files for different environments from same schema.

**File**: `config.schema.ts`
```typescript
export const appSchema = z.object({
  app: z.object({
    env: z.enum(['development', 'staging', 'production']),
    debug: z.boolean(),
  }),
  database: z.object({
    host: z.string(),
    port: z.number().default(5432),
    maxConnections: z.number(),
  }),
  cache: z.object({
    ttl: z.number().describe('Cache TTL in seconds'),
  }),
});
```

### Generate for Development

**Command**:
```bash
env-y-config config.schema.ts --output .env.development
```

**Generated `.env.development`**:
```bash
APP_ENV="development"
APP_DEBUG=true
DATABASE_HOST="localhost"
DATABASE_PORT=5432
DATABASE_MAX_CONNECTIONS=5
CACHE_TTL=300
```

### Manually Adjust for Production

**File**: `.env.production`
```bash
APP_ENV="production"
APP_DEBUG=false
DATABASE_HOST="prod.db.internal"
DATABASE_PORT=5432
DATABASE_MAX_CONNECTIONS=100
CACHE_TTL=3600
```

### Generate Schema from Production Config

**Command**:
```bash
config-y-env .env.production --interface-name ProductionConfig -o src/types/production.ts
```

This maintains consistency across all configurations!

---

## Common Patterns

### Pattern 1: Schema-Driven Development

```
┌─────────────────────┐
│  Zod Schema         │
│  (Single source     │
│   of truth)         │
└──────────┬──────────┘
           │
           ├─→ env-y-config → .env.example
           │
           └─→ config-y-env → TypeScript types
```

### Pattern 2: Config File-Driven Development

```
┌─────────────────────┐
│  .env File          │
│  (Implementation    │
│   driven)           │
└──────────┬──────────┘
           │
           └─→ config-y-env → TypeScript types & Zod schema
```

### Pattern 3: Hybrid Approach

```
┌─────────────────────┐     ┌──────────────────┐
│  Zod Schema         │────→│  .env.example    │
│  (Design)           │     │                  │
└─────────────────────┘     └──────────────────┘
                                     │
                                     ↓
                            ┌──────────────────┐
                            │  .env.production │
                            │  (Implementation)│
                            └──────────────────┘
                                     │
                                     ↓
                            ┌──────────────────┐
                            │ TypeScript types │
                            │ (Generated)      │
                            └──────────────────┘
```

---

## Tips & Best Practices

### 1. Use Descriptions in Schemas
```typescript
z.string().describe('Database host address - use FQDN in production')
```

### 2. Set Realistic Defaults
```typescript
z.number().default(5432).describe('Database port')
```

### 3. Use Enums for Options
```typescript
z.enum(['debug', 'info', 'warn', 'error']).default('info')
```

### 4. Document Arrays with Examples
```typescript
z.array(z.string()).describe('Comma-separated allowed hosts: localhost,example.com')
```

### 5. Validate Generated Types
```typescript
import { config } from 'envyconfig';
import { appSchema } from './config.schema';

const appConfig = config({ schema: appSchema });
// Type-safe access with validation
console.log(appConfig.database.host);
```
