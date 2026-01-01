import type { z } from 'zod';
import type { ConfigEnvyOptions, ConfigObject, ConfigValue, InferConfig } from './types.js';
import { coerceValue, setNestedValue } from './utils.js';

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
 * Extract all leaf paths from a Zod schema or schema-like object
 * Supports both Zod v3 (typeName) and Zod v4 (type) structures
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
  options: Omit<ConfigEnvyOptions, 'schema'> = {}
): ConfigObject {
  const { prefix, coerce = true, delimiter = '_' } = options;

  // First pass: parse all entries and group by first segment
  const entries: ParsedEntry[] = [];
  const firstSegmentCounts = new Map<string, number>();

  for (const [key, value] of Object.entries(env)) {
    if (value === undefined) continue;

    const normalizedKey = stripPrefix(key, prefix, delimiter);
    if (normalizedKey === null) continue;

    const segments = splitKey(normalizedKey, delimiter);
    if (segments.length === 0) continue;

    const firstSegment = segments[0]!.toLowerCase();
    entries.push({ key: normalizedKey, segments, value });
    firstSegmentCounts.set(firstSegment, (firstSegmentCounts.get(firstSegment) ?? 0) + 1);
  }

  // Second pass: build config with smart nesting
  const result: ConfigObject = {};

  for (const entry of entries) {
    const firstSegment = entry.segments[0]!.toLowerCase();
    const count = firstSegmentCounts.get(firstSegment) ?? 0;
    const finalValue: ConfigValue = coerce ? coerceValue(entry.value) : entry.value;

    if (count === 1) {
      // Only one entry with this prefix - flatten to camelCase
      const camelKey = segmentsToFlatCamelCase(entry.segments, delimiter);
      result[camelKey] = finalValue;
    } else {
      // Multiple entries share this prefix - nest them
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
  options: Omit<ConfigEnvyOptions, 'schema'> = {}
): ConfigObject {
  const { prefix, coerce = true, delimiter = '_' } = options;

  // Extract all paths from schema
  const schemaPathList = extractSchemaPaths(schema);
  const schemaPaths = new Map<string, string[]>();
  for (const sp of schemaPathList) {
    schemaPaths.set(sp.pathKey, sp.path);
  }

  const result: ConfigObject = {};

  for (const [key, value] of Object.entries(env)) {
    if (value === undefined) continue;

    const normalizedKey = stripPrefix(key, prefix, delimiter);
    if (normalizedKey === null) continue;

    const segments = splitKey(normalizedKey, delimiter);
    if (segments.length === 0) continue;

    const finalValue: ConfigValue = coerce ? coerceValue(value) : value;

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
 * const config = configEnvy();
 * // Returns: { portNumber: 1234, log: { level: 'debug', path: '/var/log' } }
 * // Note: portNumber is flat (only one PORT_* entry), log is nested (multiple LOG_* entries)
 *
 * @example
 * // With prefix filtering
 * // APP_PORT=3000 APP_DEBUG=true OTHER_VAR=ignored
 * const config = configEnvy({ prefix: 'APP' });
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
 * const config = configEnvy({ schema });
 * // Returns typed config with validation
 */
export function configEnvy<T extends z.ZodType>(
  options: ConfigEnvyOptions<T> & { schema: T }
): InferConfig<T>;
export function configEnvy(options?: Omit<ConfigEnvyOptions, 'schema'>): ConfigObject;
export function configEnvy<T extends z.ZodType>(
  options: ConfigEnvyOptions<T> = {}
): InferConfig<T> {
  const env = options.env ?? process.env;

  if (options.schema) {
    // Use schema-guided building when schema is provided
    const config = buildConfigWithSchema(env, options.schema, options);
    return options.schema.parse(config) as InferConfig<T>;
  }

  // Use smart nesting heuristic when no schema
  const config = buildConfig(env, options);
  return config as InferConfig<T>;
}

/**
 * Create a configuration loader with preset options
 *
 * @example
 * const loadConfig = createConfigEnvy({
 *   prefix: 'APP',
 *   schema: appConfigSchema
 * });
 *
 * const config = loadConfig(); // Uses preset options
 * const testConfig = loadConfig({ env: testEnv }); // Override env for testing
 */
export function createConfigEnvy<T extends z.ZodType>(
  defaultOptions: ConfigEnvyOptions<T> & { schema: T }
): (overrides?: Partial<Omit<ConfigEnvyOptions<T>, 'schema'>>) => InferConfig<T>;
export function createConfigEnvy(
  defaultOptions: Omit<ConfigEnvyOptions, 'schema'>
): (overrides?: Partial<Omit<ConfigEnvyOptions, 'schema'>>) => ConfigObject;
export function createConfigEnvy<T extends z.ZodType>(
  defaultOptions: ConfigEnvyOptions<T>
): (overrides?: Partial<Omit<ConfigEnvyOptions<T>, 'schema'>>) => ConfigObject | InferConfig<T> {
  return (overrides = {}) => {
    const mergedOptions = { ...defaultOptions, ...overrides };
    if ('schema' in mergedOptions && mergedOptions.schema) {
      return configEnvy(mergedOptions as ConfigEnvyOptions<T> & { schema: T });
    }
    return configEnvy(mergedOptions as Omit<ConfigEnvyOptions, 'schema'>);
  };
}
