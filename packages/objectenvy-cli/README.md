# objectenvy-cli

CLI tools for ObjectEnvy - Generate `.env` template files from TypeScript interfaces, types, or JSON schemas.

Uses ObjectEnvy's core conversion utilities (`toSnakeCase`) for consistent naming transformations.

## Features

- **TypeScript Support**: Parse TypeScript interfaces and type aliases
- **JSON Support**: Extract schema from JSON structure
- **Smart Sample Values**: Generates contextual placeholders based on field names
- **Flexible Output**: Write to file or stdout
- **Field Filtering**: Include or exclude specific fields
- **JSDoc Comments**: Preserve descriptions as comments in generated `.env` files
- **Consistent Conversions**: Uses ObjectEnvy's `toSnakeCase` utility for camelCase → SCREAMING_SNAKE_CASE transformation

## Installation

```bash
pnpm add -g objectenvy-cli
```

Or use with `npx`:

```bash
npx objectenvy-cli <input-file>
```

## Quick Start

### From TypeScript Interface

```typescript
// config.ts
export interface AppConfig {
  /** Database connection string */
  databaseUrl: string;

  /** Server port */
  port: number;

  /** Enable debug logging */
  debug: boolean;
}
```

Generate `.env` template:

```bash
objectenvy-cli config.ts -o .env.template
```

Output (`.env.template`):

```bash
# Database connection string
DATABASE_URL=<URL>

# Server port
PORT=5432

# Enable debug logging
DEBUG=true
```

### From JSON Schema

```json
{
  "databaseUrl": "",
  "port": 0,
  "debug": false
}
```

```bash
objectenvy-cli config.json -o .env.template
```

## Usage

```bash
objectenvy-cli <input> [options]
```

### Arguments

- `<input>` - Path to input file (TypeScript, JSON)

### Options

- `-o, --output <path>` - Output file path (default: stdout)
- `--from <format>` - Input format: `typescript`, `json` (auto-detected from extension)
- `--type <name>` - TypeScript export name to use (auto-detects first export if not specified)
- `--prefix <string>` - Prefix for environment variable names
- `--include <fields>` - Include only specified fields (comma-separated)
- `--exclude <fields>` - Exclude specified fields (comma-separated)
- `--comments` - Include comments from descriptions (default: true)
- `--no-comments` - Exclude comments
- `--required-only` - Generate only required fields
- `--list-exports` - List available TypeScript exports
- `-v, --version` - Display version
- `-h, --help` - Display help

## Examples

### List Available Exports

```bash
objectenvy-cli config.ts --list-exports
```

Output:
```
Available exports:
  - AppConfig (interface)
  - DatabaseConfig (type)
```

### Generate for Specific Export

```bash
objectenvy-cli config.ts --type DatabaseConfig -o .env.db
```

### Filter Fields

```bash
# Include only specific fields
objectenvy-cli config.ts --include databaseUrl,port -o .env.template

# Exclude sensitive fields
objectenvy-cli config.ts --exclude apiKey,secret -o .env.template
```

### Add Prefix

```bash
objectenvy-cli config.ts --prefix APP -o .env.template
```

Output:
```bash
APP_DATABASE_URL=<URL>
APP_PORT=5432
APP_DEBUG=true
```

### Required Fields Only

```bash
objectenvy-cli config.ts --required-only -o .env.required
```

### Output to Stdout

```bash
objectenvy-cli config.ts
```

## Smart Sample Values

The CLI generates contextual sample values based on field names:

| Field Pattern | Sample Value |
|---------------|--------------|
| `*url*`, `*uri*` | `<URL>` |
| `*password*`, `*pass*` | `<PASSWORD>` |
| `*token*` | `<TOKEN>` |
| `*secret*` | `<SECRET>` |
| `*key*` | `<KEY>` |
| `*host*` | `<HOST>` |
| `*port*` | `5432` |
| `*email*` | `<EMAIL>` |
| `*timeout*` | `30000` |
| `*limit*`, `*max*`, `*size*` | `100` |
| boolean | `true` |
| number | `42` |
| array | `<VALUE>,<VALUE>` |

## Supported Input Formats

### TypeScript

- Interfaces
- Type aliases
- Nested objects
- Optional fields (`?`)
- JSDoc comments
- Union types (treated as string)

### JSON

- Object structure
- Nested objects
- Arrays
- All JSON primitive types

## Future Enhancements

- JSON Schema support
- Zod schema extraction
- YAML output format
- Environment variable validation

## License

MIT
