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
objectify(options: Omit<ObjectEnvyOptions<ConfigObject>, "schema" | "env"> & { env?: undefined }): ConfigObject
```
```ts
objectify<E>(options: Omit<ObjectEnvyOptions<ConfigObject>, "schema"> & { env: E }): { [KeyType in string | number | symbol]: UnionToIntersection<{ [K in string]: HasSibling<K, keyof E & string> extends true ? BuildNested<K extends `${Head}_${Tail}` ? Head extends "" ? Tail extends `${(...)}_${(...)}` ? (...) extends (...) ? (...) : (...) : [(...)] : [Head, ...((...) extends (...) ? (...) : (...))[]] : [K], CoercedType<E[K]>> : { [P in string]: CoercedType<E[K]> } }[keyof E & string]>[KeyType] }
```
```ts
objectify<T>(options: ObjectEnvyOptions<output<T>> & { schema: T }): output<T>
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

## Serialization

### `envy`
Serialize a nested camelCased config object back to a flat `SCREAMING_SNAKE_CASE` env record.

`envy` is the inverse of `objectify`: it flattens a nested config tree by joining each key path
with underscores and uppercasing the result. All values are stringified — numbers and booleans
become their string representations. Arrays are serialized as comma-separated strings (e.g.,
`['a', 'b']` → `'a,b'`). Object items inside arrays are JSON-serialized before joining.

The return type is `ToEnv<T>`, which preserves string literal and template literal types from the
config type all the way into the env record type.
```ts
envy<T>(config: T): { [KeyType in string | number | symbol]: UnionToIntersection<[T] extends [unknown[]] ? never : [T] extends [object] ? { [K in string]: [T[K]] extends [unknown[]] ? `${ScreamingSnakeCase<(...), (...)>}` extends "" ? never : Record<`${(...)}`, string> : [(...)[(...)]] extends [object] ? { [K in (...)]: (...) }[(...) & (...)] : [(...)] extends [(...)] ? (...) extends (...) ? (...) : (...) : never }[keyof T & string] : [T] extends [Primitive] ? never : never>[KeyType] }
```
**Parameters:**
- `config: T` — A nested camelCased configuration object.
**Returns:** `{ [KeyType in string | number | symbol]: UnionToIntersection<[T] extends [unknown[]] ? never : [T] extends [object] ? { [K in string]: [T[K]] extends [unknown[]] ? `${ScreamingSnakeCase<(...), (...)>}` extends "" ? never : Record<`${(...)}`, string> : [(...)[(...)]] extends [object] ? { [K in (...)]: (...) }[(...) & (...)] : [(...)] extends [(...)] ? (...) extends (...) ? (...) : (...) : never }[keyof T & string] : [T] extends [Primitive] ? never : never>[KeyType] }` — A flat `Record<string, string>` with `SCREAMING_SNAKE_CASE` keys and all values stringified.
**See:** - objectify for the inverse operation (env → config)
 - ToEnv for the compile-time type utility
```ts
import { envy } from 'objectenvy';

const config = {
  portNumber: 3000,
  log: { level: 'debug', path: '/var/log' }
};
const env = envy(config);
// { PORT_NUMBER: '3000', LOG_LEVEL: 'debug', LOG_PATH: '/var/log' }
```
```ts
// Round-trip: objectify → mutate → envy
import { objectify, envy } from 'objectenvy';
const config = objectify({ env: process.env, prefix: 'APP' });
const mutated = { ...config, debug: true };
const newEnv = envy(mutated);
// spawn({ env: { ...process.env, ...newEnv } })
```
```ts
// Array values are joined as comma-separated strings
import { envy } from 'objectenvy';
const config = { hosts: ['localhost', 'example.com'] };
const env = envy(config);
// { HOSTS: 'localhost,example.com' }
```

### `toSnakeCase`
Convert a `camelCase` or `PascalCase` string to `SCREAMING_SNAKE_CASE`.

Applies two regex passes before uppercasing:
1. Splits `ACRONYM` boundaries where an uppercase run transitions to a lowercase word
   (e.g., `URL` + `Value` → `URL_Value`).
2. Splits `camelCase` boundaries where a lowercase/digit is followed by an uppercase letter
   (e.g., `port` + `Number` → `port_Number`).

