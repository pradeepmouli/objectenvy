/**
 * Convert a `SCREAMING_SNAKE_CASE` string to `camelCase`.
 *
 * @remarks
 * Lowercases the entire string, then capitalises the first letter of every segment that follows an
 * underscore. Leading and trailing underscores are preserved as empty string collapses (the regex only
 * matches `_` followed by a letter). This is a simple, non-Unicode-aware transformation; non-ASCII
 * letters are not affected.
 *
 * @param str - A string in `SCREAMING_SNAKE_CASE` or `snake_case` form.
 * @returns The camelCase equivalent.
 *
 * @useWhen
 * - You need to convert a raw environment variable key to a JavaScript property name.
 * - You're normalising keys before building a config object.
 *
 * @avoidWhen
 * - Input may contain non-ASCII letters — the regex captures only `[a-z]` after the underscore.
 * - You need `PascalCase` output — capitalise the first character of the result separately.
 *
 * @pitfalls
 * - NEVER assume `toCamelCase(toSnakeCase(x)) === x` for all inputs — BECAUSE acronym boundaries
 *   (e.g., `apiURL` → `API_URL` → `apiUrl`) collapse consecutive capitals, so the round-trip is
 *   lossy for strings with adjacent uppercase letters.
 *
 * @example
 * import { toCamelCase } from 'objectenvy';
 * toCamelCase('PORT_NUMBER');           // 'portNumber'
 * toCamelCase('LOG_LEVEL');             // 'logLevel'
 * toCamelCase('DATABASE_HOST');         // 'databaseHost'
 *
 * @category Parsing
 * @see {@link toSnakeCase} for the inverse operation
 */
export function toCamelCase(str: string): string {
  return str.toLowerCase().replace(/_([a-z])/g, (_, letter: string) => letter.toUpperCase());
}

/**
 * Convert a `camelCase` or `PascalCase` string to `SCREAMING_SNAKE_CASE`.
 *
 * @remarks
 * Applies two regex passes before uppercasing:
 * 1. Splits `ACRONYM` boundaries where an uppercase run transitions to a lowercase word
 *    (e.g., `URL` + `Value` → `URL_Value`).
 * 2. Splits `camelCase` boundaries where a lowercase/digit is followed by an uppercase letter
 *    (e.g., `port` + `Number` → `port_Number`).
 *
 * This means acronyms at the end of a word (`parseJSON` → `PARSE_JSON`) and digits adjacent to
 * word boundaries (`version2Id` → `VERSION2_ID`) are handled correctly. The transformation is
 * non-Unicode-aware.
 *
 * @param str - A string in `camelCase` or `PascalCase` form.
 * @returns The `SCREAMING_SNAKE_CASE` equivalent.
 *
 * @useWhen
 * - You need to convert a camelCase config key to an env variable name for `envy()`.
 * - You're generating `.env` documentation or scaffolding from TypeScript property names.
 *
 * @avoidWhen
 * - You need a strictly reversible transform — `toCamelCase(toSnakeCase('apiURL'))` yields `'apiUrl'`,
 *   not `'apiURL'`.
 *
 * @pitfalls
 * - NEVER assume acronym round-trips are lossless — BECAUSE `getHTTPSUrl` → `GET_HTTPS_URL` →
 *   `getHttpsUrl`, losing the original casing of consecutive uppercase letters.
 * - NEVER feed already-snake-cased input — BECAUSE `PORT_NUMBER` → `PORT__NUMBER` (double underscore)
 *   due to the camelCase split regex firing on the `_N` boundary.
 *
 * @example
 * import { toSnakeCase } from 'objectenvy';
 * toSnakeCase('portNumber');     // 'PORT_NUMBER'
 * toSnakeCase('logLevel');       // 'LOG_LEVEL'
 * toSnakeCase('apiURLValue');    // 'API_URL_VALUE'
 * toSnakeCase('parseJSON');      // 'PARSE_JSON'
 *
 * @category Serialization
 * @see {@link toCamelCase} for the inverse operation
 */
