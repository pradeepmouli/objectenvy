/**
 * .env file formatter - converts parsed schemas to .env format
 * @module generators/env-formatter
 */

import type {
  SchemaField,
  ParsedSchema,
  EnvGeneratorOptions,
  EnvEntry,
  GeneratedEnv
} from '../types.js';
import { toEnvKey, addPrefix, formatEnvContent } from '../utils/formatting.js';
import { generateSampleValue } from './sample-values.js';

/**
 * Check if field should be included based on filters
 */
function shouldIncludeField(fieldName: string, options: EnvGeneratorOptions): boolean {
  // Check include list
  if (options.include && options.include.length > 0) {
    return options.include.some((pattern) => fieldName.includes(pattern));
  }

  // Check exclude list
  if (options.exclude && options.exclude.length > 0) {
    return !options.exclude.some((pattern) => fieldName.includes(pattern));
  }

  return true;
}

/**
 * Detect naming collisions when flattening nested objects
 */
function detectCollisions(fields: SchemaField[], baseName: string = ''): Map<string, string[]> {
  const collisions = new Map<string, string[]>();
  const seen = new Map<string, string>();

  function traverse(field: SchemaField, prefix: string) {
    const fieldName = prefix ? `${prefix}.${field.name}` : field.name;
    const envKey = toEnvKey(fieldName);

    // Check for collision
    if (seen.has(envKey)) {
      const existing = seen.get(envKey)!;
      if (!collisions.has(envKey)) {
        collisions.set(envKey, [existing]);
      }
      collisions.get(envKey)!.push(fieldName);
    } else {
      seen.set(envKey, fieldName);
    }

    // Process nested fields
    if (field.nested && field.nested.length > 0) {
      for (const nestedField of field.nested) {
        traverse(nestedField, fieldName);
      }
    }
  }

  for (const field of fields) {
    traverse(field, baseName);
  }

  return collisions;
}

/**
 * Flatten nested fields into environment variable entries
 */
function flattenFields(
  fields: SchemaField[],
  options: EnvGeneratorOptions,
  baseName: string = ''
): EnvEntry[] {
  const entries: EnvEntry[] = [];

  for (const field of fields) {
    // Skip if requiredOnly and field is not required
    if (options.requiredOnly && !field.required) {
      continue;
    }

    const fieldName = baseName ? `${baseName}.${field.name}` : field.name;

    // Check if field should be included
    if (!shouldIncludeField(fieldName, options)) {
      continue;
    }

    // Generate entry for non-object fields
    if (field.type !== 'object') {
      const rawKey = toEnvKey(fieldName);
      const key = addPrefix(rawKey, options.prefix);
      const value = generateSampleValue(field);
      const comment = options.comments && field.description ? field.description : undefined;

      entries.push({ key, value, comment });
    }

    // Process nested fields
    if (field.nested && field.nested.length > 0) {
      const nestedEntries = flattenFields(field.nested, options, fieldName);
      entries.push(...nestedEntries);
    }
  }

  return entries;
}

/**
 * Generate .env file from parsed schema
 *
 * @param schema - Parsed schema from any input format
 * @param options - Generation options (prefix, filters, comments)
 * @returns Generated .env file with entries and formatted content
 * @throws ConversionError if naming collisions are detected
 *
 * @example
 * ```typescript
 * const schema = await parseJsonFile('config.json');
 * const env = generateEnvFile(schema, {
 *   prefix: 'APP',
 *   comments: true,
 *   requiredOnly: false
 * });
 * // env.content contains formatted .env file
 * ```
 */
export function generateEnvFile(schema: ParsedSchema, options: EnvGeneratorOptions): GeneratedEnv {
  // Detect naming collisions
  const collisions = detectCollisions(schema.fields);
  if (collisions.size > 0) {
    const collisionDetails = Array.from(collisions.entries())
      .map(([key, sources]) => `  ${key} <- ${sources.join(', ')}`)
      .join('\n');
    throw new Error(
      `Naming collision detected when flattening nested objects:\n${collisionDetails}\n\nPlease rename fields to avoid conflicts.`
    );
  }

  // Flatten fields to entries
  const entries = flattenFields(schema.fields, options);

  // Format entries to .env content
  const content = formatEnvContent(entries, options.comments);

  return {
    entries,
    content
  };
}

/**
 * Create default generator options
 */
export function createDefaultOptions(
  overrides?: Partial<EnvGeneratorOptions>
): EnvGeneratorOptions {
  return {
    comments: true,
    requiredOnly: false,
    ...overrides
  };
}
