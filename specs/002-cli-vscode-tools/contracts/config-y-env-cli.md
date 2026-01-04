# API Contract: config-y-env CLI Tool

**Tool**: config-y-env  
**Purpose**: Generate TypeScript types and schemas from .env files  
**Version**: 1.0.0

## Command Line Interface

### Synopsis

```bash
config-y-env <input> [options]
```

### Arguments

#### `<input>` (Required)

Path to input .env file.

**Type**: String (file path)  
**Format**: Standard .env format (KEY=value)

### Options

#### `--to <format>`

Specify output format.

**Type**: Enum  
**Values**: `typescript`, `json-schema`, `javascript`, `zod`  
**Default**: `typescript`  
**Example**: `--to zod`

#### `-o, --output <path>`

Output file path. Use `-` for stdout.

**Type**: String (file path)  
**Default**: stdout (`-`)  
**Example**: `-o config.types.ts`

#### `--interface-name <name>`

Name for generated TypeScript interface.

**Type**: String  
**Default**: `Config`  
**Example**: `--interface-name AppConfig`

#### `--prefix <string>`

Filter environment variables by prefix (only process variables starting with prefix).

**Type**: String  
**Default**: None (process all variables)  
**Example**: `--prefix APP` → Only process `APP_*` variables

#### `--exclude <fields>`

Exclude specified fields (comma-separated).

**Type**: String (comma-separated)  
**Default**: None  
**Example**: `--exclude secret,password`

#### `--inference-mode <mode>`

Type inference strictness mode.

**Type**: Enum  
**Values**: `strict`, `loose`  
**Default**: `strict`  
**Example**: `--inference-mode loose`

**Modes**:
- `strict`: Prefer specific types (boolean, number) when patterns match
- `loose`: Prefer string type for ambiguous values

#### `--with-comments`

Include JSDoc comments in generated types.

**Type**: Boolean  
**Default**: `true`  
**Flag**: Use `--no-comments` to disable

#### `--zod-schema`

Also generate Zod validation schema (only for TypeScript output).

**Type**: Boolean  
**Default**: `false`  
**Example**: `--zod-schema`

#### `--help`, `-h`

Display help information.

#### `--version`, `-v`

Display tool version.

## Exit Codes

| Code | Meaning | Description |
|------|---------|-------------|
| 0 | Success | Types generated successfully |
| 1 | File Not Found | Input .env file doesn't exist or not readable |
| 2 | Parse Error | Failed to parse .env file |
| 3 | Invalid Format | Invalid .env syntax |
| 4 | Output Error | Cannot write to output file |

## Input Format

### .env File Syntax

```env
# Comments start with #
KEY=value
KEY_WITH_SPACES="value with spaces"
EMPTY_VALUE=
QUOTED="quoted value"
SINGLE_QUOTED='single quoted'

# Nesting detected by common prefix
DATABASE_HOST=localhost
DATABASE_PORT=5432

# Arrays detected by commas
ALLOWED_HOSTS=localhost,example.com,api.example.com
```

**Requirements**:
- One variable per line
- `KEY=value` format
- Comments use `#`
- Quotes optional (except for values with spaces)
- Empty values allowed (treated as optional)
- No multiline values (must use escape sequences)

**Parsing Rules**:
- Line format: `KEY=value` or `KEY="value"`
- Comments: Lines starting with `#`
- Empty lines: Ignored
- Whitespace: Trimmed around keys and unquoted values
- Quotes: Removed from quoted values

## Output Formats

### TypeScript Interface

```typescript
/**
 * Environment configuration
 */
export interface Config {
  /** Database host */
  host: string;
  /** Database port */
  port: number;
  /** Debug mode */
  debug: boolean;
  /** Allowed hosts */
  allowedHosts: string[];
  /** Optional field */
  optional?: string;
}
```

**Features**:
- JSDoc comments (if `--with-comments`)
- Optional fields marked with `?:`
- Nested objects for grouped variables
- Array types for comma-separated values
- Exported interface

### TypeScript with Zod Schema

```typescript
import { z } from 'zod';

/**
 * Environment configuration schema
 */
export const configSchema = z.object({
  host: z.string(),
  port: z.number(),
  debug: z.boolean(),
  allowedHosts: z.array(z.string()),
  optional: z.string().optional()
});

/**
 * Environment configuration type
 */
export type Config = z.infer<typeof configSchema>;
```

**Features**:
- Zod schema with validation
- Type inference from schema
- Optional fields use `.optional()`
- Array validation

### JSON Schema

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "Config",
  "type": "object",
  "properties": {
    "host": {
      "type": "string",
      "description": "Database host"
    },
    "port": {
      "type": "number",
      "description": "Database port"
    },
    "debug": {
      "type": "boolean",
      "description": "Debug mode"
    },
    "allowedHosts": {
      "type": "array",
      "items": { "type": "string" },
      "description": "Allowed hosts"
    }
  },
  "required": ["host", "port", "debug", "allowedHosts"]
}
```

### JavaScript Object

```javascript
/**
 * @typedef {Object} Config
 * @property {string} host - Database host
 * @property {number} port - Database port
 * @property {boolean} debug - Debug mode
 * @property {string[]} allowedHosts - Allowed hosts
 * @property {string} [optional] - Optional field
 */

