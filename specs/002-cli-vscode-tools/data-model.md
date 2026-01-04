# Data Model: CLI Tools & VS Code Extension

**Feature**: 002-cli-vscode-tools  
**Date**: 2026-01-04  
**Phase**: 1 - Design

## Overview

This document defines the data structures, interfaces, and type definitions for the CLI tools and VS Code extension.

## Core Data Types

### Shared Types

#### InputFormat

```typescript
type InputFormat = 'zod' | 'json-schema' | 'json' | 'typescript';
```

**Description**: Supported input schema formats for env-y-config tool.

**Values**:
- `zod`: Zod schema definitions (TypeScript)
- `json-schema`: JSON Schema specification
- `json`: Plain JSON object
- `typescript`: TypeScript interface/type definitions

#### OutputFormat

```typescript
type OutputFormat = 'typescript' | 'json-schema' | 'javascript' | 'zod';
```

**Description**: Supported output formats for config-y-env tool.

**Values**:
- `typescript`: TypeScript interfaces
- `json-schema`: JSON Schema specification
- `javascript`: JavaScript object literals
- `zod`: Zod validation schemas

#### FieldType

```typescript
type FieldType = 'string' | 'number' | 'boolean' | 'array' | 'object';
```

**Description**: Inferred or declared types for configuration fields.

#### InferenceMode

```typescript
type InferenceMode = 'strict' | 'loose';
```

**Description**: Type inference strictness mode.

**Values**:
- `strict`: Prefer specific types (boolean, number) when pattern matches
- `loose`: Prefer string type for ambiguous values

## env-y-config Data Structures

### SchemaField

```typescript
interface SchemaField {
  name: string;                    // Field name (e.g., "database.host")
  type: FieldType;                 // Field type
  required: boolean;               // Whether field is required
  description?: string;            // Field description for comments
  default?: string | number | boolean; // Default value if any
  nested?: SchemaField[];          // Nested fields for objects
}
```

**Description**: Represents a single field in a schema definition.

**Example**:
```typescript
{
  name: "database",
  type: "object",
  required: true,
  description: "Database configuration",
  nested: [
    {
      name: "host",
      type: "string",
      required: true,
      description: "Database host"
    },
    {
      name: "port",
      type: "number",
      required: true,
      default: 5432
    }
  ]
}
```

### ParsedSchema

```typescript
interface ParsedSchema {
  fields: SchemaField[];           // All top-level and nested fields
  metadata: {
    format: InputFormat;           // Original input format
    fileName: string;              // Source file name
    exportName?: string;           // TypeScript export name (if applicable)
  };
}
```

**Description**: Result of parsing any input schema format.

### EnvGeneratorOptions

```typescript
interface EnvGeneratorOptions {
  prefix?: string;                 // Prefix for all variables
  include?: string[];              // Fields to include (whitelist)
  exclude?: string[];              // Fields to exclude (blacklist)
  comments: boolean;               // Include field descriptions as comments
  requiredOnly: boolean;           // Generate only required fields
}
```

**Description**: Configuration options for .env file generation.

### EnvEntry

```typescript
interface EnvEntry {
  key: string;                     // Environment variable key (e.g., "DATABASE_HOST")
  value: string;                   // Sample value
  comment?: string;                // Comment line (field description)
}
```

**Description**: Single entry in generated .env file.

### GeneratedEnv

```typescript
interface GeneratedEnv {
  entries: EnvEntry[];             // All environment variables
  content: string;                 // Formatted .env file content
}
```

**Description**: Complete generated .env file.

**Example Output**:
```
# Database host
DATABASE_HOST=localhost

# Database port
DATABASE_PORT=5432

# Enable debug mode
DEBUG=false
```

## config-y-env Data Structures

### EnvVariable

```typescript
interface EnvVariable {
  key: string;                     // Original key (e.g., "DATABASE_HOST")
  value: string;                   // String value from .env
  inferredType: FieldType;         // Inferred type
  isOptional: boolean;             // True if value is empty
}
```

**Description**: Single parsed environment variable with type inference.

