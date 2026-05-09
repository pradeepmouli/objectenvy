# Functions

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
// { port: 3000, log: { level: 'info', path: '/var/log' }, debug: true }
```
```ts
// Concatenate arrays from two sources
import { merge } from 'objectenvy';
const config1 = { tags: ['prod', 'v1'] };
const config2 = { tags: ['api'] };
const merged = merge(config1, config2, { arrayMergeStrategy: 'concat' });
// { tags: ['prod', 'v1', 'api'] }
```
```ts
// Deduplicate while merging host lists
import { merge } from 'objectenvy';
const config1 = { hosts: ['localhost', 'example.com'] };
const config2 = { hosts: ['example.com', 'api.example.com'] };
const merged = merge(config1, config2, { arrayMergeStrategy: 'concat-unique' });
// { hosts: ['localhost', 'example.com', 'api.example.com'] }
```
