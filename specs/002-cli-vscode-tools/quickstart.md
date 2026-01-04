# Quick Start: CLI Tools & VS Code Extension

**Feature**: 002-cli-vscode-tools  
**Date**: 2026-01-04  
**Target Users**: Developers using envyconfig for environment configuration

## Overview

This guide shows how to use the CLI tools and VS Code extension to convert between schemas, .env files, and TypeScript types.

## Installation

### CLI Tools

Install both CLI tools globally via npm:

```bash
npm install -g env-y-config config-y-env
# or
pnpm add -g env-y-config config-y-env
# or
yarn global add env-y-config config-y-env
```

Verify installation:

```bash
env-y-config --version
config-y-env --version
```

### VS Code Extension

1. Open VS Code
2. Go to Extensions (Ctrl+Shift+X / Cmd+Shift+X)
3. Search for "EnvyConfig Tools"
4. Click Install

Or install from command line:

```bash
code --install-extension envyconfig.vscode-envyconfig
```

## env-y-config: Schema → .env

Convert schema definitions to sample .env files.

### Basic Usage

#### From Zod Schema

```typescript
// schema.ts
import { z } from 'zod';

export const config = z.object({
  database: z.object({
    host: z.string(),
    port: z.number().default(5432),
    ssl: z.boolean().default(false)
  }),
  api: z.object({
    timeout: z.number(),
    retries: z.number()
  })
});
```

Generate .env file:

```bash
env-y-config schema.ts -o .env.sample
```

Output:

```env
# Database host
DATABASE_HOST=localhost

# Database port
DATABASE_PORT=5432

# Enable SSL connection
DATABASE_SSL=false

# API timeout
API_TIMEOUT=30

# API retries
API_RETRIES=3
```

#### From JSON Schema

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "properties": {
    "port": {
      "type": "number",
      "description": "Server port"
    },
    "debug": {
      "type": "boolean",
      "description": "Enable debug mode"
    }
  }
}
```

```bash
env-y-config config.schema.json -o .env
```

#### From TypeScript Interface

```typescript
// types.ts
export interface AppConfig {
  /** Server host */
  host: string;
  /** Server port */
  port: number;
  /** Feature flags */
  features: string[];
}
```

```bash
env-y-config types.ts --type AppConfig -o .env
```

### Advanced Options

#### Add Prefix

```bash
env-y-config schema.ts --prefix APP -o .env
```

Output:
```env
APP_DATABASE_HOST=localhost
APP_DATABASE_PORT=5432
```

#### Include Specific Fields

```bash
env-y-config schema.ts --include database.host,database.port -o .env
```

#### Exclude Fields

```bash
env-y-config schema.ts --exclude api.secret -o .env
```

#### Required Fields Only

```bash
env-y-config schema.ts --required-only -o .env
```

#### Without Comments

```bash
env-y-config schema.ts --no-comments -o .env
```

### Supported Input Formats

| Format | File Extension | Example |
|--------|---------------|---------|
| Zod | `.ts` | `z.object({ port: z.number() })` |
| JSON Schema | `.json` | `{ "type": "object", "properties": { ... } }` |
| TypeScript | `.ts` | `interface Config { port: number }` |
| JSON | `.json` | `{ "port": 3000, "debug": true }` |

## config-y-env: .env → TypeScript

Convert .env files to TypeScript types with smart type inference.

### Basic Usage

#### Generate TypeScript Interface

Given `.env`:

```env
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_SSL=true
API_TIMEOUT=30
ALLOWED_HOSTS=localhost,example.com,api.example.com
DEBUG=false
```

Generate TypeScript:

```bash
config-y-env .env -o config.types.ts
```

Output:

```typescript
/**
 * Environment configuration
 */
export interface Config {
  database: {
    /** Database host */
    host: string;
    /** Database port */
    port: number;
    /** Database ssl */
    ssl: boolean;
  };
  api: {
    /** Api timeout */
    timeout: number;
  };
  /** Allowed hosts */
  allowedHosts: string[];
  /** Debug */
  debug: boolean;
}
```

#### Generate JSON Schema

```bash
config-y-env .env --to json-schema -o config.schema.json
```

#### Generate Zod Schema

```bash
config-y-env .env --to zod -o config.schema.ts
```

Output:

```typescript
import { z } from 'zod';

export const configSchema = z.object({
  database: z.object({
    host: z.string(),
    port: z.number(),
    ssl: z.boolean()
  }),
  api: z.object({
    timeout: z.number()
  }),
  allowedHosts: z.array(z.string()),
  debug: z.boolean()
});

