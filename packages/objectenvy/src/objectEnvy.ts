import type { z, ZodObject } from 'zod';
import type {
  EnvLike,
  ObjectEnvyOptions,
  EnviableObject,
  EnviableValue,
  MergeOptions
} from './types.js';
import { coerceValue, setNestedValue, toSnakeCase } from './utils.js';
import type { ToEnv, FromEnv } from './typeUtils.js';
import type { Merge } from 'type-fest';

/**
 * Merge two arrays using the specified strategy
 */
function mergeArrays(
  arr1: unknown[],
  arr2: unknown[],
  strategy: import('./types.js').ArrayMergeStrategy = 'replace',
  preferFirst: boolean = false
): unknown[] {
  if (strategy === 'concat') {
    return [...arr1, ...arr2];
  }

  if (strategy === 'concat-unique') {
    const result: unknown[] = [...arr1];
    const seen = new Set<unknown>();

    for (const item of arr1) {
      if (typeof item !== 'object' || item === null) {
        seen.add(item);
      }
    }

    for (const item of arr2) {
      if (typeof item !== 'object' || item === null) {
        if (!seen.has(item)) {
          result.push(item);
          seen.add(item);
        }
      } else {
        if (!result.some((existing) => JSON.stringify(existing) === JSON.stringify(item))) {
          result.push(item);
        }
      }
    }

    return result;
  }

  // 'replace' strategy (and default fallback)
  if (preferFirst) {
    return arr1.length > 0 ? arr1 : arr2;
  }
  return arr2;
}

interface ParsedEntry {
  key: string;
  segments: string[];
  value: string;
}

interface SchemaPath {
  path: string[];
  pathKey: string; // joined path for lookup, e.g., "log.level"
}

/**
 * Check if a field should be included based on include/exclude patterns
 */
function shouldIncludeField(
  normalizedKey: string,
  include?: string[],
  exclude?: string[]
): boolean {
  const lowerKey = normalizedKey.toLowerCase();

  // If include list is specified, key must match at least one pattern
  if (include && include.length > 0) {
    const matches = include.some((pattern) => lowerKey.includes(pattern.toLowerCase()));
    if (!matches) return false;
  }

  // If exclude list is specified, key must not match any pattern
  if (exclude && exclude.length > 0) {
    const matches = exclude.some((pattern) => lowerKey.includes(pattern.toLowerCase()));
    if (matches) return false;
  }

  return true;
}

/**
 * Strip prefix from key and return normalized key, or null if prefix doesn't match
 */
function stripPrefix(key: string, prefix?: string, delimiter = '_'): string | null {
  if (!prefix) return key;

  const prefixWithDelimiter = prefix.endsWith(delimiter) ? prefix : `${prefix}${delimiter}`;
  if (key.startsWith(prefixWithDelimiter)) {
    return key.slice(prefixWithDelimiter.length);
  }
  return null;
}

/**
 * Split a key into segments based on delimiter
 */
function splitKey(key: string, delimiter = '_'): string[] {
  if (delimiter === '_') {
    return key.split('_').filter((part) => part.length > 0);
  }

  // For custom delimiters like '__', split by that first
  return key.split(delimiter).filter((part) => part.length > 0);
}

/**
 * Convert segments to camelCase path for nesting
 */
function segmentsToCamelCasePath(segments: string[], delimiter = '_'): string[] {
  if (delimiter === '_') {
    return segments.map((s) => s.toLowerCase());
  }

  // For custom delimiters, each segment becomes camelCase
  return segments.map((segment) => segmentToCamelCase(segment));
}

/**
 * Convert a single segment (which may contain underscores) to camelCase
 */
function segmentToCamelCase(segment: string): string {
  return segment
    .toLowerCase()
    .split('_')
    .map((word, index) => (index === 0 ? word : word.charAt(0).toUpperCase() + word.slice(1)))
    .join('');
}

/**
 * Convert all segments to a single flat camelCase key
 */
function segmentsToFlatCamelCase(segments: string[], delimiter = '_'): string {
  if (delimiter === '_') {
    // For underscore delimiter, join all segments as camelCase
    return segments
      .map((s, index) => {
        const lower = s.toLowerCase();
        return index === 0 ? lower : lower.charAt(0).toUpperCase() + lower.slice(1);
      })
      .join('');
  }

  // For custom delimiters, convert each segment to camelCase first, then join
  const camelSegments = segments.map((segment) => segmentToCamelCase(segment));
  return camelSegments
    .map((s, index) => (index === 0 ? s : s.charAt(0).toUpperCase() + s.slice(1)))
    .join('');
}

