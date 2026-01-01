/**
 * Convert SCREAMING_SNAKE_CASE to camelCase
 */
export function toCamelCase(str: string): string {
  return str.toLowerCase().replace(/_([a-z])/g, (_, letter: string) => letter.toUpperCase());
}

/**
 * Convert camelCase to SCREAMING_SNAKE_CASE
 */
export function toSnakeCase(str: string): string {
  return str
    .replace(/([A-Z])/g, '_$1')
    .toUpperCase()
    .replace(/^_/, '');
}

/**
 * Set a nested value in an object using a path array
 */
export function setNestedValue(obj: Record<string, unknown>, path: string[], value: unknown): void {
  let current = obj;
  for (let i = 0; i < path.length - 1; i++) {
    const key = path[i]!;
    if (!(key in current) || typeof current[key] !== 'object' || current[key] === null) {
      current[key] = {};
    }
    current = current[key] as Record<string, unknown>;
  }
  const lastKey = path[path.length - 1];
  if (lastKey) {
    current[lastKey] = value;
  }
}

/**
 * Parse environment variable key into nested path
 * e.g., "LOG_LEVEL" -> ["log", "level"]
 * e.g., "PORT" -> ["port"]
 * e.g., "DATABASE_CONNECTION_STRING" -> ["database", "connection", "string"]
 */
export function parseEnvKeyToPath(key: string, prefix?: string): string[] {
  let normalizedKey = key;

  if (prefix) {
    const prefixWithUnderscore = prefix.endsWith('_') ? prefix : `${prefix}_`;
    if (key.startsWith(prefixWithUnderscore)) {
      normalizedKey = key.slice(prefixWithUnderscore.length);
    } else {
      return [];
    }
  }

  return normalizedKey
    .toLowerCase()
    .split('_')
    .filter((part) => part.length > 0);
}

const trueEquivalents = new Set(['true', 'yes', 'y']);
const falseEquivalents = new Set(['false', 'no', 'n']);

/**
 * Coerce a string value to the appropriate type
 */
export function coerceValue(value: string): string | number | boolean {
  // Boolean
  if (trueEquivalents.has(value.toLowerCase())) return true;
  if (falseEquivalents.has(value.toLowerCase())) return false;

  // Number
  if (/^-?\d+$/.test(value)) {
    const num = parseInt(value, 10);
    if (Number.isSafeInteger(num)) return num;
  }
  if (/^-?\d+\.\d+$/.test(value)) {
    const num = parseFloat(value);
    if (Number.isFinite(num)) return num;
  }

  // Default to string
  return value;
}
