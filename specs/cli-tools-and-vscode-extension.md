# CLI Tools & VS Code Extension Specification

**Created**: January 3, 2026
**Status**: [x] Specification | [ ] In Progress | [ ] Complete
**Priority**: High

## Overview

Add two command-line tools and a VS Code extension to enhance the `envyconfig` ecosystem. These tools will provide bidirectional conversion between environment variable definitions and TypeScript types/schemas.

### Tools Overview

1. **`env-y-config`** CLI Tool
   - Convert schema definitions to sample `.env` files
   - Support input formats: Zod schemas, JSON schemas, JSON objects, TypeScript type definitions
   - Generate realistic sample values for different types

2. **`config-y-env`** CLI Tool
   - Extract .env file structure and generate TypeScript types/output
   - Support output formats: TypeScript types, JSON schemas, JavaScript objects
   - Smart type inference from environment variable names and values

3. **VS Code Extension**
   - Integrate both tools with IDE shortcuts and commands
   - Provide quick-pick UI for format selection
   - Real-time preview of conversions
   - File generation and editing capabilities

---

## Detailed Requirements

### 1. env-y-config CLI Tool

#### Purpose
Convert schema definitions to sample `.env` files with realistic values.

#### Command Syntax
```bash
env-y-config <input-path> [options]

env-y-config schema.zod -o .env.sample
env-y-config config.schema.json -o .env.example
env-y-config types.ts --type ConfigSchema -o .env.dev
```

#### Input Formats

**Zod Schema** (`--from zod`)
```typescript
// schema.zod.ts
import { z } from 'zod';

export const configSchema = z.object({
  database: z.object({
    host: z.string().describe('Database host'),
    port: z.number().default(5432),
    ssl: z.boolean().default(false),
  }),
  apiKeys: z.array(z.string()),
  logLevel: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
});
```

**JSON Schema** (`--from json-schema`)
```json
{
  "type": "object",
  "properties": {
    "database": {
      "type": "object",
      "properties": {
        "host": { "type": "string", "description": "Database host" },
        "port": { "type": "number", "default": 5432 },
        "ssl": { "type": "boolean", "default": false }
      }
    }
  }
}
```

**JSON Object** (`--from json`)
```json
{
  "database": {
    "host": "localhost",
    "port": 5432,
    "ssl": false
  },
  "apiKeys": ["key1", "key2"],
  "logLevel": "info"
}
```

**TypeScript Type/Interface** (`--from ts`)
```typescript
// config.types.ts
export interface Config {
  database: {
    host: string;
    port: number;
    ssl: boolean;
  };
  apiKeys: string[];
  logLevel: 'debug' | 'info' | 'warn' | 'error';
}
```

#### Output Generation Rules

| Input Type | Sample Value | ENV Variable |
|-----------|---|---|
| `string` | `"example"` or from description | `FIELD_NAME="example"` |
| `number` | `123` or from default | `FIELD_NAME=123` |
| `boolean` | `true` | `FIELD_NAME=true` |
| `enum/union` | First/default value | `FIELD_NAME=first_option` |
| `array` | Comma-separated values | `FIELD_NAME=value1,value2` |
| `object` | Nested structure | `PARENT_FIELD_NAME=value` |

#### Command Options

```bash
--from <format>          Input format: zod, json-schema, json, ts (default: auto-detect)
--type <name>            For TypeScript: export name to use
-o, --output <path>      Output file path (default: .env.sample)
--prefix <prefix>        Add prefix to all env vars (e.g., APP_)
--include <fields>       Only include specific fields (comma-separated)
--exclude <fields>       Exclude specific fields (comma-separated)
--sample-values          Generate realistic sample values (default: true)
--comments              Add descriptions as comments (default: true)
--required-only         Only output required fields (default: false)
-h, --help              Show help
```

#### Examples

```bash
# From Zod schema
env-y-config config.schema.ts -o .env.example

# From JSON Schema with prefix
env-y-config schema.json --prefix APP --output .env.prod

# From TypeScript interface
env-y-config types.ts --type AppConfig --from ts -o .env.test

# Generate required fields only
env-y-config schema.json --required-only -o .env.required
```