/**
 * Extract all leaf paths from a Zod schema or plain object schema
 * Supports both Zod v3 (typeName) and Zod v4 (type) structures, as well as plain objects
 */
function extractSchemaPaths(schema: unknown, currentPath: string[] = []): SchemaPath[] {
  const paths: SchemaPath[] = [];

  if (!schema || typeof schema !== 'object') {
    return paths;
  }

  // Handle Zod schemas (both v3 and v4)
  if ('_def' in schema) {
    const def = (schema as { _def: Record<string, unknown> })._def;

    // Check for object type (Zod v4 uses 'type', Zod v3 uses 'typeName')
    const isObject = def['type'] === 'object' || def['typeName'] === 'ZodObject';

    if (isObject) {
      // Get shape - v4 stores it directly, v3 might have it as a function
      let shape: Record<string, unknown> | undefined;
      if (typeof def['shape'] === 'function') {
        shape = (def['shape'] as () => Record<string, unknown>)();
      } else if (def['shape'] && typeof def['shape'] === 'object') {
        shape = def['shape'] as Record<string, unknown>;
      }

      if (shape) {
        for (const [key, value] of Object.entries(shape)) {
          const newPath = [...currentPath, key];
          const nestedPaths = extractSchemaPaths(value, newPath);
          if (nestedPaths.length === 0) {
            // Leaf node
            paths.push({ path: newPath, pathKey: newPath.join('.') });
          } else {
            paths.push(...nestedPaths);
          }
        }
        return paths;
      }
    }

    // Handle wrapper types (ZodOptional, ZodDefault, ZodNullable)
    const typeName = def['typeName'] as string | undefined;
    const type = def['type'] as string | undefined;

    if (
      typeName === 'ZodOptional' ||
      typeName === 'ZodDefault' ||
      typeName === 'ZodNullable' ||
      type === 'optional' ||
      type === 'default' ||
      type === 'nullable'
    ) {
      if ('innerType' in def) {
        return extractSchemaPaths(def['innerType'], currentPath);
      }
    }

    // Leaf type (ZodString, ZodNumber, etc.) - return empty to indicate this is a leaf
    return [];
  }

  // Handle plain objects (for non-Zod schema-like objects)
  if (!Array.isArray(schema)) {
    for (const [key, value] of Object.entries(schema as Record<string, unknown>)) {
      if (key.startsWith('_') || key.startsWith('~')) continue; // Skip internal properties
      if (typeof value === 'function') continue; // Skip methods

      const newPath = [...currentPath, key];
      if (value && typeof value === 'object') {
        const nestedPaths = extractSchemaPaths(value, newPath);
        if (nestedPaths.length === 0) {
          paths.push({ path: newPath, pathKey: newPath.join('.') });
        } else {
          paths.push(...nestedPaths);
        }
      }
    }
  }

  return paths;
}

/**
 * Generate all possible path interpretations for segments
 * e.g., ['PORT', 'NUMBER'] -> [['portNumber'], ['port', 'number']]
 */
function generatePathInterpretations(segments: string[], delimiter = '_'): string[][] {
  const interpretations: string[][] = [];
  const n = segments.length;

  // Generate all possible ways to group consecutive segments
  // For n segments, we have 2^(n-1) ways to group them
  const numCombinations = 1 << (n - 1);

  for (let mask = 0; mask < numCombinations; mask++) {
    const path: string[] = [];
    let currentGroup: string[] = [segments[0]!];

    for (let i = 1; i < n; i++) {
      if (mask & (1 << (i - 1))) {
        // Start a new group
        path.push(segmentsToFlatCamelCase(currentGroup, delimiter));
        currentGroup = [segments[i]!];
      } else {
        // Continue current group
        currentGroup.push(segments[i]!);
      }
    }
    path.push(segmentsToFlatCamelCase(currentGroup, delimiter));
    interpretations.push(path);
  }

  return interpretations;
}

/**
 * Find the matching schema path for an env key's segments
 */
function findMatchingSchemaPath(
  segments: string[],
  schemaPaths: Map<string, string[]>,
  delimiter = '_'
): string[] | null {
  const interpretations = generatePathInterpretations(segments, delimiter);

  for (const interpretation of interpretations) {
    const pathKey = interpretation.join('.');
    if (schemaPaths.has(pathKey)) {
      return interpretation;
    }
  }

  return null;
}

/**
 * Build a nested configuration object from environment variables.
 * Only nests when multiple entries share a common prefix (when no schema provided).
 */
