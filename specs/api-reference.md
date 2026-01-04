# API Reference & Architecture

**Created**: January 3, 2026
**Version**: 1.0.0 (Specification)

## Shared Types & Interfaces

### Core Types

```typescript
// packages/shared/src/types.ts

export type FieldType = 'string' | 'number' | 'boolean' | 'array' | 'enum' | 'object';

export interface FieldInfo {
  type: FieldType;
  description?: string;
  default?: unknown;
  required: boolean;
  enum?: string[];
  nestedFields?: Record<string, FieldInfo>;
  isArray?: boolean;
  arrayType?: FieldType; // for arrays
  example?: string;
}

export interface ParsedSchema {
  fields: Record<string, FieldInfo>;
  defaults: Record<string, unknown>;
  description?: string;
  isNested?: boolean;
}

export interface EnvObject {
  [key: string]: string | EnvObject | (string | number | boolean)[];
}
```

---

## env-generate-from API

### Parser Interface

```typescript
// packages/cli-tools/src/commands/env-generate-from/parsers/index.ts

export interface Parser {
  parse(input: string | Buffer | Record<string, unknown>): Promise<ParsedSchema>;
}

export async function createParser(format: InputFormat): Promise<Parser>;
```

### Input Formats

#### 1. Zod Parser

```typescript
import { z } from 'zod';

// Input: TypeScript file with exported Zod schema
export const configSchema = z.object({
  database: z.object({
    host: z.string().describe('Database host'),
    port: z.number().default(5432),
    ssl: z.boolean().default(false),
    maxConnections: z.number().optional(),
  }),
  apiKeys: z.array(z.string()).describe('API keys for services'),
  logLevel: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
});

// Expected ParsedSchema output:
{
  fields: {
    database: {
      type: 'object',
      nestedFields: {
        host: {
          type: 'string',
          description: 'Database host',
          required: true,
        },
        port: {
          type: 'number',
          default: 5432,
          required: false,
        },
        ssl: {
          type: 'boolean',
          default: false,
          required: false,
        },
        maxConnections: {
          type: 'number',
          required: false,
        },
      },
      required: true,
    },
    apiKeys: {
      type: 'array',
      arrayType: 'string',
      description: 'API keys for services',
      required: true,
    },
    logLevel: {
      type: 'enum',
      enum: ['debug', 'info', 'warn', 'error'],
      default: 'info',
      required: false,
    },
  },
  defaults: {
    database: {
      port: 5432,
      ssl: false,
    },
    logLevel: 'info',
  },
}
```

#### 2. JSON Schema Parser

```typescript
// Input: JSON Schema
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "properties": {
    "database": {
      "type": "object",
      "properties": {
        "host": {
          "type": "string",
          "description": "Database host"
        },
        "port": {
          "type": "integer",
          "default": 5432
        }
      },
      "required": ["host"]
    }
  },
  "required": ["database"]
}

// Produces similar ParsedSchema structure
```

#### 3. JSON Object Parser

```typescript
// Input: JSON object (treated as example config)
{
  "database": {
    "host": "localhost",
    "port": 5432,
    "ssl": false
  },
  "apiKeys": ["key1", "key2"],
  "logLevel": "info"
}

// Infers types from values and builds ParsedSchema
```

#### 4. TypeScript Type Parser

```typescript
// Input: TypeScript file with interface/type
export interface Config {
  database: {
    host: string;
    port: number;
    ssl: boolean;
  };
  apiKeys: string[];
  logLevel: 'debug' | 'info' | 'warn' | 'error';
}

// Extracts type information and builds ParsedSchema
```

### Generator Functions

```typescript
// packages/cli-tools/src/commands/env-generate-from/generators/envGenerator.ts

export interface EnvGeneratorOptions {
  prefix?: string;
  includeFields?: string[];
  excludeFields?: string[];
  withComments?: boolean;
  requiredOnly?: boolean;
}

export function generateEnv(
  schema: ParsedSchema,
  options?: EnvGeneratorOptions
): string;

// Example output:
// # Database connection
// DATABASE_HOST="localhost"
// DATABASE_PORT=5432
// DATABASE_SSL=true
//
// # API Configuration
// API_KEYS="key1,key2"
// LOG_LEVEL="info"
```

### Sample Value Generation