#### Output Example

```bash
# Generated from config schema
# Database connection settings
DATABASE_HOST="localhost"
DATABASE_PORT=5432
DATABASE_SSL=false

# API Configuration
API_KEYS="key1,key2,key3"
LOG_LEVEL="info"
```

---

### 2. config-y-env CLI Tool

#### Purpose
Extract .env file structure and generate TypeScript types/output.

#### Command Syntax
```bash
config-y-env <.env-file> [options]

config-y-env .env -o types.ts
config-y-env .env.example --to json-schema -o schema.json
config-y-env .env --to object -o config.js
```

#### Output Formats

**TypeScript Types** (`--to ts` | default)
```typescript
export interface Config {
  database: {
    host: string;
    port: number;
    ssl: boolean;
  };
  apiKeys: string[];
  logLevel: string;
}
```

**JSON Schema** (`--to json-schema`)
```json
{
  "type": "object",
  "properties": {
    "database": {
      "type": "object",
      "properties": {
        "host": { "type": "string" },
        "port": { "type": "number" },
        "ssl": { "type": "boolean" }
      }
    },
    "apiKeys": { "type": "array", "items": { "type": "string" } },
    "logLevel": { "type": "string" }
  }
}
```

**JavaScript Object** (`--to object`)
```javascript
export const config = {
  database: {
    host: 'string',
    port: 'number',
    ssl: 'boolean'
  },
  apiKeys: 'string[]',
  logLevel: 'string'
};
```

#### Smart Type Inference

| Pattern | Detected Type |
|---------|---|
| `KEY=true` or `KEY=false` | `boolean` |
| `KEY=123` | `number` |
| `KEY=1.5` | `number` |
| `KEY=value1,value2` | `string[]` (array) |
| `PARENT_CHILD=value` | `{ parent: { child: string } }` |
| `KEY=` (empty) | `string \| undefined` |

#### Command Options

```bash
--to <format>           Output format: ts (default), json-schema, object
-o, --output <path>     Output file path
--prefix <prefix>       Filter env vars by prefix
--exclude <fields>      Exclude specific fields
--interface-name <name> Name for exported interface (default: Config)
--zod-schema           Also generate Zod schema validation
--with-comments        Add JSDoc comments (default: true)
--strict              Strict type inference (default: true)
-h, --help            Show help
```

#### Type Inference Strictness

**Strict Mode** (default):
- Infers specific types: `string`, `number`, `boolean`, `string[]`
- Uses union types for mixed values

**Loose Mode** (`--strict=false`):
- All single values typed as `string`
- Detected arrays as `string[]`
- Useful when types are ambiguous

#### Examples

```bash
# Generate TypeScript types from .env
config-y-env .env -o src/types.ts

# Generate JSON Schema
config-y-env .env --to json-schema -o schemas/config.json

# Generate Zod schema
config-y-env .env --to ts --zod-schema -o src/schema.ts

# Filter by prefix
config-y-env .env --prefix APP -o src/appConfig.ts

# Generate JavaScript object for runtime
config-y-env .env --to object -o config.js
```

---

### 3. VS Code Extension

#### Extension ID
`envyconfig.tools`

#### Features

##### Command Palette Commands

1. **`EnvyConfig: Generate .env from Schema`**
   - Quick-pick input format (Zod, JSON Schema, JSON, TS)
   - File/text input selector
   - Real-time preview
   - Option to create `.env` file

2. **`EnvyConfig: Generate Types from .env`**
   - Quick-pick output format (TS, JSON Schema, JS Object, Zod)
   - Select .env file to analyze
   - Real-time preview of generated code
   - Option to create output file or paste to editor

3. **`EnvyConfig: Quick Convert`**
   - Smart detection of file type
   - One-click conversion with sensible defaults
   - Result in new editor tab

##### Context Menu Options