**Example**:
```typescript
{
  key: "DATABASE_PORT",
  value: "5432",
  inferredType: "number",
  isOptional: false
}
```

### ParsedEnv

```typescript
interface ParsedEnv {
  variables: EnvVariable[];        // All parsed variables
  metadata: {
    fileName: string;              // Source .env file name
    variableCount: number;         // Total variables parsed
  };
}
```

**Description**: Result of parsing a .env file.

### NestedStructure

```typescript
interface NestedStructure {
  [key: string]: NestedStructure | FieldInfo;
}

interface FieldInfo {
  type: FieldType;
  optional: boolean;
  arrayElementType?: FieldType;    // For array types
}
```

**Description**: Tree structure representing nested configuration objects.

**Example**:
```typescript
{
  "database": {
    "host": { type: "string", optional: false },
    "port": { type: "number", optional: false },
    "ssl": { type: "boolean", optional: true }
  },
  "api": {
    "timeout": { type: "number", optional: false }
  }
}
```

### TypeGeneratorOptions

```typescript
interface TypeGeneratorOptions {
  outputFormat: OutputFormat;      // Target format
  interfaceName: string;           // Name for generated interface (default: "Config")
  prefix?: string;                 // Filter by prefix
  exclude?: string[];              // Fields to exclude
  inferenceMode: InferenceMode;    // Type inference strictness
  withComments: boolean;           // Include JSDoc comments
  zodSchema: boolean;              // Also generate Zod schema (for TS output)
}
```

**Description**: Configuration options for type generation.

### GeneratedTypes

```typescript
interface GeneratedTypes {
  content: string;                 // Formatted output content
  format: OutputFormat;            // Output format used
  metadata: {
    fieldCount: number;            // Number of fields generated
    nestedLevels: number;          // Maximum nesting depth
  };
}
```

**Description**: Generated type definitions in specified format.

**Example (TypeScript)**:
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
    /** Enable SSL connection */
    ssl?: boolean;
  };
  api: {
    /** Request timeout in seconds */
    timeout: number;
  };
}
```

## VS Code Extension Data Structures

### ConversionCommand

```typescript
type ConversionCommand = 'generate-env' | 'generate-types' | 'quick-convert';
```

**Description**: Available VS Code commands.

### ConversionRequest

```typescript
interface ConversionRequest {
  command: ConversionCommand;
  sourceFile: string;              // Absolute path to source file
  options: EnvGeneratorOptions | TypeGeneratorOptions;
}
```

**Description**: Request to execute a conversion command.

### ConversionResult

```typescript
interface ConversionResult {
  success: boolean;
  output?: string;                 // Generated content
  error?: ConversionError;         // Error details if failed
  executionTime: number;           // Milliseconds
}
```

**Description**: Result of executing a conversion command.

### ConversionError

```typescript
interface ConversionError {
  code: ErrorCode;
  message: string;                 // User-friendly error message
  detail?: string;                 // Technical details
  suggestion?: string;             // Suggested fix
}

type ErrorCode = 
  | 'FILE_NOT_FOUND'
  | 'PARSE_ERROR'
  | 'INVALID_FORMAT'
  | 'OUTPUT_ERROR'
  | 'TOOL_NOT_INSTALLED'
  | 'EXECUTION_TIMEOUT';
```

**Description**: Structured error information.

### PreviewPanelState

```typescript
interface PreviewPanelState {
  visible: boolean;
  content: string;                 // Current preview content
  sourceFile: string;              // Source file being previewed
  outputFormat: OutputFormat | 'env'; // Current output format
  loading: boolean;                // True while conversion in progress
}
```

**Description**: State of the WebView preview panel.

### ExtensionSettings

```typescript
interface ExtensionSettings {
  envyconfig: {
    prefix?: string;               // Default prefix for conversions
    includeComments: boolean;      // Include comments in output (default: true)
    inferenceMode: InferenceMode;  // Default inference mode (default: 'strict')
    autoPreview: boolean;          // Auto-show preview on file open (default: false)
    cliToolPath?: string;          // Custom path to CLI tools (optional)
  };
}
```

**Description**: User-configurable extension settings.

## CLI Execution Models

### CLICommandResult

```typescript
interface CLICommandResult {
  exitCode: number;                // Process exit code
  stdout: string;                  // Standard output
  stderr: string;                  // Standard error
  executionTime: number;           // Milliseconds
}
```

**Description**: Result of executing a CLI tool command.

### CLIExecutor

```typescript
interface CLIExecutor {
  /**
   * Check if CLI tool is installed and accessible
   */
  checkInstalled(toolName: string): Promise<boolean>;
  