```typescript
// packages/cli-tools/src/commands/env-generate-from/generators/sampleValueGenerator.ts

export interface SampleValue {
  value: string;
  type: FieldType;
}

export function generateSampleValue(
  fieldInfo: FieldInfo,
  options?: {
    useDefaults?: boolean;
    includeExamples?: boolean;
  }
): SampleValue;

export function generateArraySample(
  arrayType: FieldType,
  count?: number
): string; // comma-separated values
```

### Main Handler

```typescript
// packages/cli-tools/src/commands/env-generate-from/handler.ts

export interface HandleEnvGenerateFromOptions {
  input: string;
  format?: InputFormat;
  typeName?: string;
  output?: string;
  prefix?: string;
  includeFields?: string[];
  excludeFields?: string[];
  withComments?: boolean;
  requiredOnly?: boolean;
}

export async function handleEnvGenerateFrom(
  options: HandleEnvGenerateFromOptions
): Promise<string>;
```

### CLI Usage

```bash
# Basic usage - auto-detect format
env-generate-from schema.ts

# Specify format
env-generate-from config.json --from json -o .env.example

# With options
env-generate-from types.ts \
  --from ts \
  --type AppConfig \
  --prefix APP \
  --output .env.prod \
  --required-only \
  --exclude internalFields

# Output to stdout
env-generate-from schema.zod > .env
```

---

## type-generate-from API

### ENV File Parser

```typescript
// packages/cli-tools/src/utils/envParser.ts

export interface ParsedEnvFile {
  variables: Record<string, string>;
  comments: Map<string, string>;
  order: string[];
}

export function parseEnvFile(content: string): ParsedEnvFile;
export function readEnvFile(filePath: string): Promise<ParsedEnvFile>;

// Example:
const env = parseEnvFile(`
  # Database settings
  DATABASE_HOST=localhost
  DATABASE_PORT=5432
  DATABASE_SSL=true

  # API Keys
  API_KEYS=key1,key2,key3
`);

// Result:
{
  variables: {
    DATABASE_HOST: 'localhost',
    DATABASE_PORT: '5432',
    DATABASE_SSL: 'true',
    API_KEYS: 'key1,key2,key3'
  },
  comments: {
    DATABASE_HOST: 'Database settings',
    API_KEYS: 'API Keys'
  },
  order: ['DATABASE_HOST', 'DATABASE_PORT', 'DATABASE_SSL', 'API_KEYS']
}
```

### Type Inference Engine

```typescript
// packages/cli-tools/src/utils/typeInference.ts

export interface TypeInferenceOptions {
  strict?: boolean; // default: true
  prefixFilter?: string;
  excludeFields?: string[];
}

export function inferType(value: string): FieldType;

export function inferTypes(
  envVars: Record<string, string>,
  options?: TypeInferenceOptions
): Record<string, FieldType>;

export function buildSchema(
  envVars: Record<string, string>,
  options?: TypeInferenceOptions
): ParsedSchema;

// Example inference:
inferType('localhost') // => 'string'
inferType('5432') // => 'number'
inferType('true') // => 'boolean'
inferType('key1,key2') // => 'array'
```

### Generators

#### TypeScript Generator

```typescript
// packages/cli-tools/src/commands/type-generate-from/generators/tsGenerator.ts

export interface TsGeneratorOptions {
  interfaceName?: string; // default: 'Config'
  withComments?: boolean;
  export?: boolean; // default: true
}

export function generateTypeScriptInterface(
  schema: ParsedSchema,
  options?: TsGeneratorOptions
): string;

// Example output:
/**
 * Application configuration from environment variables
 */
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

#### JSON Schema Generator

```typescript
// packages/cli-tools/src/commands/type-generate-from/generators/jsonSchemaGenerator.ts

export interface JsonSchemaGeneratorOptions {
  includeExamples?: boolean;
  includeDescriptions?: boolean;
}

export function generateJsonSchema(
  schema: ParsedSchema,
  options?: JsonSchemaGeneratorOptions
): Record<string, unknown>;

// Example output:
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "properties": {
    "database": {
      "type": "object",
      "properties": {
        "host": { "type": "string" },
        "port": { "type": "number" },
        "ssl": { "type": "boolean" }
      },
      "required": ["host", "port", "ssl"]
    }
  },
  "required": ["database"]
}
```

#### JavaScript Object Generator

```typescript
// packages/cli-tools/src/commands/type-generate-from/generators/objectGenerator.ts

