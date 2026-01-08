/**
 * Type definitions for env-y-config CLI tool
 * @module types
 */

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
  /** Number of fields processed */
  fieldCount: number;
}

/**
 * Result of a conversion operation
 */
export interface ConversionResult {
  /** Generated environment file */
  generated: GeneratedEnv;
  /** Performance metrics */
  metrics: ConversionMetrics;
}
