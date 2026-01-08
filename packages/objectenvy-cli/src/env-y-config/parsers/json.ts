/**
 * JSON object parser - treats JSON as a schema template
 * @module parsers/json
 */

import { readFileSync } from 'fs';
import type { SchemaField, ParsedSchema } from '../types.js';
import { createParseError } from '../utils/errors.js';

/**
 * Infer field type from a JSON value
 */
function inferType(value: unknown): 'string' | 'number' | 'boolean' | 'array' | 'object' {
  if (Array.isArray(value)) {
    return 'array';
  }
  if (value === null) {
    return 'string'; // Default null to string
  }
  const type = typeof value;
  if (type === 'string' || type === 'number' || type === 'boolean' || type === 'object') {
    return type as 'string' | 'number' | 'boolean' | 'object';
  }
  return 'string'; // Default fallback
}

/**
 * Extract fields from a JSON object recursively
 */
function extractFieldsFromObject(obj: Record<string, unknown>, depth: number = 0): SchemaField[] {
  const maxDepth = 10;
  if (depth > maxDepth) {
    throw createParseError('json', 'json', `Object nesting exceeds maximum depth of ${maxDepth}`);
  }

  const fields: SchemaField[] = [];

  for (const [key, value] of Object.entries(obj)) {
    const fieldType = inferType(value);

    const field: SchemaField = {
      name: key,
      type: fieldType,
      required: true // JSON values are always "required" unless undefined
    };

    // Extract nested fields for objects
    if (
      fieldType === 'object' &&
      value !== null &&
      typeof value === 'object' &&
      !Array.isArray(value)
    ) {
      const nestedObj = value as Record<string, unknown>;
      field.nested = extractFieldsFromObject(nestedObj, depth + 1);
    }

    fields.push(field);
  }

  return fields;
}

/**
 * Parse JSON file and extract schema from structure
 *
 * @param filePath - Path to JSON file
 * @returns Parsed schema with inferred types
 * @throws ConversionError if file cannot be read or parsed as JSON
 *
 * @example
 * ```typescript
 * const schema = await parseJsonFile('config.json');
 * // Returns schema with inferred types from JSON structure
 * ```
 */
export async function parseJsonFile(filePath: string): Promise<ParsedSchema> {
  try {
    const content = readFileSync(filePath, 'utf-8');
    let jsonData: unknown;

    try {
      jsonData = JSON.parse(content);
    } catch (parseError) {
      throw createParseError(
        filePath,
        'json',
        `Invalid JSON: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`
      );
    }

    // JSON must be an object at the root level
    if (typeof jsonData !== 'object' || jsonData === null || Array.isArray(jsonData)) {
      throw createParseError(
        filePath,
        'json',
        'Root JSON value must be an object, not an array or primitive'
      );
    }

    const jsonObj = jsonData as Record<string, unknown>;
    const fields = extractFieldsFromObject(jsonObj);

    return {
      fields,
      metadata: {
        format: 'json',
        fileName: filePath
      }
    };
  } catch (error) {
    if (error instanceof Error && error.name === 'ConversionError') {
      throw error;
    }
    throw createParseError(
      filePath,
      'json',
      error instanceof Error ? error.message : String(error)
    );
  }
}