export function generateObject(
  schema: ParsedSchema,
  options?: { export?: boolean }
): string;

// Example output:
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

#### Zod Schema Generator

```typescript
// packages/cli-tools/src/commands/type-generate-from/generators/zodGenerator.ts

export interface ZodGeneratorOptions {
  export?: boolean;
  schemaName?: string;
}

export function generateZodSchema(
  schema: ParsedSchema,
  options?: ZodGeneratorOptions
): string;

// Example output:
import { z } from 'zod';

export const configSchema = z.object({
  database: z.object({
    host: z.string(),
    port: z.number(),
    ssl: z.boolean(),
  }),
  apiKeys: z.array(z.string()),
  logLevel: z.enum(['debug', 'info', 'warn', 'error']),
});
```

### Main Handler

```typescript
// packages/cli-tools/src/commands/type-generate-from/handler.ts

export interface HandleTypeGenerateFromOptions {
  envFile: string;
  format?: OutputFormat;
  output?: string;
  prefixFilter?: string;
  excludeFields?: string[];
  interfaceName?: string;
  includeZodSchema?: boolean;
  strict?: boolean;
}

export async function handleTypeGenerateFrom(
  options: HandleTypeGenerateFromOptions
): Promise<string>;
```

### CLI Usage

```bash
# Generate TypeScript types
type-generate-from .env -o src/config.types.ts

# Generate JSON Schema
type-generate-from .env --to json-schema -o schema.json

# Generate Zod schema
type-generate-from .env --to ts --zod-schema -o src/schema.ts

# Filter by prefix
type-generate-from .env --prefix APP -o src/appConfig.ts

# Generate JavaScript object
type-generate-from .env --to object -o config.js

# Loose type inference
type-generate-from .env --strict=false
```

---

## VS Code Extension API

### Extension Interface

```typescript
// packages/vscode-extension/src/extension.ts

export function activate(context: vscode.ExtensionContext): void;
export function deactivate(): void;
```

### Commands

#### Generate Env From Schema

```typescript
// packages/vscode-extension/src/commands/generateEnvFromSchema.ts

export async function generateEnvFromSchema(): Promise<void>;

// Workflow:
// 1. Show quick-pick for input format
// 2. Show file picker or text input dialog
// 3. Parse input
// 4. Generate .env content
// 5. Show preview in webview
// 6. Option to save to file or insert into editor
```

#### Generate Types From Env

```typescript
// packages/vscode-extension/src/commands/generateTypesFromEnv.ts

export async function generateTypesFromEnv(): Promise<void>;

// Workflow:
// 1. Show quick-pick for output format
// 2. Show file picker for .env file
// 3. Parse .env
// 4. Infer types
// 5. Generate output
// 6. Show preview in webview
// 7. Option to save to file or insert into editor
```

#### Quick Convert

```typescript
// packages/vscode-extension/src/commands/quickConvert.ts

export async function quickConvert(): Promise<void>;

// Workflow:
// 1. Detect current file type
// 2. Auto-select conversion type
// 3. Run with default options
// 4. Open result in new editor tab
```

### WebView Provider

```typescript
// packages/vscode-extension/src/providers/previewProvider.ts

export class PreviewPanelProvider {
  static createOrShow(
    extensionPath: string,
    title: string,
    source: string,
    result: string
  ): void;

  dispose(): void;
}
```

### File Handler

```typescript
// packages/vscode-extension/src/utils/fileHandler.ts

export async function createFile(
  name: string,
  content: string
): Promise<vscode.Uri>;

export async function insertIntoEditor(content: string): Promise<void>;

export async function copyToClipboard(content: string): Promise<void>;
```

### UI Helpers

```typescript
// packages/vscode-extension/src/utils/uiHelpers.ts

export async function quickPickFormat(type: 'input' | 'output'): Promise<string>;

export async function pickFile(filters?: Record<string, string[]>): Promise<string>;

export async function showProgress<T>(
  title: string,
  task: () => Promise<T>
): Promise<T>;
```

---

## Integration Patterns

### Using CLI from Extension

