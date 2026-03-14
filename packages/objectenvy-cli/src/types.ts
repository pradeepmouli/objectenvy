/**
 * Unified ObjectEnvy CLI - Consolidated types for all operations
 * @module types
 */

// ============================================================================
// ENV-Y-CONFIG TYPES (Schema → .env)
// ============================================================================

/**
 * Field type for environment variables
 */
export type FieldType = 'string' | 'number' | 'boolean' | 'array' | 'object';

/**
 * Supported input schema formats
 */
export type InputFormat = 'zod' | 'json-schema' | 'json' | 'typescript';

/**
 * Represents a single field in a schema definition
 */
export interface SchemaField {
  /** Field name (e.g., "database.host") */
  name: string;
  /** Field type */
  type: FieldType;
  /** Whether field is required */
  required: boolean;
  /** Field description for comments */
  description?: string;
  /** Default value if any */
  default?: string | number | boolean;
  /** Nested fields for objects */
  nested?: SchemaField[];
}

/**
 * Result of parsing any input schema format
 */
export interface ParsedSchema {
  /** All top-level and nested fields */
  fields: SchemaField[];
  /** Metadata about the source schema */
  metadata: {
    /** Original input format */
    format: InputFormat;
    /** Source file name */
    fileName: string;
    /** TypeScript export name (if applicable) */
    exportName?: string;
  };
}

/**
 * Configuration options for .env file generation
 */
export interface EnvGeneratorOptions {
  /** Prefix for all environment variable names */
  prefix?: string;
  /** Fields to include (whitelist) */
  include?: string[];
  /** Fields to exclude (blacklist) */
  exclude?: string[];
  /** Include field descriptions as comments */
  comments: boolean;
  /** Generate only required fields */
  requiredOnly: boolean;
}

/**
 * Single entry in generated .env file
 */
export interface EnvEntry {
  /** Environment variable key (e.g., "DATABASE_HOST") */
  key: string;
  /** Sample value */
  value: string;
  /** Comment line (field description) */
  comment?: string;
}

/**
 * Complete generated .env file
 */
export interface GeneratedEnv {
  /** All environment variable entries */
  entries: EnvEntry[];
  /** Formatted .env file content */
  content: string;
}

// ============================================================================
// CONFIG-Y-ENV TYPES (.env → TypeScript)
// ============================================================================

/**
 * Supported output formats for type generation
 */
export type OutputFormat = 'typescript' | 'json-schema' | 'javascript' | 'zod';

/**
 * Type inference strictness mode
 */
export type InferenceMode = 'strict' | 'loose';

/**
 * Single parsed environment variable with type inference
 */
export interface EnvVariable {
  /** Original key from .env (e.g., "DATABASE_HOST") */
  key: string;
  /** String value from .env */
  value: string;
  /** Inferred type */
  inferredType: FieldType;
  /** True if value is empty */
  isOptional: boolean;
}

/**
 * Result of parsing a .env file
 */
export interface ParsedEnv {
  /** All parsed environment variables */
  variables: EnvVariable[];
  /** Metadata about the source file */
  metadata: {
    /** Source .env file name */
    fileName: string;
    /** Total variables parsed */
    variableCount: number;
  };
}

/**
 * Configuration options for type/schema generation
 */
export interface TypeGeneratorOptions {
  /** Output format */
  format: OutputFormat;
  /** TypeScript interface name */
  interfaceName: string;
  /** Type inference mode */
  inferenceMode: InferenceMode;
  /** Variable name prefix for filtering */
  prefix?: string;
  /** Fields to exclude */
  exclude?: string[];
  /** Also generate Zod validation schema */
  zodSchema?: boolean;
  /** Include JSDoc comments */
  comments: boolean;
}

/**
 * Complete generated TypeScript output
 */
export interface GeneratedTypes {
  /** Generated code content */
  content: string;
  /** Generated Zod schema (if requested) */
  zodContent?: string;
}

// ============================================================================
// SHARED CONVERSION TYPES
// ============================================================================

/**
 * Conversion metrics for performance tracking
 */
export interface ConversionMetrics {
  /** Milliseconds to parse input */
  parseTime: number;
  /** Milliseconds to generate output */
  generationTime: number;
  /** Total execution time */
  totalTime: number;
  /** Input file size in bytes */
  inputSize: number;
  /** Output size in bytes */
  outputSize: number;
  /** Number of fields/variables processed */
  itemCount: number;
}

/**
 * Result of a schema → .env conversion
 */
export interface SchemaToEnvResult {
  /** Generated environment file */
  generated: GeneratedEnv;
  /** Performance metrics */
  metrics: ConversionMetrics;
}

/**
 * Result of a .env → types conversion
 */
export interface EnvToTypesResult {
  /** Generated types */
  generated: GeneratedTypes;
  /** Performance metrics */
  metrics: ConversionMetrics;
}
