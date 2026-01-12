import type { z } from 'zod';

export type ConfigPrimitive = string | number | boolean;

export type ConfigObject = {
  [key: string]: ConfigValue;
};

export type ConfigArray = Array<ConfigPrimitive | ConfigObject>;

export type ConfigValue = ConfigPrimitive | ConfigObject | ConfigArray;

/**
 * Strategy for merging arrays when combining configuration objects
 * - 'replace': Replace the first array with the second (default)
 * - 'concat': Concatenate arrays together
 * - 'concat-unique': Concatenate and deduplicate based on primitive value equality
 */
export type ArrayMergeStrategy = 'replace' | 'concat' | 'concat-unique';

/**
 * Options for controlling merge behavior
 */
export interface MergeOptions {
  /**
   * Strategy for merging arrays
   * @default 'replace'
   */
  arrayMergeStrategy?: ArrayMergeStrategy;
}

// Schema can be either Zod or a plain object with the same structure as T
export type SchemaType<T> = z.ZodObject<any> | T;

export type EnvSource = Record<string, string | undefined>;

// Depth-limited schema type to prevent excessive type instantiation
type SchemaWithDepth<T, D extends number = 2> = D extends 0 ? any : z.ZodObject<any> | T;

export interface ObjectEnvyOptions<T = ConfigObject> {
  /**
   * Filter environment variables by prefix.
   * e.g., "APP" will only include variables starting with "APP_"
   */
  prefix?: string;

  /**
   * Custom environment object. Defaults to process.env
   */
  env?: EnvSource;

  /**
   * Schema for validation and type inference.
   * Can be either a Zod schema or a plain object with the same structure as your config.
   * Zod schemas will validate, plain objects provide type inference only.
   */
  schema?: T extends ConfigObject ? SchemaWithDepth<T> : never;

  /**
   * Whether to automatically coerce values to numbers/booleans
   * @default true
   */
  coerce?: boolean;

  /**
   * Delimiter used to indicate nesting depth.
   * By default, each underscore creates a new nesting level.
   * Set to '__' to use double underscores for nesting.
   * @default '_'
   */
  delimiter?: string;

  /**
   * Prefix segments that should not trigger nesting even when multiple entries share the prefix.
   * For example, keys starting with 'max', 'min', 'is', 'enable', 'disable' will stay flat:
   * MAX_CONNECTIONS, MAX_TIMEOUT -> { maxConnections, maxTimeout }
   * IS_DEBUG, IS_VERBOSE -> { isDebug, isVerbose }
   * @default ['max', 'min', 'is', 'enable', 'disable']
   */
  nonNestingPrefixes?: string[];
}