```typescript
import { spawn } from 'child_process';

async function runCliTool(command: string, args: string[]): Promise<string> {
  return new Promise((resolve, reject) => {
    const proc = spawn(command, args);
    let output = '';

    proc.stdout.on('data', (data) => {
      output += data.toString();
    });

    proc.stderr.on('data', (data) => {
      // Log errors
    });

    proc.on('close', (code) => {
      if (code === 0) {
        resolve(output);
      } else {
        reject(new Error(`Process exited with code ${code}`));
      }
    });
  });
}
```

### Using CLI Libraries from VS Code

```typescript
// Import libraries directly instead of spawning
import { generateEnv } from '@envyconfig/cli-tools';
import { generateTypeScriptInterface } from '@envyconfig/cli-tools';

async function convertInEditor(content: string): Promise<string> {
  const schema = await parseInput(content);
  return generateEnv(schema);
}
```

---

## Error Handling

### Error Classes

```typescript
// packages/shared/src/errors.ts

export class ParsingError extends Error {
  constructor(format: string, message: string) {
    super(`Failed to parse ${format}: ${message}`);
    this.name = 'ParsingError';
  }
}

export class GenerationError extends Error {
  constructor(format: string, message: string) {
    super(`Failed to generate ${format}: ${message}`);
    this.name = 'GenerationError';
  }
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(`Validation failed: ${message}`);
    this.name = 'ValidationError';
  }
}
```

### Error Handling in CLI

```typescript
try {
  const result = await handleEnvGenerateFrom(options);
  console.log(result);
} catch (error) {
  if (error instanceof ParsingError) {
    console.error(`❌ ${error.message}`);
    process.exit(1);
  } else if (error instanceof ValidationError) {
    console.error(`⚠️ ${error.message}`);
    process.exit(1);
  } else {
    console.error('Unexpected error:', error);
    process.exit(1);
  }
}
```

---

## Performance Considerations

### Caching

- Cache parsed schemas to avoid re-parsing on repeated operations
- Cache type inference results for large .env files
- Clear cache when input changes

### Optimization

- Stream large files instead of loading entirely into memory
- Lazy-load parsers based on detected format
- Use workers for heavy parsing operations if needed

### Limits

- Warn if .env file exceeds 100KB
- Warn if schema has >100 fields
- Suggest performance improvements to user

---

## Testing Guidelines

### Unit Tests

```typescript
describe('envParser', () => {
  it('should parse basic env variables', () => {
    const content = 'KEY=value\nNUM=123';
    const result = parseEnvFile(content);
    expect(result.variables).toEqual({
      KEY: 'value',
      NUM: '123',
    });
  });
});

describe('typeInference', () => {
  it('should infer string type', () => {
    expect(inferType('hello')).toBe('string');
  });

  it('should infer number type', () => {
    expect(inferType('123')).toBe('number');
  });

  it('should infer array type from comma-separated', () => {
    expect(inferType('a,b,c')).toBe('array');
  });
});
```

### Integration Tests

```typescript
describe('end-to-end', () => {
  it('should convert Zod schema to valid .env', async () => {
    const schema = readFileSync('./test/fixtures/schema.ts');
    const env = await handleEnvGenerateFrom({
      input: schema,
      format: 'ts',
    });
    expect(env).toContain('DATABASE_HOST');
  });

  it('should generate valid TypeScript from .env', async () => {
    const envContent = 'DATABASE_HOST=localhost\nDATABASE_PORT=5432';
    const ts = await generateTypeScriptInterface(
      buildSchema(parseEnvFile(envContent))
    );
    expect(ts).toContain('interface Config');
    expect(ts).toContain('database: {');
  });
});
```

---

## Configuration & Settings

### Extension Settings

```json
{
  "envyconfig.prefix": {
    "type": "string",
    "default": "",
    "description": "Default prefix for environment variables"
  },
  "envyconfig.strictTypeInference": {
    "type": "boolean",
    "default": true,
    "description": "Use strict type inference from .env files"
  },
  "envyconfig.includeComments": {
    "type": "boolean",
    "default": true,
    "description": "Include descriptions as comments in generated files"
  },
  "envyconfig.defaultOutputFormat": {
    "type": "string",
    "enum": ["ts", "json-schema", "object", "zod"],
    "default": "ts",
    "description": "Default output format for type generation"
  }
}
```