- **On `.env` files**: "Generate TypeScript Types", "Generate JSON Schema", "Preview Types"
- **On TypeScript files with `schema` in name**: "Generate .env Sample", "Preview .env"
- **On JSON files with `schema` in name**: "Generate .env Sample"

##### WebView Features

1. **Conversion Preview Panel**
   - Side-by-side source/result view
   - Real-time synchronization
   - Copy to clipboard button
   - Format selection dropdown

2. **Settings Panel**
   - Configure prefix for env vars
   - Select field inclusion/exclusion
   - Type inference strictness level

3. **Output Options**
   - Create new file
   - Insert into current editor
   - Copy to clipboard
   - Save to custom location

#### UI/UX Design

**Activation**:
- Runs on startup
- Activates on relevant file open (`.env`, TypeScript schema files)
- Quick activation via command palette

**Status Bar**:
- Quick access to last conversion
- File type indicator

**Output Channels**:
- "EnvyConfig Tools" channel for logs
- Error/warning reporting
- Operation summaries

#### Package Configuration

```json
{
  "name": "envyconfig-tools",
  "displayName": "EnvyConfig Tools",
  "description": "Generate .env files from schemas and TypeScript types from .env files",
  "version": "1.0.0",
  "publisher": "pradeepmouli",
  "engines": {
    "vscode": "^1.85.0"
  },
  "categories": ["Other", "Developer Tools"],
  "activationEvents": [
    "onLanguage:json",
    "onLanguage:typescript",
    "onLanguage:plaintext",
    "onCommand:envyconfig.generateEnvFromSchema",
    "onCommand:envyconfig.generateTypesFromEnv"
  ],
  "contributes": {
    "commands": [
      {
        "command": "envyconfig.generateEnvFromSchema",
        "title": "Generate .env from Schema"
      },
      {
        "command": "envyconfig.generateTypesFromEnv",
        "title": "Generate Types from .env"
      },
      {
        "command": "envyconfig.quickConvert",
        "title": "Quick Convert"
      }
    ],
    "menus": {
      "explorer/context": [
        {
          "command": "envyconfig.generateTypesFromEnv",
          "when": "resourceFilename == '.env' || resourceFilename =~ /\\.env\\..*/"
        },
        {
          "command": "envyconfig.generateEnvFromSchema",
          "when": "resourceFilename =~ /schema\\.(ts|json)$/"
        }
      ]
    }
  }
}
```

---

## Project Structure

```
packages/
├── cli-tools/
│   ├── src/
│   │   ├── commands/
│   │   │   ├── env-generate-from/
│   │   │   │   ├── index.ts
│   │   │   │   ├── handler.ts
│   │   │   │   ├── parsers/
│   │   │   │   │   ├── zodParser.ts
│   │   │   │   │   ├── jsonSchemaParser.ts
│   │   │   │   │   ├── jsonParser.ts
│   │   │   │   │   └── tsParser.ts
│   │   │   │   ├── generators/
│   │   │   │   │   ├── envGenerator.ts
│   │   │   │   │   └── sampleValueGenerator.ts
│   │   │   │   └── __tests__/
│   │   │   └── type-generate-from/
│   │   │       ├── index.ts
│   │   │       ├── handler.ts
│   │   │       ├── parser.ts
│   │   │       ├── generators/
│   │   │       │   ├── tsGenerator.ts
│   │   │       │   ├── jsonSchemaGenerator.ts
│   │   │       │   ├── objectGenerator.ts
│   │   │       │   └── zodGenerator.ts
│   │   │       └── __tests__/
│   │   ├── utils/
│   │   │   ├── envParser.ts
│   │   │   ├── typeInference.ts
│   │   │   └── formatting.ts
│   │   ├── index.ts
│   │   └── cli.ts
│   ├── bin/
│   │   ├── env-generate-from.js
│   │   └── type-generate-from.js
│   ├── package.json
│   └── tsconfig.json
│
├── vscode-extension/
│   ├── src/
│   │   ├── extension.ts
│   │   ├── commands/
│   │   │   ├── generateEnvFromSchema.ts
│   │   │   ├── generateTypesFromEnv.ts
│   │   │   └── quickConvert.ts
│   │   ├── providers/
│   │   │   ├── previewProvider.ts
│   │   │   └── settingsProvider.ts
│   │   ├── utils/
│   │   │   ├── fileHandler.ts
│   │   │   └── uiHelpers.ts
│   │   ├── views/
│   │   │   ├── webview.ts
│   │   │   └── media/
│   │   │       ├── style.css
│   │   │       └── script.js
│   │   └── __tests__/
│   ├── package.json
│   ├── extension.json (manifest)
│   └── tsconfig.json
│
└── shared/
    ├── src/
    │   ├── types.ts
    │   └── utilities.ts
    ├── package.json
    └── tsconfig.json

Root package.json:
- "workspaces": ["packages/*"]
```

