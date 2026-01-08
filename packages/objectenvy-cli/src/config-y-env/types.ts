/**
 * Type definitions for config-y-env CLI tool
 * @module types
 */

/**
 * Field type for configuration
 */
export type FieldType = 'string' | 'number' | 'boolean' | 'array' | 'object';

/**
 * Supported output formats
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
 * Field information in nested structure
 */
export interface FieldInfo {
  /** Field type */
  type: FieldType;
  /** Whether field is optional */
  optional: boolean;
  /** Element type for arrays */
  arrayElementType?: FieldType;
}

/**
 * Tree structure representing nested configuration objects
 */
export interface NestedStructure {
  [key: string]: NestedStructure | FieldInfo;
}

/**
 * Configuration options for type generation
 */
export interface TypeGeneratorOptions {
  /** Target output format */
  outputFormat: OutputFormat;
  /** Name for generated interface */
  interfaceName: string;
  /** Filter by prefix */
  prefix?: string;
  /** Fields to exclude */
  exclude?: string[];
  /** Type inference strictness */
  inferenceMode: InferenceMode;
  /** Include JSDoc comments */
  withComments: boolean;
  /** Also generate Zod schema (for TS output) */
  zodSchema: boolean;
}

/**
 * Generated type definitions in specified format
 */
export interface GeneratedTypes {
  /** Formatted output content */
  content: string;
  /** Output format used */
  format: OutputFormat;
  /** Metadata about generation */
  metadata: {
    /** Number of fields generated */
    fieldCount: number;
    /** Maximum nesting depth */
    nestedLevels: number;
  };
}

/**
 * Conversion metrics for performance tracking
 */
export interface ConversionMetrics {
  /** Milliseconds to parse input */
  parseTime: number;
  /** Milliseconds for type inference */
  inferenceTime: number;
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
  /** Generated type definitions */
  generated: GeneratedTypes;
  /** Performance metrics */
  metrics: ConversionMetrics;
}