  /**
   * Execute CLI command with arguments
   */
  execute(
    toolName: string,
    args: string[],
    options?: { timeout?: number }
  ): Promise<CLICommandResult>;
  
  /**
   * Get version of installed CLI tool
   */
  getVersion(toolName: string): Promise<string>;
}
```

**Description**: Interface for executing CLI tools from VS Code extension.

## Type Inference Rules

### BooleanDetectionRule

```typescript
interface BooleanDetectionRule {
  pattern: RegExp;                 // /^(true|false|yes|no|y|n)$/i
  caseSensitive: boolean;          // false
}
```

**Rule**: Matches exact boolean-like strings (case-insensitive).

### NumberDetectionRule

```typescript
interface NumberDetectionRule {
  integerPattern: RegExp;          // /^-?\d+$/
  floatPattern: RegExp;            // /^-?\d+\.\d+$/
  maxSafeInteger: number;          // Number.MAX_SAFE_INTEGER
}
```

**Rule**: Matches integer or float patterns, validates range.

### ArrayDetectionRule

```typescript
interface ArrayDetectionRule {
  delimiter: string;               // ','
  minElements: number;             // 2 (to trigger array detection)
  trimElements: boolean;           // true
  filterEmpty: boolean;            // true
}
```

**Rule**: Detects comma-separated values, requires at least 2 non-empty elements.

### NestingDetectionRule

```typescript
interface NestingDetectionRule {
  delimiter: string;               // '_'
  minGroupSize: number;            // 2 (minimum variables to create nested object)
  prefixPattern: RegExp;           // /^([A-Z]+)_/
}
```

**Rule**: Groups variables by common prefix to create nested structures.

## Sample Value Generation Rules

### SampleValueRule

```typescript
interface SampleValueRule {
  pattern: RegExp;                 // Pattern to match field name
  generator: () => string;         // Function to generate sample value
  priority: number;                // Higher priority rules checked first
}
```

**Built-in Rules** (priority order):

1. **Secrets/Credentials** (priority: 100)
   - Pattern: `/(secret|key|token|password|credential)/i`
   - Value: `"<generate-your-secret-here>"`

2. **Ports** (priority: 90)
   - Pattern: `/port/i`
   - Value: `"5432"` (common database port)

3. **Hosts/URLs** (priority: 80)
   - Pattern: `/(host|url|endpoint)/i`
   - Value: `"localhost"` or `"http://example.com"`

4. **Emails** (priority: 70)
   - Pattern: `/email/i`
   - Value: `"user@example.com"`

5. **Paths** (priority: 60)
   - Pattern: `/(path|dir|directory)/i`
   - Value: `"/var/app/data"`

6. **Booleans** (priority: 50)
   - Pattern: `/(enable|enabled|debug|verbose)/i`
   - Value: `"false"` (safe default)

7. **Numbers** (priority: 40)
   - Pattern: `/(timeout|ttl|max|limit|count)/i`
   - Value: `"30"`

8. **Fallback** (priority: 0)
   - Pattern: `/.*/`
   - Value: Based on type (string: "value", number: "100", boolean: "false")

## File Format Specifications

### .env File Format

```
# Comments start with #
KEY=value
KEY_WITH_SPACES="value with spaces"
EMPTY_VALUE=
MULTILINE="line1\nline2"  # Escaped newlines
ARRAY_VALUE=item1,item2,item3