function buildConfig(
  env: NodeJS.ProcessEnv,
  options: Omit<ObjectEnvyOptions, 'schema'> = {}
): EnviableObject {
  const {
    prefix,
    coerce = true,
    delimiter = '_',
    nonNestingPrefixes = ['max', 'min', 'is', 'enable', 'disable'],
    include,
    exclude
  } = options;

  // First pass: parse all entries and group by first segment
  const entries: ParsedEntry[] = [];
  const firstSegmentCounts = new Map<string, number>();

  for (const [key, value] of Object.entries(env)) {
    if (value === undefined) continue;

    const normalizedKey = stripPrefix(key, prefix, delimiter);
    if (normalizedKey === null) continue;

    // Apply include/exclude filtering
    if (!shouldIncludeField(normalizedKey, include, exclude)) continue;

    const segments = splitKey(normalizedKey, delimiter);
    if (segments.length === 0) continue;

    const firstSegment = segments[0]!.toLowerCase();
    entries.push({ key: normalizedKey, segments, value });
    firstSegmentCounts.set(firstSegment, (firstSegmentCounts.get(firstSegment) ?? 0) + 1);
  }

  // Second pass: build config with smart nesting
  const result: EnviableObject = {};

  for (const entry of entries) {
    const firstSegment = entry.segments[0]!.toLowerCase();
    const count = firstSegmentCounts.get(firstSegment) ?? 0;
    const finalValue: EnviableValue = coerce ? coerceValue(entry.value) : entry.value;

    // Decide whether to nest based on count and non-nesting prefixes
    const shouldNest = count > 1 && !nonNestingPrefixes.includes(firstSegment);

    if (!shouldNest) {
      // Flatten to camelCase
      const camelKey = segmentsToFlatCamelCase(entry.segments, delimiter);
      result[camelKey] = finalValue;
    } else {
      // Nest under shared prefix
      const path = segmentsToCamelCasePath(entry.segments, delimiter);
      setNestedValue(result, path, finalValue);
    }
  }

  return result;
}

/**
 * Build a configuration object guided by schema structure
 */
function buildConfigWithSchema(
  env: NodeJS.ProcessEnv,
  schema: unknown,
  options: Omit<ObjectEnvyOptions, 'schema'> = {}
): EnviableObject {
  const { prefix, coerce = true, delimiter = '_', include, exclude } = options;

  // Extract all paths from schema
  const schemaPathList = extractSchemaPaths(schema);
  const schemaPaths = new Map<string, string[]>();
  for (const sp of schemaPathList) {
    schemaPaths.set(sp.pathKey, sp.path);
  }

  const result: EnviableObject = {};

  for (const [key, value] of Object.entries(env)) {
    if (value === undefined) continue;

    const normalizedKey = stripPrefix(key, prefix, delimiter);
    if (normalizedKey === null) continue;

    // Apply include/exclude filtering
    if (!shouldIncludeField(normalizedKey, include, exclude)) continue;

    const segments = splitKey(normalizedKey, delimiter);
    if (segments.length === 0) continue;

    const finalValue: EnviableValue = coerce ? coerceValue(value) : value;

    // Try to find a matching schema path
    const matchedPath = findMatchingSchemaPath(segments, schemaPaths, delimiter);

    if (matchedPath) {
      setNestedValue(result, matchedPath, finalValue);
    } else {
      // No schema match - fall back to flat camelCase
      const camelKey = segmentsToFlatCamelCase(segments, delimiter);
      result[camelKey] = finalValue;
    }
  }

  return result;
}

