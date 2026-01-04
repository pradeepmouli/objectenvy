# API Contract: env-y-config CLI Tool

**Tool**: env-y-config  
**Purpose**: Generate sample .env files from schema definitions  
**Version**: 1.0.0

## Command Line Interface

### Synopsis

```bash
env-y-config <input> [options]
```

### Arguments

#### `<input>` (Required)

Path to input schema file.

**Type**: String (file path)  
**Formats**: `.ts` (Zod/TypeScript), `.json` (JSON Schema/JSON)

### Options

#### `--from <format>`

Specify input format explicitly.

**Type**: Enum  
**Values**: `zod`, `json-schema`, `json`, `typescript`  
**Default**: Auto-detect from file extension  
**Example**: `--from zod`

#### `--type <name>`

TypeScript export name to use (required when input is TypeScript interface).

**Type**: String  
**Required**: When `--from typescript` or `.ts` file detected as interface  
**Example**: `--type AppConfig`

#### `-o, --output <path>`

Output file path. Use `-` for stdout.

**Type**: String (file path)  
**Default**: stdout (`-`)  
**Example**: `-o .env.sample`

#### `--prefix <string>`

Add prefix to all environment variable names.

**Type**: String  
**Default**: None  
**Example**: `--prefix APP` → `APP_DATABASE_HOST`

#### `--include <fields>`

Include only specified fields (comma-separated paths).

**Type**: String (comma-separated)  
**Default**: All fields  
**Example**: `--include database.host,database.port`

#### `--exclude <fields>`

Exclude specified fields (comma-separated paths).

**Type**: String (comma-separated)  
**Default**: None  
**Example**: `--exclude api.secret`

#### `--comments`

Include field descriptions as comments in .env file.

**Type**: Boolean  
**Default**: `true`  
**Flag**: Use `--no-comments` to disable

#### `--required-only`

Generate only required fields.

**Type**: Boolean  
**Default**: `false`  
**Example**: `--required-only`

#### `--help`, `-h`

Display help information.

#### `--version`, `-v`

Display tool version.

#### `--list-exports`

List available TypeScript exports in file (doesn't generate .env).

**Type**: Boolean  
**Example**: `--list-exports`

## Exit Codes

| Code | Meaning | Description |
|------|---------|-------------|
| 0 | Success | .env file generated successfully |
| 1 | File Not Found | Input file doesn't exist or not readable |
| 2 | Parse Error | Failed to parse input schema |
| 3 | Invalid Format | Unsupported input format or invalid format flag |
| 4 | Output Error | Cannot write to output file |
| 5 | Validation Error | Schema validation failed |

## Input Formats

### Zod Schema

**File Extension**: `.ts`  
**Detection**: Import/require of `zod` package

```typescript
import { z } from 'zod';

export const config = z.object({
  database: z.object({
    host: z.string().describe('Database host'),
    port: z.number().default(5432)
  })
});
```

**Requirements**:
- Must be valid TypeScript
- Must export a Zod schema object
- Can use `.describe()` for field descriptions
- Can use `.default()` for default values

### JSON Schema

**File Extension**: `.json`  
**Detection**: Presence of `$schema` field

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "properties": {
    "host": {
      "type": "string",
      "description": "Database host"
    },
    "port": {
      "type": "number",
      "default": 5432
    }
  },
  "required": ["host"]
}
```

**Requirements**:
- Must be valid JSON
- Must follow JSON Schema specification
- `type: "object"` at root level
- Uses `description` for comments
- Uses `required` array for required fields

### TypeScript Interface

**File Extension**: `.ts`  
**Detection**: No Zod import, contains interface/type declaration

```typescript
export interface Config {
  /** Database host */
  host: string;
  /** Database port */
  port: number;
}
```

**Requirements**:
- Must be valid TypeScript
- Must export interface or type
- Optional fields use `?:` syntax
- JSDoc comments used for descriptions
- Must specify export name with `--type` flag

### JSON Object

**File Extension**: `.json`  
**Detection**: No `$schema` field

```json
{
  "host": "localhost",
  "port": 5432,
  "debug": true
}
```

**Requirements**:
- Must be valid JSON
- Types inferred from values
- All fields treated as required

## Output Format

### .env File Structure

```env
# Comment line (if --comments enabled)
KEY=value

