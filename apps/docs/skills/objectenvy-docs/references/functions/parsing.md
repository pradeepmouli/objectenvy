# Functions

## Parsing

### `objectify`
Parse `process.env` (or a custom env object) into a strongly-typed, nested, camelCased config object.

Without a schema, nesting is determined heuristically: a prefix is nested only when two or more
environment variables share it. A single `PORT_NUMBER` key becomes `{ portNumber }` (flat); two
`LOG_LEVEL` + `LOG_PATH` keys become `{ log: { level, path } }` (nested). Segments in
`nonNestingPrefixes` (`max`, `min`, `is`, `enable`, `disable` by default) are always kept flat.

When a Zod schema is provided, schema structure governs nesting — the heuristic is bypassed —
and the parsed output is validated against the schema. An invalid value throws a `ZodError`.

String values are coerced to `number` or `boolean` unless `coerce: false` is set. Comma-separated
strings are parsed into arrays.
```ts
objectify<T>(): T
```
**Returns:** `T` — A nested camelCased config object. Type is inferred from the Zod schema, or from the
  env source via `FromEnv`, or falls back to `EnviableObject`.
**Throws:** When a Zod schema is provided and the parsed config fails validation.
**See:** - objectEnvy for a memoized factory wrapper
 - envy for the inverse operation (config → env)
**Overloads:**
```ts
objectify<T, TOut>(options: Omit<ObjectEnvyOptions<output<T>>, "transform"> & { schema: T; transform: (parsed: output<T>) => TOut }): TOut
```
```ts
objectify<T>(options: ObjectEnvyOptions<output<T>> & { schema: T }): output<T>
```
```ts
objectify<T, TOut>(options: Omit<ObjectEnvyOptions<T>, "transform"> & { transform: (parsed: T) => TOut }): TOut
```
```ts
objectify(options: Omit<ObjectEnvyOptions<ConfigObject>, "schema" | "env"> & { env?: undefined }): ConfigObject
```
```ts
objectify<E>(options: Omit<ObjectEnvyOptions<ConfigObject>, "schema"> & { env: E }): { [KeyType in string | number | symbol]: UnionToIntersection<{ [K in string]: HasSibling<K, keyof E & string> extends true ? BuildNested<K extends `${Head}_${Tail}` ? Head extends "" ? Tail extends `${(...)}_${(...)}` ? (...) extends (...) ? (...) : (...) : [(...)] : [Head, ...((...) extends (...) ? (...) : (...))[]] : [K], CoercedType<E[K]>> : { [P in string]: CoercedType<E[K]> } }[keyof E & string]>[KeyType] }
```
```ts
objectify<T>(options: ObjectEnvyOptions<T>): T
```
```ts
// Smart nesting — only nests when multiple entries share a prefix
// PORT_NUMBER=1234 LOG_LEVEL=debug LOG_PATH=/var/log
import { objectify } from 'objectenvy';
const config = objectify({ env: process.env });
// { portNumber: 1234, log: { level: 'debug', path: '/var/log' } }
// portNumber is flat (only one PORT_* entry); log is nested (multiple LOG_* entries)
```
```ts
// With prefix filtering
// APP_PORT=3000 APP_DEBUG=true OTHER_VAR=ignored
import { objectify } from 'objectenvy';
const config = objectify({ env: process.env, prefix: 'APP' });
// { port: 3000, debug: true }
```
```ts
// With Zod schema for validation and guaranteed structure
import { objectify } from 'objectenvy';
import { z } from 'zod';
const schema = z.object({
  portNumber: z.number(),
  log: z.object({
    level: z.enum(['debug', 'info', 'warn', 'error']),
    path: z.string()
  })
});
const config = objectify({ env: process.env, schema });
// Throws ZodError if PORT_NUMBER is missing or LOG_LEVEL is not a valid enum value
```
```ts
// Disable coercion to keep all values as strings
import { objectify } from 'objectenvy';
const config = objectify({ env: process.env, coerce: false });
// { port: '3000', debug: 'true' } — no type conversion applied
```

### `safeObjectify`
Non-throwing variant of objectify. Returns a discriminated union instead of throwing on
validation failure or transform errors.

Catches all errors including `ZodError` (when a schema is provided) and any error thrown inside
a `transform` callback. On `ZodError`, the original error is available as `result.error`.
```ts
safeObjectify<T, TOut>(options: Omit<ObjectEnvyOptions<T>, "transform"> & { transform: (parsed: T) => TOut }): { success: true; data: TOut } | { success: false; error: unknown }
```
**Parameters:**
- `options: Omit<ObjectEnvyOptions<T>, "transform"> & { transform: (parsed: T) => TOut }`
**Returns:** `{ success: true; data: TOut } | { success: false; error: unknown }` — `{ success: true; data: T }` on success, or `{ success: false; error: unknown }` on any
  thrown error. When a `transform` that widens the type is provided, `data` is typed as `TOut`.
**See:** objectify for the throwing variant
**Overloads:**
```ts
safeObjectify<T>(options?: ObjectEnvyOptions<T>): { success: true; data: T } | { success: false; error: unknown }
```
```ts
const result = safeObjectify({ env: import.meta.env, prefix: 'VITE', schema: ConfigSchema });
if (!result.success) {
  console.error('Config invalid:', result.error);
  return;
}
const config = result.data;
```

### `objectEnvy`
Create a memoized configuration loader with preset options, returning bound `objectify` and `envy` helpers.

