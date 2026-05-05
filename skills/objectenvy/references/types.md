# Types & Enums

## Type Utilities

### `ConfigObject`
Nested configuration object with string keys and recursively nested values.
Exported as `ConfigObject` — represents a parsed environment config tree.
```ts
{ [key: string]: ConfigValue }
```

### `ConfigValue`
A single configuration value — either a primitive string/number/boolean,
an array of primitives/objects, or a nested `ConfigObject`.
Exported as `ConfigValue`.
```ts
EnviablePrimitive | ConfigObject | EnviableArray
```

### `ArrayMergeStrategy`
Strategy for merging arrays when combining configuration objects via `merge()` or `override()`.
```ts
"replace" | "concat" | "concat-unique"
```

### `ToEnv`
Convert a nested camelCase config type to a flat `SCREAMING_SNAKE_CASE` env record, preserving
string literal and template literal types.
```ts
Simplify<UnionToIntersection<FlattenToEnv<T, "", D>>>
```

### `FromEnv`
Convert a flat `SCREAMING_SNAKE_CASE` env record type to a nested camelCase config type.
```ts
Simplify<UnionToIntersection<{ [K in keyof T & string]: HasSibling<K, keyof T & string> extends true ? BuildNested<SplitKey<K, D>, CoercedType<T[K]>> : { [P in CamelCase<Lowercase<K>>]: CoercedType<T[K]> } }[keyof T & string]>>
```

### `WithPrefix`
Add a `Prefix_` to all keys in an env record type.
```ts
{ [K in keyof T as K extends string ? `${Prefix}_${K}` : never]: T[K] }
```

### `WithoutPrefix`
Remove a `Prefix_` from all keys in an env record type, keeping only the matching keys.
```ts
{ [K in keyof T as K extends `${Prefix}_${infer Rest}` ? Rest : never]: T[K] }
```

### `SchemaToEnv`
Extract the flat `SCREAMING_SNAKE_CASE` env record type from a Zod schema or a plain config type.
```ts
T extends { _output: infer O } ? ToEnv<O> : ToEnv<T>
```