# Nested object: flattened with underscores
DATABASE_HOST=localhost
DATABASE_PORT=5432

# Array values: comma-separated
ALLOWED_HOSTS=localhost,example.com

# Boolean values
DEBUG=false

# Empty line between logical groups
```

### Naming Conventions

- All uppercase keys
- Underscores for nesting (`database.host` → `DATABASE_HOST`)
- camelCase converted to SCREAMING_SNAKE_CASE (`apiTimeout` → `API_TIMEOUT`)

### Sample Value Generation

Values generated based on field name patterns:

| Pattern | Sample Value |
|---------|--------------|
| `*secret*`, `*key*`, `*token*`, `*password*` | `<generate-your-secret-here>` |
| `*port*` | `5432` |
| `*host*`, `*url*` | `localhost` or `http://example.com` |
| `*email*` | `user@example.com` |
| `*path*`, `*dir*` | `/var/app/data` |
| `*enable*`, `*debug*` | `false` |
| `*timeout*`, `*ttl*` | `30` |
| Default string | `value` |
| Default number | `100` |
| Default boolean | `false` |

## Examples

### Basic Usage

```bash
# Generate from Zod schema
env-y-config schema.ts -o .env.sample

# Generate from JSON Schema
env-y-config config.schema.json -o .env

# Generate from TypeScript interface
env-y-config types.ts --type AppConfig -o .env
```

### With Prefix

```bash
env-y-config schema.ts --prefix APP -o .env
# Output: APP_DATABASE_HOST=localhost
```

### Filter Fields

```bash
# Include only specific fields
env-y-config schema.ts --include database.host,database.port -o .env

# Exclude sensitive fields
env-y-config schema.ts --exclude api.secret -o .env.example
```

### Required Fields Only

```bash
env-y-config schema.ts --required-only -o .env.required
```

### Without Comments

```bash
env-y-config schema.ts --no-comments -o .env
```

### Output to stdout

```bash
env-y-config schema.ts
# Prints to console

# Redirect to file
env-y-config schema.ts > .env
```

### List Available Exports

```bash
env-y-config types.ts --list-exports
# Output:
# Available exports:
#   - AppConfig (interface)
#   - DatabaseConfig (type)
#   - apiSchema (const)
```

## Error Messages

### File Not Found

```
Error: Input file not found: schema.ts

Make sure the file path is correct and the file exists.
Current directory: /home/user/project
```

### Parse Error

```
Error: Failed to parse Zod schema from schema.ts

Reason: Export 'Config' not found in file
Available exports: UserSchema, DatabaseConfig

Use --type flag to specify which export to use:
env-y-config schema.ts --type DatabaseConfig
```

### Invalid Format

```
Error: Unsupported input format: .yaml

Supported formats:
- Zod schemas (.ts files)
- JSON Schema (.json files with $schema field)
- TypeScript types (.ts files with --type flag)
- JSON objects (.json files)
```

### Output Error

```
Error: Cannot write to output file: /readonly/.env

Reason: Permission denied

Try:
- Check directory permissions
- Use a different output path with --output flag
```

## Programmatic API

While primarily a CLI tool, programmatic usage is supported:

```typescript
import { generateEnv } from 'env-y-config';

const result = await generateEnv({
  input: 'schema.ts',
  options: {
    prefix: 'APP',
    comments: true,
    requiredOnly: false
  }
});

console.log(result.content);
```

## Performance

**Target Performance**:
- Small schemas (<50 fields): <200ms
- Medium schemas (50-200 fields): <500ms
- Large schemas (200-1000 fields): <1000ms

**Memory Usage**:
- Typical: <50MB
- Large schemas: <100MB

## Compatibility

**Node.js**: 20.0.0 or later  
**Operating Systems**: Linux, macOS, Windows  
**TypeScript**: 5.0.0 or later (for TypeScript input)

---

*Contract version: 1.0.0*