export function toSnakeCase(str: string): string {
  return str
    .replace(/([A-Z])([A-Z][a-z])/g, '$1_$2') // Split acronym boundary: UR+L_Value → URL_Value
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2') // Split camelCase boundary: port+Number → port_Number
    .toUpperCase();
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
 * Coerce a raw environment variable string to its most appropriate JavaScript type.
 *
 * @remarks
 * Applies the following rules in order:
 * 1. **Arrays** — if the string contains a comma (`,`), it is split on commas, each element is
 *    trimmed and filtered for empty strings, and each element is coerced recursively. If only one
 *    non-empty element remains after splitting, the single value is returned (not wrapped in an array).
 * 2. **Booleans** — `'true'`, `'yes'`, `'y'` (case-insensitive) → `true`; `'false'`, `'no'`, `'n'` → `false`.
 * 3. **Integers** — strings matching `/^-?\d+$/` are parsed with `parseInt(..., 10)` if the result
 *    is a safe integer.
 * 4. **Floats** — strings matching `/^-?\d+\.\d+$/` are parsed with `parseFloat`.
 * 5. **Strings** — everything else is returned unchanged.
 *
 * @param value - A raw string value from an environment variable.
 * @returns The coerced value: `boolean`, `number`, a `string`, or an array thereof.
 *
 * @useWhen
 * - You want to apply the same type-coercion rules that `objectify()` uses internally to an individual value.
 * - You're processing env values outside `objectify()` and need consistent boolean/number parsing.
 *
 * @avoidWhen
 * - The value must stay a string regardless of content (e.g., `'123'` must stay `'123'`) — pass
 *   `coerce: false` to `objectify()` instead, or handle the type downstream.
 * - You need locale-aware number parsing — `parseFloat`/`parseInt` are locale-independent but only
 *   handle decimal notation; scientific notation (`'1e5'`) is NOT coerced to a number.
 *
 * @pitfalls
 * - NEVER use `coerceValue` on values that use commas as decimal separators (e.g., `'3,14'` in
 *   some locales) — BECAUSE the function will treat this as an array `[3, 14]` rather than the
 *   float `3.14`.
 * - NEVER pass leading-zero strings you want preserved as strings (e.g., zip codes `'01234'`) —
 *   BECAUSE the integer regex matches and `parseInt('01234', 10)` returns `1234`.
 * - NEVER rely on `'on'`/`'off'` being coerced to booleans — BECAUSE only `true/false/yes/no/y/n`
 *   are in the boolean equivalents set; `'on'` stays as the string `'on'`.
 *
 * @example
 * import { coerceValue } from 'objectenvy';
 * coerceValue('3000');        // 3000 (number)
 * coerceValue('true');        // true (boolean)
 * coerceValue('yes');         // true (boolean)
 * coerceValue('3.14');        // 3.14 (number)
 * coerceValue('localhost');   // 'localhost' (string unchanged)
 * coerceValue('a,b,c');       // ['a', 'b', 'c'] (array)
 * coerceValue('1,2,3');       // [1, 2, 3] (array of numbers)
 *
 * @category Parsing
 * @see {@link objectify} which calls `coerceValue` internally when `coerce: true` (the default)
 */
export function coerceValue(
  value: string
): string | number | boolean | Array<string | number | boolean> {
  // Check for comma-separated values (arrays)
  if (value.includes(',')) {
    const elements = value
      .split(',')
      .map((element) => element.trim())
      .filter((element) => element.length > 0);

    // Only return array if we have multiple elements after filtering
    if (elements.length > 1) {
      return elements.map((element) => coerceValue(element) as string | number | boolean);
    }
    // If only one element after filtering, treat as single value
    if (elements.length === 1) {
      value = elements[0]!;
    }
    // If no elements after filtering (edge case: only commas), return empty string
    if (elements.length === 0) {
      return '';
    }
  }

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