`objectEnvy` acts as a factory: call it once at module load time with your default options (prefix,
schema, delimiter, etc.) and it returns a pair of functions. The inner `objectify` is memoized per
env-object reference and option-set combination, so repeated calls within the same process return
the same config instance without re-parsing. Pass `{ env: testEnv }` to the inner `objectify` to
override the env source for unit testing without polluting module-level state.
```ts
objectEnvy(defaultOptions: Omit<ObjectEnvyOptions, "schema">): { objectify: (overrides?: Partial<Omit<ObjectEnvyOptions<ConfigObject>, "schema">>) => ConfigObject; envy: (config: T) => { [KeyType in string | number | symbol]: UnionToIntersection<[T] extends [unknown[]] ? never : [T] extends [object] ? { [K in string]: [(...)] extends [(...)] ? (...) extends (...) ? (...) : (...) : (...) extends (...) ? (...) : (...) }[keyof T & string] : [T] extends [Primitive] ? never : never>[KeyType] } }
```
**Parameters:**
- `defaultOptions: Omit<ObjectEnvyOptions, "schema">` — Default options applied to every inner `objectify()` call. Schema is fixed
  per instance; it cannot be overridden in the inner calls.
**Returns:** `{ objectify: (overrides?: Partial<Omit<ObjectEnvyOptions<ConfigObject>, "schema">>) => ConfigObject; envy: (config: T) => { [KeyType in string | number | symbol]: UnionToIntersection<[T] extends [unknown[]] ? never : [T] extends [object] ? { [K in string]: [(...)] extends [(...)] ? (...) extends (...) ? (...) : (...) : (...) extends (...) ? (...) : (...) }[keyof T & string] : [T] extends [Primitive] ? never : never>[KeyType] } }` — An object with a memoized `objectify(overrides?)` and the `envy` converter.
**See:** - objectify for the stateless version without memoization
 - envy for converting config objects back to env format
**Overloads:**
```ts
objectEnvy<T>(defaultOptions: ObjectEnvyOptions<T> & { schema: ZodObject<any, $strip> | T }): { objectify: (overrides?: Partial<Omit<ObjectEnvyOptions<T>, "schema">>) => T; envy: (config: T) => { [KeyType in string | number | symbol]: UnionToIntersection<[T] extends [unknown[]] ? never : [T] extends [object] ? { [K in string]: [(...)] extends [(...)] ? (...) extends (...) ? (...) : (...) : (...) extends (...) ? (...) : (...) }[keyof T & string] : [T] extends [Primitive] ? never : never>[KeyType] } }
```
```ts
// Module-level config singleton with Zod schema
import { objectEnvy } from 'objectenvy';
import { z } from 'zod';

const schema = z.object({ port: z.number(), debug: z.boolean() });
const { objectify: loadConfig, envy: toEnv } = objectEnvy({ prefix: 'APP', schema });

export const config = loadConfig();            // memoized; reads process.env once
export const rawEnv = toEnv(config);           // convert back to env format
```
```ts
// Override env for unit tests
import { objectEnvy } from 'objectenvy';
const { objectify } = objectEnvy({ prefix: 'APP' });
const testConfig = objectify({ env: { APP_PORT: '9000', APP_DEBUG: 'true' } });
```

### `toCamelCase`
Convert a `SCREAMING_SNAKE_CASE` string to `camelCase`.

Lowercases the entire string, then capitalises the first letter of every segment that follows an
underscore. Leading and trailing underscores are preserved as empty string collapses (the regex only
matches `_` followed by a letter). This is a simple, non-Unicode-aware transformation; non-ASCII
letters are not affected.
```ts
toCamelCase(str: string): string
```
**Parameters:**
- `str: string` — A string in `SCREAMING_SNAKE_CASE` or `snake_case` form.
**Returns:** `string` — The camelCase equivalent.
**See:** toSnakeCase for the inverse operation
```ts
import { toCamelCase } from 'objectenvy';
toCamelCase('PORT_NUMBER');           // 'portNumber'
toCamelCase('LOG_LEVEL');             // 'logLevel'
toCamelCase('DATABASE_HOST');         // 'databaseHost'
```

### `coerceValue`
Coerce a raw environment variable string to its most appropriate JavaScript type.

Applies the following rules in order:
1. **Arrays** — if the string contains a comma (`,`), it is split on commas, each element is
   trimmed and filtered for empty strings, and each element is coerced recursively. If only one
   non-empty element remains after splitting, the single value is returned (not wrapped in an array).
2. **Booleans** — `'true'`, `'yes'`, `'y'` (case-insensitive) → `true`; `'false'`, `'no'`, `'n'` → `false`.
3. **Integers** — strings matching `/^-?\d+$/` are parsed with `parseInt(..., 10)` if the result
   is a safe integer.
4. **Floats** — strings matching `/^-?\d+\.\d+$/` are parsed with `parseFloat`.
5. **Strings** — everything else is returned unchanged.
```ts
coerceValue(value: string): string | number | boolean | (string | number | boolean)[]
```
**Parameters:**
- `value: string` — A raw string value from an environment variable.
**Returns:** `string | number | boolean | (string | number | boolean)[]` — The coerced value: `boolean`, `number`, a `string`, or an array thereof.
**See:** objectify which calls `coerceValue` internally when `coerce: true` (the default)
```ts
import { coerceValue } from 'objectenvy';
coerceValue('3000');        // 3000 (number)
coerceValue('true');        // true (boolean)
coerceValue('yes');         // true (boolean)
coerceValue('3.14');        // 3.14 (number)
coerceValue('localhost');   // 'localhost' (string unchanged)
coerceValue('a,b,c');       // ['a', 'b', 'c'] (array)
coerceValue('1,2,3');       // [1, 2, 3] (array of numbers)
```
