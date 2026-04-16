import type { z } from 'zod';

export type EnviablePrimitive = string | number | boolean;

/**
 * Nested configuration object with string keys and recursively nested values.
 * Exported as `ConfigObject` — represents a parsed environment config tree.
 *
 * @remarks
 * This is the base structural type for all config objects produced by `objectify()`. Every key is a
 * string and every value is an `EnviableValue` (primitive, array, or nested `EnviableObject`).
 * Prefer using a Zod schema or a concrete TypeScript interface for application config; `EnviableObject`
 * is intentionally loose to accommodate the runtime-unknown shape of `process.env`.
 *
 * @example
 * import type { ConfigObject } from 'objectenvy';
 * const config: ConfigObject = { port: 3000, log: { level: 'debug' } };
 *
 * @category Type Utilities
 */
export type EnviableObject = {
  [key: string]: EnviableValue;
};

export type EnviableArray = Array<EnviablePrimitive | EnviableObject>;

/**
 * A single configuration value — either a primitive string/number/boolean,
 * an array of primitives/objects, or a nested `ConfigObject`.
 * Exported as `ConfigValue`.
 *
 * @remarks
 * This union type covers every value shape that `objectify()` can produce. When `coerce: true` (the
 * default), string values from `process.env` may become `number` or `boolean` at runtime. When
 * comma-separated, they become arrays. Deeply nested objects arise when multiple env keys share a
 * prefix (or when a schema mandates nesting).
 *
 * @example
 * import type { ConfigValue } from 'objectenvy';
 * const v: ConfigValue = 3000;                   // number
 * const v2: ConfigValue = true;                  // boolean
 * const v3: ConfigValue = 'debug';               // string
 * const v4: ConfigValue = ['a', 'b'];            // array
 * const v5: ConfigValue = { host: 'localhost' }; // nested object
 *
 * @category Type Utilities
 */
export type EnviableValue = EnviablePrimitive | EnviableObject | EnviableArray;

/**
 * Strategy for merging arrays when combining configuration objects via `merge()` or `override()`.
 *
 * @remarks
 * - `'replace'` — the second (higher-priority) array wholly replaces the first. This is the default
 *   and the safest choice when arrays are not additive (e.g., an allowed-hosts list you want to
 *   completely override).
 * - `'concat'` — the two arrays are concatenated: first-object elements followed by second-object
 *   elements. Duplicates are preserved.
 * - `'concat-unique'` — same as `'concat'` but duplicate primitive values are filtered out.
 *   Object items are compared via `JSON.stringify`; order-sensitive and unaware of `undefined`.
 *
 * @example
 * import { merge } from 'objectenvy';
 * import type { ArrayMergeStrategy } from 'objectenvy';
 * const strategy: ArrayMergeStrategy = 'concat-unique';
 * merge({ hosts: ['a', 'b'] }, { hosts: ['b', 'c'] }, { arrayMergeStrategy: strategy });
 * // { hosts: ['a', 'b', 'c'] }
 *
 * @category Type Utilities
 * @defaultValue `'replace'`
 */
export type ArrayMergeStrategy = 'replace' | 'concat' | 'concat-unique';

/**
 * Options for controlling the merge behaviour of `merge()` and `override()`.
 *
 * @config
 * @category Type Utilities
 * @see {@link merge}
 * @see {@link override}
 */
export interface MergeOptions {
  /**
   * Strategy to apply when both objects contain an array at the same key.
   *
   * - `'replace'` — the second (higher-priority) array replaces the first entirely.
   * - `'concat'` — arrays are concatenated, second array appended after the first.
   * - `'concat-unique'` — concatenated with duplicate primitive values removed.
   *
   * @defaultValue `'replace'`
   */
  arrayMergeStrategy?: ArrayMergeStrategy;
}

// Schema can be either Zod or a plain object with the same structure as T
export type SchemaType<T> = z.ZodObject<any> | T;

export type EnvLike = Record<string, string | undefined>;

// Depth-limited schema type to prevent excessive type instantiation
type SchemaWithDepth<T, D extends number = 2> = D extends 0 ? any : z.ZodObject<any> | T;

/**
 * Configuration options for `objectify()` — controls prefix filtering,
 * env source, Zod schema validation, camelCase nesting behaviour, and include/exclude patterns.
 *
 * @config
 *
 * @remarks
 * Pass an `ObjectEnvyOptions` object to `objectify()` to customise how environment variables are
 * parsed. All fields are optional; the defaults represent the most common use case (read
 * `process.env`, coerce values, use single-underscore nesting).
 *
 * When `schema` is provided, heuristic nesting is disabled — the schema structure governs nesting
 * exactly. Zod schemas additionally validate the output and throw `ZodError` on failure.
 *
 * @example
 * import { objectify } from 'objectenvy';
 * import { z } from 'zod';
 *
 * const config = objectify({
 *   prefix: 'APP',
 *   schema: z.object({ port: z.number(), debug: z.boolean() }),
 *   coerce: true,
 *   delimiter: '_',
 *   exclude: ['secret', 'password']
 * });
 *
 * @category Type Utilities
 * @see {@link objectify}
 */
export interface ObjectEnvyOptions<T = EnviableObject> {
  /**
   * Filter environment variables by prefix.
   * e.g., "APP" will only include variables starting with "APP_"
   */
  prefix?: string;

  /**
   * Custom environment object. Defaults to process.env
   */
  env?: EnvLike;

  /**
   * Schema for validation and type inference.
   * Can be either a Zod schema or a plain object with the same structure as your config.
   * Zod schemas will validate, plain objects provide type inference only.
   */
  schema?: T extends EnviableObject ? SchemaWithDepth<T> : never;

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

  /**
   * Include only environment variables matching these patterns.
   * Matches against the normalized key (after prefix removal, in camelCase).
   * If specified, only variables matching at least one pattern will be included.
   * @example ['database', 'port'] // Only DATABASE_*, PORT* variables
   */
  include?: string[];

  /**
   * Exclude environment variables matching these patterns.
   * Matches against the normalized key (after prefix removal, in camelCase).
   * Variables matching any pattern will be excluded.
   * @example ['secret', 'password'] // Exclude SECRET_*, PASSWORD_* variables
   */
  exclude?: string[];
}
