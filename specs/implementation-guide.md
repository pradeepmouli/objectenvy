# CLI Tools & VS Code Extension - Implementation Guide

**Created**: January 3, 2026
**Target Version**: 1.0.0
**Status**: Implementation Guide

## Quick Start for Developers

### 1. Project Setup

Convert to monorepo structure:

```bash
# Create packages directory
mkdir -p packages/cli-tools packages/vscode-extension packages/shared

# Move existing code to a lib package (optional)
# or keep as root

# Update root package.json to use pnpm workspaces
```

### 2. Install Dependencies

```bash
pnpm install
pnpm --recursive install
```

### 3. Build All Packages

```bash
pnpm --recursive build
```

---

## Detailed Implementation Roadmap

### CLI Tools Implementation Order

#### 1. Input Format Parsers

**File**: `packages/cli-tools/src/commands/env-generate-from/parsers/`

**Zod Parser** (`zodParser.ts`)
- Parse `.ts` files with Zod schemas
- Extract schema object using ts-morph
- Convert Zod validators to type information
- Support for: `.default()`, `.describe()`, `.enum()`, `.array()`, `.optional()`

```typescript
import { Project } from 'ts-morph';
import type { z } from 'zod';

export interface ParsedSchema {
  fields: Record<string, FieldInfo>;
  defaults: Record<string, unknown>;
}

export interface FieldInfo {
  type: 'string' | 'number' | 'boolean' | 'array' | 'enum' | 'object';
  description?: string;
  default?: unknown;
  required: boolean;
  enum?: string[];
  nestedFields?: Record<string, FieldInfo>;
}

export async function parseZodSchema(
  filePath: string,
  schemaName: string
): Promise<ParsedSchema> {
  // Implementation
}
```

**JSON Schema Parser** (`jsonSchemaParser.ts`)
- Load and parse JSON Schema files
- Support JSON Schema Draft 7+
- Extract type information from schema properties

```typescript
export async function parseJsonSchema(
  filePath: string
): Promise<ParsedSchema> {
  // Load and parse JSON schema
  // Return normalized ParsedSchema
}
```

**JSON Parser** (`jsonParser.ts`)
- Load JSON files as sample configurations
- Infer types from values
- Support nested objects and arrays

```typescript
export async function parseJsonObject(
  filePath: string
): Promise<ParsedSchema> {
  // Load JSON, infer types from values
  // Return ParsedSchema with inferred structure
}
```

**TypeScript Type Parser** (`tsParser.ts`)
- Parse TypeScript interfaces/types
- Extract field types and optionality
- Support JSDoc comments as descriptions

```typescript
export async function parseTsType(
  filePath: string,
  typeName: string
): Promise<ParsedSchema> {
  // Use ts-morph to analyze TypeScript type
  // Extract field information from type definition
}
```

#### 2. Sample Value Generator

**File**: `packages/cli-tools/src/commands/env-generate-from/generators/sampleValueGenerator.ts`

Generate realistic sample values based on field type and metadata:

```typescript
export interface SampleGeneratorOptions {
  prefix?: string;
  useDescriptionsAsValues?: boolean;
}

export function generateSampleValue(
  fieldInfo: FieldInfo,
  options?: SampleGeneratorOptions
): string {
  switch (fieldInfo.type) {
    case 'string':
      return fieldInfo.description || 'example_value';
    case 'number':
      return fieldInfo.default?.toString() || '123';
    case 'boolean':
      return fieldInfo.default?.toString() || 'true';
    case 'enum':
      return fieldInfo.enum?.[0] || 'default';
    case 'array':
      return 'value1,value2,value3';
    case 'object':
      return JSON.stringify(fieldInfo.default || {});
    default:
      return '';
  }
}
```

#### 3. ENV Generator

**File**: `packages/cli-tools/src/commands/env-generate-from/generators/envGenerator.ts`

```typescript
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
): string {
  // Generate .env file format with:
  // - Comments with descriptions
  // - Formatted env variable names (SNAKE_CASE with prefix)
  // - Sample values for each field
  return '...';
}
```

#### 4. Type Generator (from .env)