This means acronyms at the end of a word (`parseJSON` → `PARSE_JSON`) and digits adjacent to
word boundaries (`version2Id` → `VERSION2_ID`) are handled correctly. The transformation is
non-Unicode-aware.
```ts
toSnakeCase(str: string): string
```
**Parameters:**
- `str: string` — A string in `camelCase` or `PascalCase` form.
**Returns:** `string` — The `SCREAMING_SNAKE_CASE` equivalent.
**See:** toCamelCase for the inverse operation
```ts
import { toSnakeCase } from 'objectenvy';
toSnakeCase('portNumber');     // 'PORT_NUMBER'
toSnakeCase('logLevel');       // 'LOG_LEVEL'
toSnakeCase('apiURLValue');    // 'API_URL_VALUE'
toSnakeCase('parseJSON');      // 'PARSE_JSON'
```

## Merging

### `override`
Apply default values to a config object, filling in only the keys that are absent in `config`.

`override` is a one-directional merge: `config` wins. For every key in `defaults`, if `config`
already has a value for that key it is kept; otherwise the default is used. Nested objects are
traversed recursively so deeply-nested defaults are filled in without overwriting any key that
`config` sets at any depth.

Array merging is controlled by `options.arrayMergeStrategy`:
- `'replace'` (default): the config array replaces the default array entirely.
- `'concat'`: config array followed by any remaining defaults array elements.
- `'concat-unique'`: same as concat but duplicate primitives are removed.
```ts
override<T>(defaults: T, config: Partial<T>, options: MergeOptions): T
```
**Parameters:**
- `defaults: T` — The base values to fall back to for missing keys.
- `config: Partial<T>` — The user-supplied values; these always take precedence over `defaults`.
- `options: MergeOptions` — default: `{}` — Merge options, including `arrayMergeStrategy`.
**Returns:** `T` — A new object combining `config` (priority) with any keys absent from `config` filled from `defaults`.
**See:** merge for a symmetric deep merge (neither object has priority)
```ts
import { objectify, override } from 'objectenvy';

const defaults = { port: 3000, log: { level: 'info', path: '/var/log' } };
const envConfig = objectify({ env: process.env, prefix: 'APP' });
const config = override(defaults, envConfig);
// { port: 3000, log: { level: 'debug', path: '/var/log' } }
// env wins where it has values; defaults fill missing keys
```
```ts
// Append default tags when env provides its own list
import { override } from 'objectenvy';
const defaults = { tags: ['v1'] };
const config = { tags: ['prod'] };
const result = override(defaults, config, { arrayMergeStrategy: 'concat' });
// { tags: ['prod', 'v1'] }
```

### `merge`
Recursively merge two configuration objects, with `obj2` winning on conflicts.

`merge` performs a symmetric deep merge: for each key present in `obj2`, its value overwrites the
corresponding key in `obj1`. Nested objects are merged recursively. Arrays are handled according to
`options.arrayMergeStrategy`:
- `'replace'` (default): `obj2`'s array replaces `obj1`'s array.
- `'concat'`: arrays from `obj1` and `obj2` are joined (`obj1` first, then `obj2`).
- `'concat-unique'`: same as concat but duplicate primitive values are removed; object items are
  deduplicated by deep JSON equality.

The return type is `Merge<T, U>` (from `type-fest`), which correctly models `obj2` keys shadowing
`obj1` keys at the type level.
```ts
merge<T, U>(obj1: T, obj2: U, options: MergeOptions): Merge<T, U>
```
**Parameters:**
- `obj1: T` — The base configuration object.
- `obj2: U` — The second configuration object; its keys take precedence over `obj1`.
- `options: MergeOptions` — default: `{}` — Merge options, including `arrayMergeStrategy`.
**Returns:** `Merge<T, U>` — A new object containing all keys from both inputs, with `obj2` values winning conflicts.
**See:** override for defaults-style merging where the second argument wins on missing keys only
```ts
// Deep merge with obj2 winning on shared keys
import { merge } from 'objectenvy';
const config1 = { port: 3000, log: { level: 'info' } };
const config2 = { log: { path: '/var/log' }, debug: true };
const merged = merge(config1, config2);

<!-- truncated -->
