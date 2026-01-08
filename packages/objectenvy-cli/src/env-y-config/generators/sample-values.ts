/**
 * Sample value generator for environment variables
 * Uses placeholder syntax and schema descriptions as hints
 * @module generators/sample-values
 */

import type { SchemaField } from '../types.js';

/**
 * Extract keywords from field name and description for placeholder generation
 */
function extractKeywords(field: SchemaField): string[] {
  const name = field.name.toLowerCase();

  // Check for high-priority compound patterns in description first
  if (field.description) {
    const desc = field.description.toLowerCase();
    // Special compound patterns that override field name
    if (desc.includes('api key') || desc.includes('api_key')) {
      return ['KEY']; // Return immediately for this specific pattern
    }
  }

  // Keywords from field name - check more specific patterns first
  const keywords: string[] = [];
  if (name.includes('url') || name.includes('uri')) keywords.push('URL');
  if (name.includes('password') || name.includes('pass')) keywords.push('PASSWORD');
  if (name.includes('token')) keywords.push('TOKEN');
  if (name.includes('secret')) keywords.push('SECRET');
  if (name.includes('key')) keywords.push('KEY');
  if (name.includes('host')) keywords.push('HOST');
  if (name.includes('port')) keywords.push('PORT');
  if (name.includes('api')) keywords.push('API');
  if (name.includes('user') || name.includes('username')) keywords.push('USERNAME');
  if (name.includes('email')) keywords.push('EMAIL');
  if (name.includes('database') || name.includes('db')) keywords.push('DATABASE');
  if (name.includes('timeout')) keywords.push('TIMEOUT');
  if (name.includes('limit')) keywords.push('LIMIT');
  if (name.includes('size')) keywords.push('SIZE');
  if (name.includes('path')) keywords.push('PATH');
  if (name.includes('protocol')) keywords.push('PROTOCOL');

  // Add description keywords as additional hints (not replacing field name keywords)
  if (field.description) {
    const desc = field.description.toLowerCase();
    if (desc.includes('url')) keywords.push('URL');
    if (desc.includes('password')) keywords.push('PASSWORD');
    if (desc.includes('token')) keywords.push('TOKEN');
    if (desc.includes('secret')) keywords.push('SECRET');
    if (desc.includes('host')) keywords.push('HOST');
    if (desc.includes('port')) keywords.push('PORT');
  }

  // Remove duplicates while preserving order (field name keywords first)
  return Array.from(new Set(keywords));
}

/**
 * Generate a placeholder value with semantic hints
 */
function generatePlaceholder(field: SchemaField): string {
  const keywords = extractKeywords(field);

  if (keywords.length > 0) {
    return `<${keywords[0]}>`;
  }

  // Default generic placeholder
  return '<YOUR_VALUE>';
}

/**
 * Generate sample value for a field based on type
 */
export function generateSampleValue(field: SchemaField): string {
  switch (field.type) {
    case 'string': {
      return generatePlaceholder(field);
    }

    case 'number': {
      const name = field.name.toLowerCase();

      // Port numbers
      if (name.includes('port')) return '5432';

      // Timeout/duration in milliseconds
      if (name.includes('timeout') || name.includes('delay')) return '30000';

      // Size/limit
      if (name.includes('size') || name.includes('limit') || name.includes('max')) {
        return '100';
      }

      // Default number
      return '42';
    }

    case 'boolean': {
      return 'true';
    }

    case 'array': {
      const itemPlaceholder = generatePlaceholder(field);
      return `${itemPlaceholder},${itemPlaceholder}`;
    }

    case 'object': {
      // For nested objects, return a placeholder indicating structure
      return '<NESTED_OBJECT>';
    }

    default:
      return '<UNKNOWN>';
  }
}

/**
 * Generate sample values for all fields in a schema
 *
 * @param fields - Array of schema fields
 * @returns Flat map of field names to sample values
 *
 * @example
 * ```typescript
 * const fields = [
 *   { name: 'database_host', type: 'string', required: true },
 *   { name: 'database_port', type: 'number', required: true },
 *   { name: 'debug', type: 'boolean', required: false }
 * ];
 * const samples = generateSampleValues(fields);
 * // {
 * //   'database_host': '<DATABASE_HOST>',
 * //   'database_port': '5432',
 * //   'debug': 'true'
 * // }
 * ```
 */
export function generateSampleValues(fields: SchemaField[]): Record<string, string> {
  const samples: Record<string, string> = {};

  for (const field of fields) {
    samples[field.name] = generateSampleValue(field);

    // For nested objects, generate values for nested fields
    if (field.nested && field.nested.length > 0) {
      const nestedSamples = generateSampleValues(field.nested);
      for (const [nestedName, nestedValue] of Object.entries(nestedSamples)) {
        samples[`${field.name}_${nestedName}`] = nestedValue;
      }
    }
  }

  return samples;
}

/**
 * Generate sample values with semantic keywords as hints
 * Exported for testing purposes
 */
export function generatePlaceholderWithKeywords(fieldName: string, description?: string): string {
  const field: SchemaField = {
    name: fieldName,
    type: 'string',
    required: true,
    description
  };
  return generatePlaceholder(field);
}