**File**: `packages/cli-tools/src/commands/type-generate-from/generators/`

**TypeScript Generator** (`tsGenerator.ts`)
```typescript
export function generateTypeScriptInterface(
  envVars: Record<string, unknown>,
  options?: GeneratorOptions
): string {
  // Generate TypeScript interface from parsed env vars
  // Include JSDoc comments
  // Handle nested structures
}
```

**JSON Schema Generator** (`jsonSchemaGenerator.ts`)
```typescript
export function generateJsonSchema(
  envVars: Record<string, unknown>
): Record<string, unknown> {
  // Generate JSON Schema from env vars
  // Include type information
  // Handle required vs optional fields
}
```

**Zod Generator** (`zodGenerator.ts`)
```typescript
export function generateZodSchema(
  envVars: Record<string, unknown>
): string {
  // Generate Zod schema code
  // Include validations
  // Maintain compatibility with envyconfig
}
```

#### 5. Type Inference Engine

**File**: `packages/cli-tools/src/utils/typeInference.ts`

```typescript
export interface TypeInferenceOptions {
  strict?: boolean; // default: true
}

export function inferType(value: unknown): FieldType {
  if (typeof value === 'boolean') return 'boolean';
  if (typeof value === 'number') return 'number';
  if (Array.isArray(value)) return 'array';
  if (typeof value === 'string') {
    if (value.includes(',')) return 'array';
    if (value === 'true' || value === 'false') return 'boolean';
    if (!isNaN(Number(value))) return 'number';
  }
  return 'string';
}

export function inferSchema(
  envVars: Record<string, unknown>,
  options?: TypeInferenceOptions
): ParsedSchema {
  // Analyze env vars and build inferred schema
  // Detect nesting from key patterns (PARENT_CHILD_FIELD)
  // Infer types from values
}
```

#### 6. CLI Entry Points

**File**: `packages/cli-tools/src/cli.ts`

```typescript
import { program } from 'commander';

program
  .name('envyconfig-tools')
  .description('CLI tools for envyconfig schema and type generation')
  .version('1.0.0');

program
  .command('env-generate-from <input>')
  .description('Generate .env file from schema')
  .option('--from <format>', 'Input format (zod, json-schema, json, ts)')
  .option('--type <name>', 'TypeScript export name')
  .option('-o, --output <path>', 'Output file')
  .option('--prefix <prefix>', 'Env var prefix')
  .option('--include <fields>', 'Include fields')
  .option('--exclude <fields>', 'Exclude fields')
  .option('--comments', 'Include comments', true)
  .action(handleEnvGenerateFrom);

program
  .command('type-generate-from <envFile>')
  .description('Generate TypeScript types from .env file')
  .option('--to <format>', 'Output format (ts, json-schema, object, zod)')
  .option('-o, --output <path>', 'Output file')
  .option('--interface-name <name>', 'Interface name')
  .option('--prefix <prefix>', 'Filter by prefix')
  .option('--zod-schema', 'Also generate Zod schema')
  .option('--strict', 'Strict type inference', true)
  .action(handleTypeGenerateFrom);

program.parse(process.argv);
```

**Binary Files**: `packages/cli-tools/bin/`

```javascript
#!/usr/bin/env node
require('../dist/cli.js');
```

---

### VS Code Extension Implementation

#### 1. Extension Entry Point

**File**: `packages/vscode-extension/src/extension.ts`

```typescript
import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
  // Register command: Generate .env from Schema
  const generateEnv = vscode.commands.registerCommand(
    'envyconfig.generateEnvFromSchema',
    async () => {
      // Implementation
    }
  );

  // Register command: Generate Types from .env
  const generateTypes = vscode.commands.registerCommand(
    'envyconfig.generateTypesFromEnv',
    async () => {
      // Implementation
    }
  );

  // Register command: Quick Convert
  const quickConvert = vscode.commands.registerCommand(
    'envyconfig.quickConvert',
    async () => {
      // Implementation
    }
  );

  context.subscriptions.push(generateEnv, generateTypes, quickConvert);
}

export function deactivate() {}
```

#### 2. Command Implementations