export type Config = z.infer<typeof configSchema>;
```

### Advanced Options

#### Custom Interface Name

```bash
config-y-env .env --interface-name AppConfig -o types.ts
```

#### Filter by Prefix

```bash
config-y-env .env --prefix APP -o types.ts
```

#### Loose Type Inference

```bash
config-y-env .env --inference-mode loose -o types.ts
```

**Strict mode** (default): Infers specific types (boolean, number)
```typescript
{ debug: boolean }  // "true" → boolean
```

**Loose mode**: Prefers string type
```typescript
{ debug: string }   // "true" → string
```

#### Without Comments

```bash
config-y-env .env --no-comments -o types.ts
```

#### With Zod Schema

Generate both TypeScript types and Zod schema:

```bash
config-y-env .env --zod-schema -o types.ts
```

### Supported Output Formats

| Format | Flag | Output |
|--------|------|--------|
| TypeScript | `--to typescript` (default) | Interface definitions |
| JSON Schema | `--to json-schema` | JSON Schema specification |
| JavaScript | `--to javascript` | JavaScript object with JSDoc |
| Zod | `--to zod` | Zod validation schema |

## VS Code Extension

### Command Palette Commands

Open Command Palette (Ctrl+Shift+P / Cmd+Shift+P):

1. **"EnvyConfig: Generate .env from Schema"**
   - Opens file picker for schema file
   - Shows format selection (Zod, JSON Schema, TypeScript, JSON)
   - Displays preview in WebView panel
   - Create file or copy to clipboard

2. **"EnvyConfig: Generate Types from .env"**
   - Opens file picker for .env file
   - Shows output format selection (TypeScript, JSON Schema, JavaScript, Zod)
   - Displays preview in WebView panel
   - Create file or copy to clipboard

3. **"EnvyConfig: Quick Convert"**
   - Auto-detects current file type
   - Shows appropriate conversion options
   - One-click conversion

### Context Menu Integration

#### On Schema Files

Right-click on `.ts` or `.json` files:
- "Generate .env from this Schema" → Opens preview panel

#### On .env Files

Right-click on `.env` files:
- "Generate Types from this .env" → Opens preview panel

### WebView Preview Panel

The preview panel displays:
- **Syntax-highlighted output** (Monaco editor)
- **Action buttons**:
  - "Create File" - Save output to workspace
  - "Copy to Clipboard" - Copy output without saving
  - "Settings" - Configure options (prefix, comments, inference mode)
- **Format tabs** - Switch between output formats
- **Real-time updates** - Auto-refresh when source changes

### Extension Settings

Configure via VS Code Settings (Preferences → Settings → EnvyConfig):

```json
{
  "envyconfig.prefix": "APP",
  "envyconfig.includeComments": true,
  "envyconfig.inferenceMode": "strict",
  "envyconfig.autoPreview": false,
  "envyconfig.cliToolPath": "/custom/path/to/cli"
}
```

## Common Workflows

### Workflow 1: New Project Setup

1. Define Zod schema:
   ```typescript
   // config.schema.ts
   export const schema = z.object({
     database: z.object({
       host: z.string(),
       port: z.number()
     })
   });
   ```

2. Generate .env files for each environment:
   ```bash
   env-y-config config.schema.ts -o .env.development
   env-y-config config.schema.ts -o .env.production
   env-y-config config.schema.ts -o .env.example --no-comments
   ```

3. Fill in actual values in `.env.development` and `.env.production`

### Workflow 2: Existing Project Migration

1. Start with existing `.env`:
   ```env
   DB_HOST=localhost
   DB_PORT=5432
   API_KEY=secret123
   ```

2. Generate TypeScript types:
   ```bash
   config-y-env .env --zod-schema -o config.types.ts
   ```

3. Use generated types in your app:
   ```typescript
   import { configSchema, type Config } from './config.types';
   import { config } from 'envyconfig';
   
   const appConfig = config({ schema: configSchema });
   // appConfig is fully typed as Config
   ```

### Workflow 3: Team Collaboration

1. Commit schema file to git:
   ```bash
   git add config.schema.ts
   git commit -m "Add config schema"
   ```

2. Add .env.example to git (for documentation):
   ```bash
   env-y-config config.schema.ts -o .env.example --no-comments
   git add .env.example
   ```

3. Exclude actual .env from git:
   ```gitignore
   .env
   .env.local
   .env.*.local
   ```

4. Team members generate their own .env:
   ```bash
   env-y-config config.schema.ts -o .env.local
   # Then edit .env.local with real values
   ```

### Workflow 4: Schema Evolution

1. Update schema (add new fields):
   ```typescript
   export const schema = z.object({
     database: z.object({
       host: z.string(),
       port: z.number(),
       ssl: z.boolean() // NEW
     })
   });
   ```

2. Regenerate .env files:
   ```bash
   env-y-config config.schema.ts -o .env.example
   ```

3. Update actual .env files manually (see diff):
   ```bash
   diff .env .env.example
   # Add missing fields to .env
   ```

### Workflow 5: VS Code Integration

1. Open schema file in VS Code
2. Right-click → "Generate .env from this Schema"
3. Preview appears with sample values
4. Adjust settings if needed (prefix, comments)
5. Click "Create File" → Save as `.env.development`
6. Repeat for other environments

## Type Inference Examples

### Boolean Detection

```env
DEBUG=true          → debug: boolean
ENABLED=yes         → enabled: boolean
VERBOSE=false       → verbose: boolean
ACTIVE=1            → active: string (not "1" ≠ boolean pattern)
```

### Number Detection

```env
PORT=3000           → port: number
TIMEOUT=30.5        → timeout: number
MAX_CONNECTIONS=100 → maxConnections: number
VERSION=1.0.0       → version: string (multiple dots)
```

### Array Detection

```env
HOSTS=localhost,example.com          → hosts: string[]
PORTS=3000,3001,3002                 → ports: number[]
FLAGS=true,false,true                → flags: boolean[]
MIXED=1,hello,true                   → mixed: (string | number | boolean)[]
```

### Nesting Detection

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=myapp
```