---

## Implementation Phases

### Phase 1: Core CLI Tools (Week 1-2)
- [ ] Set up monorepo structure with pnpm workspaces
- [ ] Implement input parsers (Zod, JSON Schema, JSON, TS)
- [ ] Implement env-generate-from with sample generation
- [ ] Implement type-generate-from with type inference
- [ ] Add comprehensive unit tests
- [ ] Create CLI entry points with argument parsing

### Phase 2: Type Inference & Generators (Week 2-3)
- [ ] Implement smart type inference for .env files
- [ ] Add JSON Schema generation
- [ ] Add Zod schema generation
- [ ] Add TypeScript type generation with JSDoc
- [ ] Add JavaScript object generation
- [ ] Write integration tests

### Phase 3: VS Code Extension (Week 3-4)
- [ ] Set up extension project structure
- [ ] Implement command palette commands
- [ ] Create WebView preview panels
- [ ] Add context menu integration
- [ ] Implement file generation and editing
- [ ] Add status bar UI

### Phase 4: Polish & Documentation (Week 4)
- [ ] Write comprehensive README files
- [ ] Add examples for each feature
- [ ] Create demo GIFs/videos
- [ ] Publish to npm and VS Code Marketplace
- [ ] Add GitHub Actions workflows

---

## Technology Stack

- **CLI Tools**: TypeScript, Commander.js/yargs for CLI parsing
- **Type Analysis**: ts-morph for TypeScript parsing, JSON Schema parsing
- **Generators**: Template literals, custom serializers
- **VS Code Extension**: VS Code Extension API, React (optional for WebView)
- **Testing**: vitest for both packages
- **Build**: tsgo/tsc for compilation

---

## Success Criteria

### CLI Tools
- ✓ All input formats correctly parsed
- ✓ Generated .env files are valid and runnable with envyconfig
- ✓ Type inference accuracy >90%
- ✓ All commands work from terminal with standard options
- ✓ Comprehensive test coverage >85%

### VS Code Extension
- ✓ Quick-pick UI works smoothly
- ✓ Real-time preview functional
- ✓ File generation without errors
- ✓ Extension loads without errors
- ✓ Context menus appear on correct file types

### User Experience
- ✓ CLI commands are intuitive with clear help text
- ✓ Extension commands appear in command palette
- ✓ Clear error messages for invalid inputs
- ✓ Reasonable performance (<2s for typical operations)

---

## Dependencies to Add

### CLI Tools Package
```json
{
  "commander": "^11.x",
  "zod": "^4.x",
  "ts-morph": "^21.x",
  "tsx": "^4.x",
  "jsonschema": "^1.x"
}
```

### VS Code Extension Package
```json
{
  "vscode": "^1.85.0"
}
```

### Shared Package
```json
{
  "zod": "^4.x",
  "type-fest": "^5.x"
}
```

---

## Notes & Design Decisions

1. **Monorepo Structure**: Using pnpm workspaces for shared utilities between CLI and extension
2. **Type Inference**: Conservative approach preferring explicit types over guess work
3. **Sample Values**: Generate realistic but safe defaults (no actual credentials)
4. **Backward Compatibility**: All tools generate output compatible with existing envyconfig
5. **Extensibility**: Plugin architecture for custom input/output formats in future