**Generate .env from Schema**
1. Show quick-pick for input format
2. Let user select file or paste content
3. Parse input using appropriate parser
4. Generate .env content
5. Show preview in webview
6. Option to create file or insert into editor

**Generate Types from .env**
1. Auto-detect or show quick-pick for output format
2. Select .env file
3. Parse .env file
4. Infer types
5. Generate output in selected format
6. Show preview in webview
7. Option to create file or insert into editor

**Quick Convert**
1. Detect file type (based on extension/name)
2. Auto-select input/output format
3. Generate with defaults
4. Open result in new tab

#### 3. WebView Provider

**File**: `packages/vscode-extension/src/providers/previewProvider.ts`

```typescript
export class PreviewPanelProvider {
  private panel: vscode.WebviewPanel | undefined;

  constructor(private extensionPath: string) {}

  show(title: string, source: string, result: string) {
    if (!this.panel) {
      this.panel = vscode.window.createWebviewPanel(
        'envyconfigPreview',
        title,
        vscode.ViewColumn.Two,
        { enableScripts: true }
      );
    }

    this.panel.webview.html = this.getWebviewContent(source, result);
  }

  private getWebviewContent(source: string, result: string): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>Preview</title>
          <link rel="stylesheet" href="${this.getAssetUrl('style.css')}">
        </head>
        <body>
          <div class="container">
            <div class="panel">
              <h3>Source</h3>
              <pre>${escapeHtml(source)}</pre>
            </div>
            <div class="panel">
              <h3>Result</h3>
              <pre>${escapeHtml(result)}</pre>
              <button onclick="copyToClipboard()">Copy</button>
            </div>
          </div>
          <script src="${this.getAssetUrl('script.js')}"></script>
        </body>
      </html>
    `;
  }

  private getAssetUrl(name: string): string {
    // Return webview asset URL
  }
}
```

#### 4. Context Menu Integration

**File**: `packages/vscode-extension/package.json` (contributes section)

```json
{
  "contributes": {
    "commands": [
      {
        "command": "envyconfig.generateEnvFromSchema",
        "title": "EnvyConfig: Generate .env from Schema"
      },
      {
        "command": "envyconfig.generateTypesFromEnv",
        "title": "EnvyConfig: Generate Types from .env"
      },
      {
        "command": "envyconfig.quickConvert",
        "title": "EnvyConfig: Quick Convert"
      }
    ],
    "menus": {
      "explorer/context": [
        {
          "command": "envyconfig.generateTypesFromEnv",
          "when": "resourceFilename =~ /\\.env(\\..*)?$/",
          "group": "1_modification"
        },
        {
          "command": "envyconfig.generateEnvFromSchema",
          "when": "resourceFilename =~ /schema\\.(ts|json)$/",
          "group": "1_modification"
        }
      ],
      "editor/context": [
        {
          "command": "envyconfig.quickConvert",
          "when": "editorLangId == typescript || editorLangId == json",
          "group": "1_modification"
        }
      ]
    }
  }
}
```

---

## Testing Strategy

### CLI Tools Tests

**Structure**: `packages/cli-tools/src/commands/__tests__/`

```typescript
describe('env-generate-from', () => {
  describe('Zod parser', () => {
    it('should parse basic Zod schema', () => {
      // Test parsing of z.object() with various field types
    });
    it('should handle defaults and descriptions', () => {});
    it('should support nested schemas', () => {});
  });

  describe('Sample generation', () => {
    it('should generate realistic sample values', () => {});
    it('should respect descriptions', () => {});
  });

  describe('ENV generation', () => {
    it('should format env variables correctly', () => {});
    it('should apply prefix', () => {});
    it('should include comments', () => {});
  });
});

describe('type-generate-from', () => {
  describe('Type inference', () => {
    it('should infer string type', () => {});
    it('should infer number type', () => {});
    it('should infer boolean type', () => {});
    it('should infer array type from comma-separated', () => {});
  });

  describe('TypeScript generator', () => {
    it('should generate valid TypeScript interface', () => {});
    it('should include JSDoc comments', () => {});
  });

  describe('JSON Schema generator', () => {
    it('should generate valid JSON Schema', () => {});
  });

  describe('Zod generator', () => {
    it('should generate valid Zod schema', () => {});
  });
});
```

### VS Code Extension Tests

**Structure**: `packages/vscode-extension/src/__tests__/`

```typescript
describe('Extension commands', () => {
  it('should register all commands', () => {});
  it('should handle generate env from schema', () => {});
  it('should handle generate types from env', () => {});
  it('should handle quick convert', () => {});
});