/**
 * Default configuration values
 * @type {Config}
 */
export const config = {
  host: "localhost",
  port: 5432,
  debug: false,
  allowedHosts: ["localhost", "example.com"],
  optional: undefined
};
```

## Type Inference Rules

### Boolean Detection

**Pattern**: Exact match (case-insensitive)

| Value | Inferred Type |
|-------|--------------|
| `true`, `TRUE`, `True` | `boolean` |
| `false`, `FALSE`, `False` | `boolean` |
| `yes`, `YES`, `y`, `Y` | `boolean` |
| `no`, `NO`, `n`, `N` | `boolean` |
| `1` | `string` (not boolean) |
| `on`, `off` | `string` (not standard) |

### Number Detection

**Pattern**: Integer or float regex

| Value | Inferred Type |
|-------|--------------|
| `123` | `number` |
| `-456` | `number` |
| `3.14` | `number` |
| `1.0.0` | `string` (multiple dots) |
| `123abc` | `string` (contains non-digits) |

**Validation**: Must be within `Number.MAX_SAFE_INTEGER` range

### Array Detection

**Pattern**: Contains comma delimiter

| Value | Inferred Type |
|-------|--------------|
| `a,b,c` | `string[]` |
| `1,2,3` | `number[]` |
| `true,false` | `boolean[]` |
| `1,hello,true` | `(string \| number \| boolean)[]` |
| `a,,b` | `string[]` (empty elements filtered) |
| `a` | `string` (single value, no array) |

**Requirements**:
- Minimum 2 non-empty elements after splitting
- Elements individually type-inferred
- Whitespace trimmed from each element

### Nesting Detection

**Pattern**: Common underscore-separated prefix

```env
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_SSL=true
```

**Result**:
```typescript
{
  database: {
    host: string;
    port: number;
    ssl: boolean;
  }
}
```

**Rules**:
- Minimum 2 variables with same prefix
- Split on underscore (`_`)
- Nested object created for common prefix
- camelCase field names in output

### Optional Field Detection

**Pattern**: Empty value

```env
REQUIRED=value
OPTIONAL=
```

**Result**:
```typescript
{
  required: string;
  optional?: string;
}
```

## Inference Mode Comparison

### Strict Mode (Default)

Infers specific types when patterns match:

```env
DEBUG=true       → debug: boolean
PORT=3000        → port: number
HOSTS=a,b        → hosts: string[]
NAME=value       → name: string
```

**Use when**: You want maximum type safety

### Loose Mode

Prefers string type for ambiguous values:

```env
DEBUG=true       → debug: string (could be literal "true")
PORT=3000        → port: string (could be string "3000")
HOSTS=a,b        → hosts: string (could be literal "a,b")
NAME=value       → name: string
```

**Use when**: .env values may be used as literal strings

## Examples

### Basic Usage

```bash
# Generate TypeScript interface
config-y-env .env -o config.types.ts

# Generate JSON Schema
config-y-env .env --to json-schema -o config.schema.json

# Generate Zod schema
config-y-env .env --to zod -o config.schema.ts
```

### Custom Interface Name

```bash
config-y-env .env --interface-name AppConfig -o types.ts
```

### Filter by Prefix

```bash
# Only process variables starting with APP_
config-y-env .env --prefix APP -o types.ts
```

### Exclude Fields

```bash
# Exclude sensitive fields
config-y-env .env --exclude SECRET,PASSWORD -o types.ts
```

### Loose Type Inference

```bash
# Prefer string types
config-y-env .env --inference-mode loose -o types.ts
```

### TypeScript with Zod

```bash
# Generate both interface and Zod schema
config-y-env .env --zod-schema -o config.ts
```

### Without Comments

```bash
config-y-env .env --no-comments -o types.ts
```

### Output to stdout

```bash
config-y-env .env
# Prints to console

# Redirect to file
config-y-env .env > types.ts
```

## Error Messages

### File Not Found

```
Error: Input file not found: .env

Make sure the file path is correct and the file exists.
Current directory: /home/user/project
```

### Parse Error

```
Error: Failed to parse .env file

Line 15: Invalid syntax
  PORT=3000=extra

Expected format: KEY=value (single = sign)
```

### Invalid .env Syntax

```
Error: Invalid .env syntax

Line 10: Missing value
  DATABASE_HOST

Expected format: KEY=value
```

## Programmatic API

```typescript
import { generateTypes } from 'config-y-env';

const result = await generateTypes({
  input: '.env',
  options: {
    outputFormat: 'typescript',
    interfaceName: 'Config',
    inferenceMode: 'strict',
    withComments: true,
    zodSchema: false
  }
});

console.log(result.content);
```

## Performance

**Target Performance**:
- Small files (<50 variables): <100ms
- Medium files (50-200 variables): <300ms
- Large files (200-1000 variables): <800ms
- Very large files (1000-10000 variables): <5000ms

**Memory Usage**:
- Typical: <30MB
- Large files: <100MB

## Compatibility

**Node.js**: 20.0.0 or later  
**Operating Systems**: Linux, macOS, Windows  
**.env Format**: Standard dotenv format

---

*Contract version: 1.0.0*
