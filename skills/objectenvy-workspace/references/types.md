# Types & Enums

## Types

### `ObjectEnvyOptions`
**Properties:**
- `prefix: string` (optional) — Filter environment variables by prefix.
e.g., "APP" will only include variables starting with "APP_"
- `env: EnvLike` (optional) — Custom environment object. Defaults to process.env
- `schema: T extends ConfigObject ? T | ZodObject<any, $strip> : never` (optional) — Schema for validation and type inference.
Can be either a Zod schema or a plain object with the same structure as your config.
Zod schemas will validate, plain objects provide type inference only.
- `coerce: boolean` (optional) — Whether to automatically coerce values to numbers/booleans
- `delimiter: string` (optional) — Delimiter used to indicate nesting depth.
By default, each underscore creates a new nesting level.
Set to '__' to use double underscores for nesting.
- `nonNestingPrefixes: string[]` (optional) — Prefix segments that should not trigger nesting even when multiple entries share the prefix.
For example, keys starting with 'max', 'min', 'is', 'enable', 'disable' will stay flat:
MAX_CONNECTIONS, MAX_TIMEOUT -> { maxConnections, maxTimeout }
IS_DEBUG, IS_VERBOSE -> { isDebug, isVerbose }
- `include: string[]` (optional) — Include only environment variables matching these patterns.
Matches against the normalized key (after prefix removal, in camelCase).
If specified, only variables matching at least one pattern will be included.
- `exclude: string[]` (optional) — Exclude environment variables matching these patterns.
Matches against the normalized key (after prefix removal, in camelCase).
Variables matching any pattern will be excluded.

### `ConfigObject`
```ts
{ [key: string]: ConfigValue }
```

### `ConfigValue`
```ts
EnviablePrimitive | ConfigObject | EnviableArray
```

### `MergeOptions`
Options for controlling merge behavior
**Properties:**
- `arrayMergeStrategy: ArrayMergeStrategy` (optional) — Strategy for merging arrays

### `ArrayMergeStrategy`
Strategy for merging arrays when combining configuration objects
- 'replace': Replace the first array with the second (default)
- 'concat': Concatenate arrays together
- 'concat-unique': Concatenate and deduplicate based on primitive value equality
```ts
"replace" | "concat" | "concat-unique"
```

### `ToEnv`
Convert a nested camelCase config type to a flat SCREAMING_SNAKE_CASE env record.
```ts
Simplify<UnionToIntersection<FlattenToEnv<T, "", D>>>
```

### `FromEnv`
Convert a flat SCREAMING_SNAKE_CASE env record to nested camelCase config.
Uses type-fest's CamelCasedPropertiesDeep under the hood.

Note: This only transforms keys, not structure. For nested structures,
use a Zod schema with configEnvy().
```ts
Simplify<UnionToIntersection<{ [K in keyof T & string]: HasSibling<K, keyof T & string> extends true ? BuildNested<SplitKey<K, D>, CoercedType<T[K]>> : { [P in CamelCase<Lowercase<K>>]: CoercedType<T[K]> } }[keyof T & string]>>
```

### `WithPrefix`
Add a prefix to all keys in an env type
```ts
{ [K in keyof T as K extends string ? `${Prefix}_${K}` : never]: T[K] }
```

### `WithoutPrefix`
Remove a prefix from all keys in an env type
```ts
{ [K in keyof T as K extends `${Prefix}_${infer Rest}` ? Rest : never]: T[K] }
```

### `SchemaToEnv`
Extract env type from a Zod schema
```ts
T extends { _output: infer O } ? ToEnv<O> : ToEnv<T>
```