/**
 * Parse `process.env` (or a custom env object) into a strongly-typed, nested, camelCased config object.
 *
 * @remarks
 * Without a schema, nesting is determined heuristically: a prefix is nested only when two or more
 * environment variables share it. A single `PORT_NUMBER` key becomes `{ portNumber }` (flat); two
 * `LOG_LEVEL` + `LOG_PATH` keys become `{ log: { level, path } }` (nested). Segments in
 * `nonNestingPrefixes` (`max`, `min`, `is`, `enable`, `disable` by default) are always kept flat.
 *
 * When a Zod schema is provided, schema structure governs nesting — the heuristic is bypassed —
 * and the parsed output is validated against the schema. An invalid value throws a `ZodError`.
 *
 * String values are coerced to `number` or `boolean` unless `coerce: false` is set. Comma-separated
 * strings are parsed into arrays.
 *
 * @param options - Optional configuration controlling prefix, env source, schema, coercion, and nesting.
 * @returns A nested camelCased config object. Type is inferred from the Zod schema, or from the
 *   env source via `FromEnv`, or falls back to `EnviableObject`.
 *
 * @throws {ZodError} When a Zod schema is provided and the parsed config fails validation.
 *
 * @useWhen
 * - You need to turn raw `process.env` into a typed, nested config object at application startup.
 * - You have a Zod schema and want validated, fully-typed config in a single call.
 * - You want to scope config to one namespace using `prefix: 'APP'` and strip the prefix from keys.
 * - You use double-underscore env naming (`LOG__LEVEL`) and want `{ log: { level } }` nesting.
 *
 * @avoidWhen
 * - You need per-variable access with `.required()` / `.asInt()` semantics — use `env-var` instead.
 * - You already have a fully validated config object and just want to merge defaults — use `override()`.
 * - You need multiple env sources (files + remote secrets) — load them first, then pass as `env:`.
 *
 * @pitfalls
 * - NEVER rely on heuristic nesting for shared prefixes in production — BECAUSE adding a second
 *   `PORT_*` variable later silently restructures `{ portNumber }` into `{ port: { number } }`,
 *   breaking all downstream key accesses without a type error at the call site. Prefer a Zod schema.
 * - NEVER pass a non-`SCREAMING_SNAKE_CASE` env object when relying on `FromEnv` types — BECAUSE
 *   the type utility assumes keys are uppercase snake_case; mixed-case keys produce incorrect types.
 * - NEVER use `coerce: true` (the default) if a value looks like a number but must stay a string —
 *   BECAUSE `'01'` becomes `1` (integer parse), losing the leading zero.
 * - NEVER pass a mutable reference to the cached env when using `objectEnvy()` — BECAUSE the
 *   WeakMap cache key is the object reference; mutating `process.env` after caching returns stale data.
 *
 * @example
 * // Smart nesting — only nests when multiple entries share a prefix
 * // PORT_NUMBER=1234 LOG_LEVEL=debug LOG_PATH=/var/log
 * import { objectify } from 'objectenvy';
 * const config = objectify({ env: process.env });
 * // { portNumber: 1234, log: { level: 'debug', path: '/var/log' } }
 * // portNumber is flat (only one PORT_* entry); log is nested (multiple LOG_* entries)
 *
 * @example
 * // With prefix filtering
 * // APP_PORT=3000 APP_DEBUG=true OTHER_VAR=ignored
 * import { objectify } from 'objectenvy';
 * const config = objectify({ env: process.env, prefix: 'APP' });
 * // { port: 3000, debug: true }
 *
 * @example
 * // With Zod schema for validation and guaranteed structure
 * import { objectify } from 'objectenvy';
 * import { z } from 'zod';
 * const schema = z.object({
 *   portNumber: z.number(),
 *   log: z.object({
 *     level: z.enum(['debug', 'info', 'warn', 'error']),
 *     path: z.string()
 *   })
 * });
 * const config = objectify({ env: process.env, schema });
 * // Throws ZodError if PORT_NUMBER is missing or LOG_LEVEL is not a valid enum value
 *
 * @example
 * // Disable coercion to keep all values as strings
 * import { objectify } from 'objectenvy';
 * const config = objectify({ env: process.env, coerce: false });
 * // { port: '3000', debug: 'true' } — no type conversion applied
 *
 * @category Parsing
 * @see {@link objectEnvy} for a memoized factory wrapper
 * @see {@link envy} for the inverse operation (config → env)
 */
export function objectify<T extends EnviableObject>(): T;
export function objectify(
  options: Omit<ObjectEnvyOptions, 'schema' | 'env'> & { env?: undefined }
): EnviableObject;
export function objectify<E extends EnvLike>(
  options: Omit<ObjectEnvyOptions, 'schema'> & { env: E }
): FromEnv<E>;
export function objectify<T extends ZodObject>(
  options: ObjectEnvyOptions<z.infer<T>> & { schema: T }
): z.infer<T>;
export function objectify<T extends EnviableObject = EnviableObject>(
  options: ObjectEnvyOptions<T> = {}
): T | EnviableObject {
  const env = (options.env ?? process.env) as Record<string, string | undefined>;

  if (options.schema) {
    // Use schema-guided building when schema is provided
    const config = buildConfigWithSchema(env, options.schema, options);

    // If it's a Zod schema, validate and parse
    if ('_def' in options.schema) {
      return (options.schema as z.ZodObject<any>).parse(config) as T;
    }

    // For plain object schemas (type-fest), just return the config
    return config as T;
  }

  // Use smart nesting heuristic when no schema
  const config = buildConfig(env, options);
  return config as FromEnv<typeof env>;
}

