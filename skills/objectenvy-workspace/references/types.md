# Types & Enums

## Types

### `ObjectEnvyOptions`

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