# Nested structure (flattened)
DATABASE_HOST=localhost
DATABASE_PORT=5432
```

**Rules**:
- One variable per line
- `KEY=value` format
- Comments use `#`
- Quotes optional (except for values with spaces)
- Empty values allowed
- No multiline values (must use escape sequences)

### TypeScript Interface Format

```typescript
export interface Config {
  key: string;
  keyWithSpaces: string;
  emptyValue?: string;
  multiline: string;
  arrayValue: string[];
  database: {
    host: string;
    port: number;
  };
}
```

**Rules**:
- camelCase field names
- Optional fields use `?:`
- Nested objects for grouped variables
- Array types for comma-separated values
- Export default interface

### JSON Schema Format

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "properties": {
    "key": { "type": "string" },
    "emptyValue": { "type": "string" },
    "arrayValue": {
      "type": "array",
      "items": { "type": "string" }
    },
    "database": {
      "type": "object",
      "properties": {
        "host": { "type": "string" },
        "port": { "type": "number" }
      },
      "required": ["host", "port"]
    }
  },
  "required": ["key", "arrayValue"]
}
```

### Zod Schema Format

```typescript
import { z } from 'zod';

export const configSchema = z.object({
  key: z.string(),
  emptyValue: z.string().optional(),
  arrayValue: z.array(z.string()),
  database: z.object({
    host: z.string(),
    port: z.number()
  })
});

export type Config = z.infer<typeof configSchema>;
```

## Data Flow Diagrams

### env-y-config Flow

```
Input Schema File
       ↓
Parse Schema (detect format, extract fields)
       ↓
ParsedSchema
       ↓
Apply Options (prefix, include/exclude, required-only)
       ↓
Filtered Fields
       ↓
Generate Sample Values (context-aware)
       ↓
Format as .env (add comments, flatten nesting)
       ↓
GeneratedEnv
       ↓
Write to File / Output to stdout
```

### config-y-env Flow

```
.env File
       ↓
Parse .env (extract key-value pairs)
       ↓
ParsedEnv
       ↓
Infer Types (apply detection rules)
       ↓
EnvVariable[] with types
       ↓
Detect Nesting (group by prefix)
       ↓
NestedStructure
       ↓
Generate Output (format-specific)
       ↓
GeneratedTypes
       ↓
Write to File / Output to stdout
```

### VS Code Extension Flow

```
User Action (command palette / context menu)
       ↓
ConversionRequest
       ↓
Validate Source File
       ↓
Check CLI Tools Installed
       ↓
Execute CLI Command
       ↓
CLICommandResult
       ↓
Parse Output / Handle Errors
       ↓
ConversionResult
       ↓
Display in WebView Preview
       ↓
User Actions (Create File / Copy)
```

## Error Handling Data

### Error Categories

```typescript
enum ErrorCategory {
  INPUT = 'INPUT',           // File not found, invalid format
  PARSE = 'PARSE',           // Syntax errors, invalid schema
  VALIDATION = 'VALIDATION', // Type errors, constraint violations
  OUTPUT = 'OUTPUT',         // Write errors, permission denied
  EXECUTION = 'EXECUTION'    // Tool not found, timeout
}
```

### DetailedError

```typescript
interface DetailedError {
  category: ErrorCategory;
  code: ErrorCode;
  message: string;           // User-friendly message
  detail?: string;           // Technical details
  file?: string;             // File where error occurred
  line?: number;             // Line number (if applicable)
  suggestion?: string;       // How to fix
  exitCode: number;          // CLI exit code
}
```

## Performance Metrics

### ConversionMetrics

```typescript
interface ConversionMetrics {
  parseTime: number;         // Milliseconds to parse input
  inferenceTime: number;     // Milliseconds for type inference
  generationTime: number;    // Milliseconds to generate output
  totalTime: number;         // Total execution time
  inputSize: number;         // Input file size in bytes
  outputSize: number;        // Output size in bytes
  fieldCount: number;        // Number of fields processed
}
```

**Target Performance**:
- Small files (<10KB): <1 second total
- Medium files (10-100KB): <2 seconds total
- Large files (100KB-1MB): <5 seconds total

---

*Data model complete - Ready for quickstart.md and contracts/*