/**
 * Create a memoized configuration loader with preset options, returning bound `objectify` and `envy` helpers.
 *
 * @remarks
 * `objectEnvy` acts as a factory: call it once at module load time with your default options (prefix,
 * schema, delimiter, etc.) and it returns a pair of functions. The inner `objectify` is memoized per
 * env-object reference and option-set combination, so repeated calls within the same process return
 * the same config instance without re-parsing. Pass `{ env: testEnv }` to the inner `objectify` to
 * override the env source for unit testing without polluting module-level state.
 *
 * @param defaultOptions - Default options applied to every inner `objectify()` call. Schema is fixed
 *   per instance; it cannot be overridden in the inner calls.
 * @returns An object with a memoized `objectify(overrides?)` and the `envy` converter.
 *
 * @useWhen
 * - You have a single canonical app-config module and want to read config exactly once per process lifecycle.
 * - You need to inject a different `env` object in tests while keeping the same schema and prefix.
 * - You want a named handle that bundles both directions of the round-trip (`objectify` + `envy`).
 *
 * @avoidWhen
 * - You need a fresh re-read on every call (e.g., dynamic secrets) — memoization will return stale data.
 * - You use different schemas in different parts of the app — create separate `objectEnvy` instances instead.
 *
 * @pitfalls
 * - NEVER mutate `process.env` after calling the inner `objectify()` expecting the result to update —
 *   BECAUSE results are cached by WeakMap keyed on the env object reference; the cached value is returned.
 * - NEVER share one `objectEnvy` instance across packages that need independent schemas — BECAUSE the
 *   schema is baked into the instance at creation time and cannot be changed per call.
 *
 * @example
 * // Module-level config singleton with Zod schema
 * import { objectEnvy } from 'objectenvy';
 * import { z } from 'zod';
 *
 * const schema = z.object({ port: z.number(), debug: z.boolean() });
 * const { objectify: loadConfig, envy: toEnv } = objectEnvy({ prefix: 'APP', schema });
 *
 * export const config = loadConfig();            // memoized; reads process.env once
 * export const rawEnv = toEnv(config);           // convert back to env format
 *
 * @example
 * // Override env for unit tests
 * import { objectEnvy } from 'objectenvy';
 * const { objectify } = objectEnvy({ prefix: 'APP' });
 * const testConfig = objectify({ env: { APP_PORT: '9000', APP_DEBUG: 'true' } });
 *
 * @category Parsing
 * @see {@link objectify} for the stateless version without memoization
 * @see {@link envy} for converting config objects back to env format
 */
export function objectEnvy(defaultOptions: Omit<ObjectEnvyOptions, 'schema'>): {
  objectify: (overrides?: Partial<Omit<ObjectEnvyOptions, 'schema'>>) => EnviableObject;
  envy: typeof envy;
};
export function objectEnvy<T extends EnviableObject>(
  defaultOptions: ObjectEnvyOptions<T> & { schema: z.ZodObject<any> | T }
): {
  objectify: (overrides?: Partial<Omit<ObjectEnvyOptions<T>, 'schema'>>) => T;
  envy: typeof envy;
};
export function objectEnvy<T extends EnviableObject = EnviableObject>(
  defaultOptions: ObjectEnvyOptions<T>
): {
  objectify: (overrides?: Partial<Omit<ObjectEnvyOptions<T>, 'schema'>>) => T | EnviableObject;
  envy: typeof envy;
} {
  // Create a memoization cache for this specific objectEnvy instance
  const cache = new WeakMap<NodeJS.ProcessEnv, Map<string, EnviableObject>>();

  const objectifyFn = (overrides: Partial<Omit<ObjectEnvyOptions<T>, 'schema'>> = {}) => {
    const mergedOptions = { ...defaultOptions, ...overrides };
    const env = mergedOptions.env ?? process.env;

    // Create cache key from all overridable options (schema is fixed per objectEnvy instance)
    const optionsKey = JSON.stringify({
      prefix: mergedOptions.prefix,
      coerce: mergedOptions.coerce ?? true,
      delimiter: mergedOptions.delimiter ?? '_',
      include: mergedOptions.include,
      exclude: mergedOptions.exclude,
      nonNestingPrefixes: mergedOptions.nonNestingPrefixes
    });

    // Check cache
    let envCache = cache.get(env);
    if (!envCache) {
      envCache = new Map<string, EnviableObject>();
      cache.set(env, envCache);
    }

    if (envCache.has(optionsKey)) {
      return envCache.get(optionsKey)! as T | EnviableObject;
    }

    // Compute result using objectify
    const result: EnviableObject = (
      'schema' in mergedOptions && mergedOptions.schema
        ? objectify<z.ZodObject<any>>({
            ...mergedOptions,
            schema: mergedOptions.schema
          } as ObjectEnvyOptions<EnviableObject> & { schema: z.ZodObject<any> } as any)
        : mergedOptions.env
          ? objectify({
              ...mergedOptions,
              env: mergedOptions.env
            } as ObjectEnvyOptions<EnviableObject> & { env: EnvLike })
          : objectify({
              prefix: mergedOptions.prefix,
              coerce: mergedOptions.coerce,
              delimiter: mergedOptions.delimiter
            })
    ) as EnviableObject;

    // Cache the result
    envCache.set(optionsKey, result);
    return result as T | EnviableObject;
  };

  return {
    objectify: objectifyFn,
    envy
  };
}