Becomes:

```typescript
{
  db: {
    host: string;
    port: number;
    name: string;
  }
}
```

**Minimum 2 variables** required for nesting (avoid false positives).

## Troubleshooting

### CLI Tool Not Found

**Error**: `env-y-config: command not found`

**Solution**:
```bash
# Install globally
npm install -g env-y-config config-y-env

# Or use npx (no install needed)
npx env-y-config schema.ts -o .env
```

### VS Code Extension: Tool Not Installed

**Error**: "CLI tools not found. Please install env-y-config and config-y-env"

**Solution**:
1. Open terminal in VS Code
2. Run: `npm install -g env-y-config config-y-env`
3. Restart VS Code
4. Try command again

### Parse Error: Export Not Found

**Error**: `Export 'Config' not found in file`

**Solution**:
```bash
# List available exports
env-y-config schema.ts --list-exports

# Specify correct export
env-y-config schema.ts --type DatabaseConfig -o .env
```

### Invalid Input Format

**Error**: `Unsupported input format: .yaml`

**Solution**: Convert to supported format:
- YAML → JSON: Use online converter or `yq` tool
- Other → TypeScript: Manually create interface

### Permission Denied

**Error**: `Cannot write to output file: Permission denied`

**Solution**:
```bash
# Check directory permissions
ls -la .

# Use different output path
env-y-config schema.ts -o ~/Desktop/.env

# Or output to stdout and redirect
env-y-config schema.ts > .env
```

### Type Inference Issues

**Problem**: Numbers detected as strings

**Solution**: Use strict mode (default)
```bash
config-y-env .env --inference-mode strict -o types.ts
```

**Problem**: Booleans detected as strings

**Cause**: Non-standard boolean values (e.g., "on", "off")

**Solution**: Update .env to use standard values:
```env
DEBUG=true  # not "on"
VERBOSE=false # not "off"
```

## Best Practices

### 1. Version Control

✅ **Do commit**:
- Schema files (`config.schema.ts`)
- Example .env files (`.env.example`)
- Generated type files (`config.types.ts`)

❌ **Don't commit**:
- Actual .env files (`.env`, `.env.local`)
- .env files with secrets

### 2. Secret Management

For secret fields, use placeholder values:

```bash
env-y-config schema.ts -o .env.example
```

Then manually update:

```env
# Generated
API_SECRET=<generate-your-secret-here>

# After manual update
API_SECRET=actual-secret-value-here
```

### 3. Environment-Specific Files

Use separate files for each environment:

```
.env.development    # Local development
.env.staging        # Staging server
.env.production     # Production server
.env.test           # Testing environment
.env.example        # Template (in git)
```

### 4. Schema as Source of Truth

Always regenerate from schema when structure changes:

```bash
# After schema update
env-y-config config.schema.ts -o .env.example
# Then manually merge changes into .env.*
```

### 5. CI/CD Integration

Add validation to CI pipeline:

```yaml
# .github/workflows/ci.yml
- name: Validate .env.example is up to date
  run: |
    env-y-config config.schema.ts -o .env.check
    diff .env.example .env.check
```

### 6. Type Safety

Always use generated types with envyconfig:

```typescript
// BAD: No type safety
const config = envyconfig();

// GOOD: Full type safety
import { configSchema } from './config.types';
const config = envyconfig({ schema: configSchema });
```

## Next Steps

- Explore [Data Model](./data-model.md) for detailed type definitions
- Review [API Contracts](./contracts/) for CLI interfaces
- Check [Implementation Plan](./plan.md) for architecture details
- See [Research](./research.md) for design decisions

---
*Quick start complete - Ready for production use*
