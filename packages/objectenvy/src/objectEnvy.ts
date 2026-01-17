import type { z, ZodObject } from 'zod';
import type { EnvLike, ObjectEnvyOptions, EnviableObject, EnviableValue, MergeOptions } from './types.js';
import { coerceValue, setNestedValue } from './utils.js';
import type { ToEnv, FromEnv } from './typeUtils.js';
import type { Merge } from 'type-fest';

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
        path.push(groupToCamelCase(currentGroup, delimiter));
        currentGroup = [segments[i]!];
      } else {
        // Continue current group
        currentGroup.push(segments[i]!);
      }
    }
    path.push(groupToCamelCase(currentGroup, delimiter));
    interpretations.push(path);
  }

  return interpretations;
}

/**
 * Convert a group of segments to camelCase
 */
function groupToCamelCase(group: string[], delimiter = '_'): string {
  if (delimiter === '_') {
    return group
      .map((s, index) => {
        const lower = s.toLowerCase();
        return index === 0 ? lower : lower.charAt(0).toUpperCase() + lower.slice(1);
      })
      .join('');
  }

  // For custom delimiters
  return group
    .map((segment) => segmentToCamelCase(segment))
    .map((s, index) => (index === 0 ? s : s.charAt(0).toUpperCase() + s.slice(1)))
    .join('');
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
 * Create a typed configuration object from environment variables.
 * Automatically nests only when multiple entries share a common prefix.
 *
 * @example
 * // Smart nesting - only nests when multiple entries share a prefix
 * // PORT_NUMBER=1234 LOG_LEVEL=debug LOG_PATH=/var/log
 * const config = objectify();
 * // Returns: { portNumber: 1234, log: { level: 'debug', path: '/var/log' } }
 * // Note: portNumber is flat (only one PORT_* entry), log is nested (multiple LOG_* entries)
 *
 * @example
 * // With prefix filtering
 * // APP_PORT=3000 APP_DEBUG=true OTHER_VAR=ignored
 * const config = objectify({ prefix: 'APP' });
 * // Returns: { port: 3000, debug: true }
 *
 * @example
 * // With Zod schema for validation and type safety
 * const schema = z.object({
 *   portNumber: z.number(),
 *   log: z.object({
 *     level: z.enum(['debug', 'info', 'warn', 'error']),
 *     path: z.string()
 *   })
 * });
 * const config = objectify({ schema });
 * // Returns typed config with validation
 *
 * @example
 * // With type-fest Schema (plain object) for type safety without validation
 * const schema = {
 *   portNumber: 0,
 *   log: {
 *     level: '',
 *     path: ''
 *   }
 * } as const;
 * const config = objectify({ schema });
 * // Returns typed config without validation
 */
export function objectify<T extends EnviableObject>(): T;
export function objectify(
  options: Omit<ObjectEnvyOptions, 'schema' | 'env'> & { env?: undefined }
): EnviableObject;
export function objectify<E extends EnvLike>(
  options: Omit<ObjectEnvyOptions, 'schema'> & { env: E }
): FromEnv<E>;
export function objectify<T extends ZodObject>(
  options: ObjectEnvyOptions<z.infer<T>> & { schema: T}
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
 * Create a configuration loader with preset options.
 * Returns both objectify and envy functions with memoization.
 *
 * @example
 * const { objectify: loadConfig, envy: toEnv } = objectEnvy({
 *   prefix: 'APP',
 *   schema: appConfigSchema
 * });
 *
 * const config = loadConfig(); // Uses preset options with caching
 * const testConfig = loadConfig({ env: testEnv }); // Override env for testing
 * const env = toEnv(config); // Convert config back to env format
 */
export function objectEnvy(
  defaultOptions: Omit<ObjectEnvyOptions, 'schema'>
): {
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

    // Create cache key from options
    const optionsKey = JSON.stringify({
      prefix: mergedOptions.prefix,
      coerce: mergedOptions.coerce ?? true,
      delimiter: mergedOptions.delimiter ?? '_',
      schema: mergedOptions.schema ? JSON.stringify(mergedOptions.schema) : undefined
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
    const result: EnviableObject = ('schema' in mergedOptions && mergedOptions.schema
      ? objectify<z.ZodObject<any>>({ ...mergedOptions, schema: mergedOptions.schema } as ObjectEnvyOptions<EnviableObject> & { schema: z.ZodObject<any> } as any)
      : mergedOptions.env
        ? objectify({ ...mergedOptions, env: mergedOptions.env } as ObjectEnvyOptions<EnviableObject> & { env: EnvLike })
        : objectify({ prefix: mergedOptions.prefix, coerce: mergedOptions.coerce, delimiter: mergedOptions.delimiter })) as EnviableObject;

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
 * Recursively override default values with a config object with smart array handling
 * @param defaults The default values to start with
 * @param config The configuration object to override defaults
 * @param options Merge options including array merge strategy
 * @returns The defaults with config overrides applied
 *
 * @example
 * const defaults = { port: 3000, log: { level: 'info', path: '/var/log' } };
 * const config = { log: { level: 'debug' } };
 * const finalConfig = override(defaults, config);
 * // finalConfig = { port: 3000, log: { level: 'debug', path: '/var/log' } }
 *
 * @example
 * // Concatenate arrays instead of replacing
 * const defaults = { port: 3000, tags: ['v1'] };
 * const config = { tags: ['prod'] };
 * const finalConfig = override(defaults, config, { arrayMergeStrategy: 'concat' });
 * // finalConfig = { port: 3000, tags: ['prod', 'v1'] }
 */
export function override<T extends EnviableObject>(
  defaults: T,
  config: Partial<T>,
  options: MergeOptions = {}
): T {
  const { arrayMergeStrategy = 'replace' } = options;

  function mergeArrays(arr1: unknown[], arr2: unknown[]): unknown[] {
    if (arrayMergeStrategy === 'replace') {
      return arr1.length > 0 ? arr1 : arr2;
    }

    if (arrayMergeStrategy === 'concat') {
      return [...arr1, ...arr2];
    }

    if (arrayMergeStrategy === 'concat-unique') {
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

    return arr1.length > 0 ? arr1 : arr2;
  }

  const result: any = { ...config };
  for (const [key, value] of Object.entries(defaults)) {
    if (result[key] === undefined) {
      result[key] = value;
    } else if (Array.isArray(value) && Array.isArray(result[key])) {
      // Both are arrays - use merge strategy
      result[key] = mergeArrays(result[key], value);
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
 * Recursively merge two configuration objects with smart array handling
 * @param obj1 The first configuration object
 * @param obj2 The second configuration object to merge into the first
 * @param options Merge options including array merge strategy
 * @returns The merged configuration object
 *
 * @example
 * // Default behavior (replace arrays)
 * const config1 = { port: 3000, log: { level: 'info' } };
 * const config2 = { log: { path: '/var/log' }, debug: true };
 * const merged = merge(config1, config2);
 * // merged = { port: 3000, log: { level: 'info', path: '/var/log' }, debug: true }
 *
 * @example
 * // Concatenate arrays
 * const config1 = { tags: ['prod', 'v1'] };
 * const config2 = { tags: ['api'] };
 * const merged = merge(config1, config2, { arrayMergeStrategy: 'concat' });
 * // merged = { tags: ['prod', 'v1', 'api'] }
 *
 * @example
 * // Concatenate and deduplicate arrays
 * const config1 = { hosts: ['localhost', 'example.com'] };
 * const config2 = { hosts: ['example.com', 'api.example.com'] };
 * const merged = merge(config1, config2, { arrayMergeStrategy: 'concat-unique' });
 * // merged = { hosts: ['localhost', 'example.com', 'api.example.com'] }
 */
export function merge<T extends EnviableObject, U extends EnviableObject>(
  obj1: T,
  obj2: U,
  options: MergeOptions = {}
): Merge<T,U> {
  const { arrayMergeStrategy = 'replace' } = options;

  function mergeArrays(arr1: unknown[], arr2: unknown[]): unknown[] {
    if (arrayMergeStrategy === 'replace') {
      return arr2;
    }

    if (arrayMergeStrategy === 'concat') {
      return [...arr1, ...arr2];
    }

    if (arrayMergeStrategy === 'concat-unique') {
      // Deduplicate by converting to Set for primitives, or tracking objects
      const result: unknown[] = [...arr1];
      const seen = new Set<unknown>();

      // Add primitives from arr1 to seen set
      for (const item of arr1) {
        if (typeof item !== 'object' || item === null) {
          seen.add(item);
        }
      }

      // Add items from arr2 that aren't already present
      for (const item of arr2) {
        if (typeof item !== 'object' || item === null) {
          if (!seen.has(item)) {
            result.push(item);
            seen.add(item);
          }
        } else {
          // For objects, use a simple reference check
          if (!result.some((existing) => JSON.stringify(existing) === JSON.stringify(item))) {
            result.push(item);
          }
        }
      }

      return result;
    }

    return arr2;
  }

  const result: any = { ...obj1 };
  for (const [key, value] of Object.entries(obj2)) {
    if (Array.isArray(value) && Array.isArray(result[key])) {
      // Both are arrays - use merge strategy
      result[key] = mergeArrays(result[key], value);
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
 * Convert a configuration object back to environment variable format.
 * Reverses the transformation done by objectify().
 * Converts nested camelCase keys to flat SCREAMING_SNAKE_CASE env keys.
 *
 * @example
 * const config = {
 *   portNumber: 3000,
 *   log: {
 *     level: 'debug',
 *     path: '/var/log'
 *   }
 * };
 *
 * const env = envy(config);
 * // {
 * //   PORT_NUMBER: '3000',
 * //   LOG_LEVEL: 'debug',
 * //   LOG_PATH: '/var/log'
 * // }
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
        const screaming = toScreamingSnakeCase(key);
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

/**
 * Convert a camelCase string to SCREAMING_SNAKE_CASE
 */
function toScreamingSnakeCase(str: string): string {
  return str
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2') // Insert underscore before uppercase letters
    .toUpperCase();
}