/**
 * Apply default values to a config object, filling in only the keys that are absent in `config`.
 *
 * @remarks
 * `override` is a one-directional merge: `config` wins. For every key in `defaults`, if `config`
 * already has a value for that key it is kept; otherwise the default is used. Nested objects are
 * traversed recursively so deeply-nested defaults are filled in without overwriting any key that
 * `config` sets at any depth.
 *
 * Array merging is controlled by `options.arrayMergeStrategy`:
 * - `'replace'` (default): the config array replaces the default array entirely.
 * - `'concat'`: config array followed by any remaining defaults array elements.
 * - `'concat-unique'`: same as concat but duplicate primitives are removed.
 *
 * @param defaults - The base values to fall back to for missing keys.
 * @param config - The user-supplied values; these always take precedence over `defaults`.
 * @param options - Merge options, including `arrayMergeStrategy`.
 * @returns A new object combining `config` (priority) with any keys absent from `config` filled from `defaults`.
 *
 * @useWhen
 * - You want to layer environment config on top of hard-coded application defaults.
 * - You have partial user-supplied configs and need safe fallback values for unset fields.
 * - You're building a plugin or middleware layer that injects sensible defaults without overriding user intent.
 *
 * @avoidWhen
 * - You need a symmetric deep merge where neither object has priority — use `merge()` instead.
 * - You need to merge more than two objects at once — chain multiple `override()` calls.
 *
 * @pitfalls
 * - NEVER mutate the `defaults` or `config` arguments after calling `override()` — BECAUSE the
 *   returned object is a shallow copy at each level; nested sub-objects are NOT deep-cloned, so
 *   mutations to deeply nested objects propagate back through the shared reference.
 * - NEVER rely on `override()` to handle class instances or special objects (Date, Map, Set) — BECAUSE
 *   the function checks `typeof === 'object'` and recurses, which may produce unexpected results for
 *   non-plain-object values.
 *
 * @example
 * import { objectify, override } from 'objectenvy';
 *
 * const defaults = { port: 3000, log: { level: 'info', path: '/var/log' } };
 * const envConfig = objectify({ env: process.env, prefix: 'APP' });
 * const config = override(defaults, envConfig);
 * // { port: 3000, log: { level: 'debug', path: '/var/log' } }
 * // env wins where it has values; defaults fill missing keys
 *
 * @example
 * // Append default tags when env provides its own list
 * import { override } from 'objectenvy';
 * const defaults = { tags: ['v1'] };
 * const config = { tags: ['prod'] };
 * const result = override(defaults, config, { arrayMergeStrategy: 'concat' });
 * // { tags: ['prod', 'v1'] }
 *
 * @category Merging
 * @see {@link merge} for a symmetric deep merge (neither object has priority)
 * @defaultValue `options.arrayMergeStrategy` defaults to `'replace'`
 */
export function override<T extends EnviableObject>(
  defaults: T,
  config: Partial<T>,
  options: MergeOptions = {}
): T {
  const { arrayMergeStrategy = 'replace' } = options;

  const result: any = { ...config };
  for (const [key, value] of Object.entries(defaults)) {
    if (result[key] === undefined) {
      result[key] = value;
    } else if (Array.isArray(value) && Array.isArray(result[key])) {
      // Both are arrays - use merge strategy (preferFirst=true: config array takes precedence)
      result[key] = mergeArrays(result[key], value, arrayMergeStrategy, true);
    } else if (
      value &&
      typeof value === 'object' &&
      !Array.isArray(value) &&
      result[key] &&
      typeof result[key] === 'object' &&
      !Array.isArray(result[key])
    ) {
      // Recursively apply defaults for nested objects
      result[key] = override(
        value as EnviableObject,
        result[key] as Partial<EnviableObject>,
        options
      );
    }
  }
  return result as T;
}