describe('WebView provider', () => {
  it('should render preview panel', () => {});
  it('should handle copy to clipboard', () => {});
});
```

---

## Configuration Files

### Root package.json (add workspaces)

```json
{
  "workspaces": [
    "packages/cli-tools",
    "packages/vscode-extension",
    "packages/shared"
  ],
  "scripts": {
    "build": "pnpm --recursive build",
    "dev": "pnpm --recursive dev",
    "test": "pnpm --recursive test",
    "lint": "pnpm --recursive lint"
  }
}
```

### CLI Tools package.json

```json
{
  "name": "@envyconfig/cli-tools",
  "version": "1.0.0",
  "type": "module",
  "bin": {
    "env-generate-from": "./bin/env-generate-from.js",
    "type-generate-from": "./bin/type-generate-from.js"
  },
  "scripts": {
    "build": "tsgo -p tsconfig.json",
    "dev": "tsx watch src/cli.ts",
    "test": "vitest",
    "lint": "oxlint src"
  },
  "dependencies": {
    "commander": "^11.0.0",
    "zod": "^4.3.4",
    "ts-morph": "^21.0.0",
    "@envyconfig/shared": "workspace:*"
  },
  "devDependencies": {
    "tsx": "^4.21.0",
    "vitest": "^4.0.16"
  }
}
```

### VS Code Extension package.json

```json
{
  "name": "envyconfig-tools",
  "displayName": "EnvyConfig Tools",
  "description": "Generate .env files and TypeScript types",
  "version": "1.0.0",
  "publisher": "pradeepmouli",
  "engines": {
    "vscode": "^1.85.0"
  },
  "categories": ["Developer Tools"],
  "activationEvents": [
    "onLanguage:typescript",
    "onLanguage:json",
    "onCommand:envyconfig.generateEnvFromSchema"
  ],
  "main": "./dist/extension.js",
  "scripts": {
    "build": "tsgo -p tsconfig.json",
    "package": "vsce package",
    "publish": "vsce publish"
  },
  "dependencies": {
    "@envyconfig/cli-tools": "workspace:*"
  },
  "devDependencies": {
    "@types/vscode": "^1.85.0",
    "typescript": "^5.9.3"
  }
}
```

---

## Development Workflow

### Local Development

```bash
# Install all dependencies
pnpm install

# Run dev servers
pnpm dev

# Run tests
pnpm test

# Build everything
pnpm build

# Test CLI locally
./packages/cli-tools/bin/env-generate-from.js schema.ts -o .env

# Test extension locally
# Open VS Code, press F5 to launch extension in debug mode
```

### Debugging

**CLI Tools**:
```bash
# Add NODE_OPTIONS for debugging
NODE_OPTIONS=--inspect-brk pnpm --filter @envyconfig/cli-tools dev
```

**VS Code Extension**:
- Press F5 to launch in debug mode
- Set breakpoints in TypeScript files
- Output will appear in Debug Console

---

## Publishing & Distribution

### Publishing to npm

```bash
# Update versions
pnpm changeset

# Build all packages
pnpm build

# Publish
pnpm changeset publish
```

### Publishing VS Code Extension

```bash
# Package extension
pnpm --filter envyconfig-tools package

# Publish to marketplace
pnpm --filter envyconfig-tools publish
```

---

## Known Limitations & Future Enhancements

### Current Scope (v1.0)
- Basic input format support (Zod, JSON Schema, JSON, TS)
- Basic type inference from .env
- CLI tools and VS Code extension

### Future Enhancements (v1.1+)
- Support for custom types and advanced Zod validations
- Environment-specific .env file variants
- Validation rule generation
- Integration with existing projects
- Custom format plugins
- Export to other languages (Python, Go, etc.)
