# Functions

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