/**
 * Recursively merge two configuration objects, with `obj2` winning on conflicts.
 *
 * @remarks
 * `merge` performs a symmetric deep merge: for each key present in `obj2`, its value overwrites the
 * corresponding key in `obj1`. Nested objects are merged recursively. Arrays are handled according to
 * `options.arrayMergeStrategy`:
 * - `'replace'` (default): `obj2`'s array replaces `obj1`'s array.
 * - `'concat'`: arrays from `obj1` and `obj2` are joined (`obj1` first, then `obj2`).
 * - `'concat-unique'`: same as concat but duplicate primitive values are removed; object items are
 *   deduplicated by deep JSON equality.
 *
 * The return type is `Merge<T, U>` (from `type-fest`), which correctly models `obj2` keys shadowing
 * `obj1` keys at the type level.
 *
 * @param obj1 - The base configuration object.
 * @param obj2 - The second configuration object; its keys take precedence over `obj1`.
 * @param options - Merge options, including `arrayMergeStrategy`.
 * @returns A new object containing all keys from both inputs, with `obj2` values winning conflicts.
 *
 * @useWhen
 * - You need to combine two configuration objects where neither is the authoritative "defaults" — e.g.,
 *   merging a base config with a feature-flag overlay.
 * - You're composing multiple partial config slices loaded from different sources.
 * - You need array concatenation across config layers (`concat` or `concat-unique`).
 *
 * @avoidWhen
 * - You want one object to be authoritative "defaults" and the other to win — use `override()` instead.
 * - You need to merge more than two objects — chain `merge(merge(a, b), c)` calls.
 *
 * @pitfalls
 * - NEVER rely on `merge()` to deep-clone the inputs — BECAUSE nested sub-objects are shallow-copied
 *   at each level, so mutations to deeply nested objects in the result affect the originals.
 * - NEVER use `'concat-unique'` to deduplicate object items if equality matters beyond JSON serialisation —
 *   BECAUSE the implementation uses `JSON.stringify` for comparison, which is order-sensitive and ignores
 *   `undefined` values, `Date` objects, and prototype methods.
 * - NEVER assume `merge()` handles non-plain objects (Map, Set, Date, class instances) correctly —
 *   BECAUSE the function checks `typeof === 'object'` and recurses, producing incorrect results for
 *   these types.
 *
 * @example
 * // Deep merge with obj2 winning on shared keys
 * import { merge } from 'objectenvy';
 * const config1 = { port: 3000, log: { level: 'info' } };
 * const config2 = { log: { path: '/var/log' }, debug: true };
 * const merged = merge(config1, config2);
 * // { port: 3000, log: { level: 'info', path: '/var/log' }, debug: true }
 *
 * @example
 * // Concatenate arrays from two sources
 * import { merge } from 'objectenvy';
 * const config1 = { tags: ['prod', 'v1'] };
 * const config2 = { tags: ['api'] };
 * const merged = merge(config1, config2, { arrayMergeStrategy: 'concat' });
 * // { tags: ['prod', 'v1', 'api'] }
 *
 * @example
 * // Deduplicate while merging host lists
 * import { merge } from 'objectenvy';
 * const config1 = { hosts: ['localhost', 'example.com'] };
 * const config2 = { hosts: ['example.com', 'api.example.com'] };
 * const merged = merge(config1, config2, { arrayMergeStrategy: 'concat-unique' });
 * // { hosts: ['localhost', 'example.com', 'api.example.com'] }
 *
 * @category Merging
 * @see {@link override} for defaults-style merging where the second argument wins on missing keys only
 * @defaultValue `options.arrayMergeStrategy` defaults to `'replace'`
 */
export function merge<T extends EnviableObject, U extends EnviableObject>(
  obj1: T,
  obj2: U,
  options: MergeOptions = {}
): Merge<T, U> {
  const { arrayMergeStrategy = 'replace' } = options;

  const result: any = { ...obj1 };
  for (const [key, value] of Object.entries(obj2)) {
    if (Array.isArray(value) && Array.isArray(result[key])) {
      // Both are arrays - use merge strategy (preferFirst=false: obj2 takes precedence)
      result[key] = mergeArrays(result[key], value, arrayMergeStrategy, false);
    } else if (
      value &&
      typeof value === 'object' &&
      !Array.isArray(value) &&
      result[key] &&
      typeof result[key] === 'object' &&
      !Array.isArray(result[key])
    ) {
      // Both are objects - recursively merge
      result[key] = merge(result[key] as EnviableObject, value as EnviableObject, options);
    } else {
      // For all other cases (arrays with non-arrays, primitives, etc.), override
      result[key] = value;
    }
  }
  return result;
}

