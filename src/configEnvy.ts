import type { z } from 'zod';
import type { ConfigEnvyOptions, ConfigObject, ConfigValue, InferConfig } from './types.js';
import { coerceValue, setNestedValue } from './utils.js';

interface ParsedEntry {
  key: string;
  segments: string[];
  value: string;
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
 * Build a nested configuration object from environment variables.
 * Only nests when multiple entries share a common prefix.
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
  const config = buildConfig(env, options);

  if (options.schema) {
    return options.schema.parse(config) as InferConfig<T>;
  }

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
