/**
 * Formatting utilities for .env output
 * @module utils/formatting
 */

import type { EnvEntry } from '../types.js';

/**
 * Convert field name to SCREAMING_SNAKE_CASE
 */
export function toEnvKey(fieldName: string): string {
  return fieldName
    .split('.')
    .map((part) => toScreamingSnakeCase(part))
    .join('_');
}

/**
 * Convert string to SCREAMING_SNAKE_CASE
 */
export function toScreamingSnakeCase(str: string): string {
  return str
    .replace(/([a-z])([A-Z])/g, '$1_$2') // camelCase to snake_case
    .toUpperCase();
}

/**
 * Format environment entries as .env content
 */
export function formatEnvContent(entries: EnvEntry[], includeComments: boolean = true): string {
  const lines: string[] = [];

  for (const entry of entries) {
    if (includeComments && entry.comment) {
      lines.push(`# ${entry.comment}`);
    }

    // Quote value if it contains spaces or special characters
    const value = needsQuoting(entry.value) ? `"${escapeQuotes(entry.value)}"` : entry.value;
    lines.push(`${entry.key}=${value}`);

    if (includeComments && entry.comment) {
      lines.push(''); // Empty line for readability
    }
  }

  // Remove trailing empty line
  while (lines.length > 0 && lines[lines.length - 1] === '') {
    lines.pop();
  }

  return lines.join('\n');
}

/**
 * Check if value needs quoting in .env format
 */
export function needsQuoting(value: string): boolean {
  // Values with spaces, special characters, or empty values need quoting
  return /[\s"'$`\\]/.test(value) || value === '';
}

/**
 * Escape quotes in value
 */
export function escapeQuotes(value: string): string {
  return value.replace(/"/g, '\\"').replace(/\n/g, '\\n').replace(/\r/g, '\\r');
}

/**
 * Flatten nested object field names
 */
export function flattenFieldName(baseName: string, nestedPath: string): string {
  return `${baseName}.${nestedPath}`;
}

/**
 * Add prefix to environment variable key
 */
export function addPrefix(key: string, prefix?: string): string {
  if (!prefix) {
    return key;
  }
  return `${prefix}_${key}`;
}
