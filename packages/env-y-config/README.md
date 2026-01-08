# env-y-config

Generate `.env` files from schema definitions (TypeScript, JSON, Zod, JSON Schema).

## Installation

```bash
npm install -g @envyconfig/env-y-config
```

## Quick Start

### From JSON

```bash
# Input: config.json
{
  "database": {
    "host": "localhost",
    "port": 5432
  },
  "api_key": "secret"
}

# Generate .env file
$ env-y-config config.json
DATABASE_HOST=<HOST>
DATABASE_PORT=5432
API_KEY=<KEY>
```

### From TypeScript

```bash
# Input: config.ts
export interface AppConfig {
  /** Database hostname */
  database_host: string;
  /** Database port */
  database_port: number;
}

# Generate .env with comments
$ env-y-config config.ts
# Database hostname
DATABASE_HOST=<HOST>

# Database port
DATABASE_PORT=5432
```

## Usage

```bash
env-y-config <input> [options]
```

### Arguments

- `<input>` - Path to schema file (JSON, TypeScript)

### Options

- `-o, --output <path>` - Output file path (default: stdout)
- `--from <format>` - Input format: `json`, `typescript`, `json-schema`, `zod`
- `--type <name>` - TypeScript export name (for multiple exports)
- `--prefix <string>` - Prefix for all environment variable names
- `--include <fields>` - Include only specified fields (comma-separated)
- `--exclude <fields>` - Exclude specified fields (comma-separated)
- `--comments` - Include comments from descriptions (default: true)
- `--no-comments` - Exclude comments
- `--required-only` - Generate only required fields
- `--list-exports` - List available TypeScript exports
- `-h, --help` - Display help
- `-v, --version` - Display version

## Examples

### Output to File

```bash
env-y-config config.json -o .env.example
```

### Add Prefix

```bash
env-y-config config.json --prefix APP
# Output:
# APP_DATABASE_HOST=<HOST>
# APP_API_KEY=<KEY>
```

### Filter Fields

```bash
# Include only database fields
env-y-config config.json --include database

# Exclude sensitive fields
env-y-config config.json --exclude password,secret,key
```

### List TypeScript Exports

```bash
env-y-config config.ts --list-exports
# Output:
# Available exports:
#   - AppConfig (interface)
#   - Settings (type)
```

### Specify TypeScript Export

```bash
env-y-config config.ts --type AppConfig
```

### Required Fields Only

```bash
env-y-config schema.json --required-only
```

## Features

### Smart Placeholder Generation

The tool generates semantic placeholders based on field names and descriptions:

- `database_host` → `<HOST>`
- `api_key` → `<KEY>`
- `database_port` → `5432`
- `timeout` → `30000`
- `debug` → `true`

### Nested Object Flattening

Automatically flattens nested structures:

```json
{
  "database": {
    "host": "localhost",
    "credentials": {
      "username": "admin",
      "password": "secret"
    }
  }
}
```

Generates:

```env
DATABASE_HOST=<HOST>
DATABASE_CREDENTIALS_USERNAME=<USERNAME>
DATABASE_CREDENTIALS_PASSWORD=<PASSWORD>
```

### Naming Collision Detection

Detects and reports conflicts when flattening:

```json
{
  "database_host": "localhost",
  "database": {
    "host": "localhost"
  }
}
```

Error: Both fields would become `DATABASE_HOST`

### TypeScript Integration

- Extracts JSDoc comments as field descriptions
- Supports interfaces and type aliases
- Handles union types, enums, and arrays
- Lists available exports in a file

### Atomic File Writes

Output files are written atomically to prevent data loss:

1. Validates output path
2. Writes to temporary file
3. Moves to final location
4. Cleans up on failure

## Supported Input Formats

### JSON (Available)

Plain JSON objects as schema templates:

```json
{
  "field1": "value",
  "field2": 123,
  "nested": {
    "field3": true
  }
}
```

### TypeScript (Available)

Interfaces and type aliases with JSDoc:

```typescript
/**
 * Application configuration
 */
export interface AppConfig {
  /** Server port */
  port: number;
  /** Enable debug mode */
  debug: boolean;
}
```

### Zod (Coming Soon)

Zod schema definitions:

```typescript
import { z } from 'zod';

export const config = z.object({
  port: z.number(),
  debug: z.boolean()
});
```

### JSON Schema (Coming Soon)

Standard JSON Schema format:

```json
{
  "type": "object",
  "properties": {
    "port": { "type": "number" },
    "debug": { "type": "boolean" }
  },
  "required": ["port"]
}
```

## Error Handling

The tool provides clear error messages:

- Invalid JSON syntax
- Missing TypeScript exports
- Naming collisions
- File I/O errors
- Unsupported formats

## Performance

- Parse + generate: <20ms for typical configs
- Memory efficient: Handles 1000+ field schemas
- Atomic writes: No partial files on failure

## Development

### Build

```bash
npm run build
```

### Test

```bash
npm test
```

### Lint

```bash
npm run lint
```

### Format

```bash
npm run format
```

## License

MIT

## Contributing

Contributions are welcome! Please see the main repository for guidelines.

## Related

- [config-y-env](../config-y-env) - Generate TypeScript types from `.env` files
- [objectenvy-vscode](../objectenvy-vscode) - VS Code extension

## Support

- 🐛 [Report issues](https://github.com/pradeepmouli/objectenvy/issues)
- 💬 [Discussions](https://github.com/pradeepmouli/objectenvy/discussions)
- 📖 [Documentation](https://github.com/pradeepmouli/objectenvy)