/**
 * Serialize a nested camelCased config object back to a flat `SCREAMING_SNAKE_CASE` env record.
 *
 * @remarks
 * `envy` is the inverse of `objectify`: it flattens a nested config tree by joining each key path
 * with underscores and uppercasing the result. All values are stringified — numbers and booleans
 * become their string representations. Arrays are serialized as comma-separated strings (e.g.,
 * `['a', 'b']` → `'a,b'`). Object items inside arrays are JSON-serialized before joining.
 *
 * The return type is `ToEnv<T>`, which preserves string literal and template literal types from the
 * config type all the way into the env record type.
 *
 * @param config - A nested camelCased configuration object.
 * @returns A flat `Record<string, string>` with `SCREAMING_SNAKE_CASE` keys and all values stringified.
 *
 * @useWhen
 * - You need to spawn a child process and want to pass typed config as env variables.
 * - You're writing a `.env` file from a config object (e.g., for CI scaffolding or test fixtures).
 * - You use `ToEnv<T>` for compile-time validation and need the runtime values to match.
 * - You're round-tripping: `objectify()` → mutate config → `envy()` → write back to env.
 *
 * @avoidWhen
 * - You only need the `ToEnv<T>` type at compile time — no need to call `envy()` at runtime.
 * - The config contains `Date`, `Map`, `Set`, or class instances — `envy()` serializes them as
 *   `[object Object]` via `String()`.
 *
 * @pitfalls
 * - NEVER rely on `envy()` to round-trip arrays of objects faithfully — BECAUSE object items are
 *   `JSON.stringify`-ed then joined; when `objectify()` re-reads the comma-separated string, it
 *   treats it as a string array, not an array of objects.
 * - NEVER pass `null` or `undefined` values in the config — BECAUSE `envy()` silently skips
 *   `null`/`undefined` entries, leaving no env key for them; the round-trip loses those fields.
 * - NEVER expect `envy()` to honour a prefix — BECAUSE it outputs bare `SCREAMING_SNAKE_CASE` keys
 *   with no prefix. Add the prefix yourself if your deployment expects `APP_PORT` rather than `PORT`.
 *
 * @example
 * import { envy } from 'objectenvy';
 *
 * const config = {
 *   portNumber: 3000,
 *   log: { level: 'debug', path: '/var/log' }
 * };
 * const env = envy(config);
 * // { PORT_NUMBER: '3000', LOG_LEVEL: 'debug', LOG_PATH: '/var/log' }
 *
 * @example
 * // Round-trip: objectify → mutate → envy
 * import { objectify, envy } from 'objectenvy';
 * const config = objectify({ env: process.env, prefix: 'APP' });
 * const mutated = { ...config, debug: true };
 * const newEnv = envy(mutated);
 * // spawn({ env: { ...process.env, ...newEnv } })
 *
 * @example
 * // Array values are joined as comma-separated strings
 * import { envy } from 'objectenvy';
 * const config = { hosts: ['localhost', 'example.com'] };
 * const env = envy(config);
 * // { HOSTS: 'localhost,example.com' }
 *
 * @category Serialization
 * @see {@link objectify} for the inverse operation (env → config)
 * @see {@link ToEnv} for the compile-time type utility
 */
export function envy<T extends EnviableObject>(config: T): ToEnv<T> {
  const env: Record<string, string> = {};

  function flatten(obj: EnviableValue, prefix = ''): void {
    if (obj === null || obj === undefined) {
      return;
    }

    if (Array.isArray(obj)) {
      // Convert arrays to comma-separated strings
      const stringValue = obj
        .map((item) => {
          if (typeof item === 'object') {
            return JSON.stringify(item);
          }
          return String(item);
        })
        .join(',');
      if (prefix) {
        env[prefix] = stringValue;
      }
      return;
    }

    if (typeof obj === 'object') {
      // Handle nested objects
      for (const [key, value] of Object.entries(obj)) {
        const screaming = toSnakeCase(key);
        const newPrefix = prefix ? `${prefix}_${screaming}` : screaming;
        flatten(value, newPrefix);
      }
      return;
    }

    // Handle primitives
    if (prefix) {
      env[prefix] = String(obj);
    }
  }

  flatten(config);
  return env as ToEnv<T>;
}
