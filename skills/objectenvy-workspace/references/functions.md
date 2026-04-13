# Functions

## objectEnvy

### `objectify`
Create a typed configuration object from environment variables.
Automatically nests only when multiple entries share a common prefix.
```ts
objectify<T>(): T
```
**Returns:** `T`
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
// Smart nesting - only nests when multiple entries share a prefix
// PORT_NUMBER=1234 LOG_LEVEL=debug LOG_PATH=/var/log
const config = objectify();
// Returns: { portNumber: 1234, log: { level: 'debug', path: '/var/log' } }
// Note: portNumber is flat (only one PORT_* entry), log is nested (multiple LOG_* entries)
```
```ts
// With prefix filtering
// APP_PORT=3000 APP_DEBUG=true OTHER_VAR=ignored
const config = objectify({ prefix: 'APP' });
// Returns: { port: 3000, debug: true }
```
```ts
// With Zod schema for validation and type safety
const schema = z.object({
  portNumber: z.number(),
  log: z.object({
    level: z.enum(['debug', 'info', 'warn', 'error']),
    path: z.string()
  })
});
const config = objectify({ schema });
// Returns typed config with validation
```
```ts
// With type-fest Schema (plain object) for type safety without validation
const schema = {
  portNumber: 0,
  log: {
    level: '',
    path: ''
  }
} as const;
const config = objectify({ schema });
// Returns typed config without validation
```

### `objectEnvy`
Create a configuration loader with preset options.
Returns both objectify and envy functions with memoization.
```ts
objectEnvy(defaultOptions: Omit<ObjectEnvyOptions, "schema">): { objectify: (overrides?: Partial<Omit<ObjectEnvyOptions<ConfigObject>, "schema">>) => ConfigObject; envy: (config: T) => { [KeyType in string | number | symbol]: UnionToIntersection<[T] extends [unknown[]] ? never : [T] extends [object] ? { [K in string]: [(...)] extends [(...)] ? (...) extends (...) ? (...) : (...) : (...) extends (...) ? (...) : (...) }[keyof T & string] : [T] extends [Primitive] ? never : never>[KeyType] } }
```
**Parameters:**
- `defaultOptions: Omit<ObjectEnvyOptions, "schema">`
**Returns:** `{ objectify: (overrides?: Partial<Omit<ObjectEnvyOptions<ConfigObject>, "schema">>) => ConfigObject; envy: (config: T) => { [KeyType in string | number | symbol]: UnionToIntersection<[T] extends [unknown[]] ? never : [T] extends [object] ? { [K in string]: [(...)] extends [(...)] ? (...) extends (...) ? (...) : (...) : (...) extends (...) ? (...) : (...) }[keyof T & string] : [T] extends [Primitive] ? never : never>[KeyType] } }`
**Overloads:**
```ts
objectEnvy<T>(defaultOptions: ObjectEnvyOptions<T> & { schema: T | ZodObject<any, $strip> }): { objectify: (overrides?: Partial<Omit<ObjectEnvyOptions<T>, "schema">>) => T; envy: (config: T) => { [KeyType in string | number | symbol]: UnionToIntersection<[T] extends [unknown[]] ? never : [T] extends [object] ? { [K in string]: [(...)] extends [(...)] ? (...) extends (...) ? (...) : (...) : (...) extends (...) ? (...) : (...) }[keyof T & string] : [T] extends [Primitive] ? never : never>[KeyType] } }
```
```ts
const { objectify: loadConfig, envy: toEnv } = objectEnvy({
  prefix: 'APP',
  schema: appConfigSchema
});

const config = loadConfig(); // Uses preset options with caching
const testConfig = loadConfig({ env: testEnv }); // Override env for testing
const env = toEnv(config); // Convert config back to env format
```

### `envy`
Convert a configuration object back to environment variable format.
Reverses the transformation done by objectify().
Converts nested camelCase keys to flat SCREAMING_SNAKE_CASE env keys.
```ts
envy<T>(config: T): { [KeyType in string | number | symbol]: UnionToIntersection<[T] extends [unknown[]] ? never : [T] extends [object] ? { [K in string]: [T[K]] extends [unknown[]] ? `${ScreamingSnakeCase<(...), (...)>}` extends "" ? never : Record<`${(...)}`, string> : [(...)[(...)]] extends [object] ? { [K in (...)]: (...) }[(...) & (...)] : [(...)] extends [(...)] ? (...) extends (...) ? (...) : (...) : never }[keyof T & string] : [T] extends [Primitive] ? never : never>[KeyType] }
```
**Parameters:**
- `config: T`
**Returns:** `{ [KeyType in string | number | symbol]: UnionToIntersection<[T] extends [unknown[]] ? never : [T] extends [object] ? { [K in string]: [T[K]] extends [unknown[]] ? `${ScreamingSnakeCase<(...), (...)>}` extends "" ? never : Record<`${(...)}`, string> : [(...)[(...)]] extends [object] ? { [K in (...)]: (...) }[(...) & (...)] : [(...)] extends [(...)] ? (...) extends (...) ? (...) : (...) : never }[keyof T & string] : [T] extends [Primitive] ? never : never>[KeyType] }`
```ts
const config = {
  portNumber: 3000,
  log: {
    level: 'debug',
    path: '/var/log'
  }
};

const env = envy(config);
// {
//   PORT_NUMBER: '3000',
//   LOG_LEVEL: 'debug',
//   LOG_PATH: '/var/log'
// }
```

### `override`
Recursively override default values with a config object with smart array handling
```ts
override<T>(defaults: T, config: Partial<T>, options: MergeOptions): T
```
**Parameters:**
- `defaults: T` — The default values to start with
- `config: Partial<T>` — The configuration object to override defaults
- `options: MergeOptions` — default: `{}` — Merge options including array merge strategy
**Returns:** `T` — The defaults with config overrides applied
```ts
const defaults = { port: 3000, log: { level: 'info', path: '/var/log' } };
const config = { log: { level: 'debug' } };
const finalConfig = override(defaults, config);
// finalConfig = { port: 3000, log: { level: 'debug', path: '/var/log' } }
```
```ts
// Concatenate arrays instead of replacing
const defaults = { port: 3000, tags: ['v1'] };
const config = { tags: ['prod'] };
const finalConfig = override(defaults, config, { arrayMergeStrategy: 'concat' });
// finalConfig = { port: 3000, tags: ['prod', 'v1'] }
```

### `merge`
Recursively merge two configuration objects with smart array handling
```ts
merge<T, U>(obj1: T, obj2: U, options: MergeOptions): Merge<T, U>
```
**Parameters:**
- `obj1: T` — The first configuration object
- `obj2: U` — The second configuration object to merge into the first
- `options: MergeOptions` — default: `{}` — Merge options including array merge strategy
**Returns:** `Merge<T, U>` — The merged configuration object
```ts
// Default behavior (replace arrays)
const config1 = { port: 3000, log: { level: 'info' } };
const config2 = { log: { path: '/var/log' }, debug: true };
const merged = merge(config1, config2);
// merged = { port: 3000, log: { level: 'info', path: '/var/log' }, debug: true }
```
```ts
// Concatenate arrays
const config1 = { tags: ['prod', 'v1'] };
const config2 = { tags: ['api'] };
const merged = merge(config1, config2, { arrayMergeStrategy: 'concat' });
// merged = { tags: ['prod', 'v1', 'api'] }
```
```ts
// Concatenate and deduplicate arrays
const config1 = { hosts: ['localhost', 'example.com'] };
const config2 = { hosts: ['example.com', 'api.example.com'] };
const merged = merge(config1, config2, { arrayMergeStrategy: 'concat-unique' });
// merged = { hosts: ['localhost', 'example.com', 'api.example.com'] }
```

## utils

### `toCamelCase`
Convert SCREAMING_SNAKE_CASE to camelCase
```ts
toCamelCase(str: string): string
```
**Parameters:**
- `str: string`
**Returns:** `string`

### `toSnakeCase`
Convert camelCase to SCREAMING_SNAKE_CASE
```ts
toSnakeCase(str: string): string
```
**Parameters:**
- `str: string`
**Returns:** `string`

### `coerceValue`
Coerce a string value to the appropriate type
Supports comma-separated values which will be parsed as arrays
```ts
coerceValue(value: string): string | number | boolean | (string | number | boolean)[]
```
**Parameters:**
- `value: string`
**Returns:** `string | number | boolean | (string | number | boolean)[]`
