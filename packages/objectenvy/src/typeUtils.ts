import type {
  CamelCase,
  PascalCase,
  ScreamingSnakeCase,
  Simplify,
  UnionToIntersection
} from 'type-fest';

type Primitive = string | number | boolean;

// Depth-limited decrement map to prevent runaway instantiation
type Depth = 0 | 1 | 2 | 3 | 4 | 5;
type Dec<D extends Depth> = D extends 5
  ? 4
  : D extends 4
    ? 3
    : D extends 3
      ? 2
      : D extends 2
        ? 1
        : 0;

type SplitKey<S extends string, D extends Depth = 5> = D extends 0
  ? [S]
  : S extends `${infer Head}_${infer Tail}`
    ? Head extends ''
      ? SplitKey<Tail, Dec<D>>
      : [Head, ...SplitKey<Tail, Dec<D>>]
    : [S];

type NormalizedSegment<S extends string> = CamelCase<Lowercase<S>>;

type BuildNested<Path extends readonly string[], V> = Path extends []
  ? V
  : Path extends [infer Head, ...infer Rest]
    ? Head extends string
      ? { [K in NormalizedSegment<Head>]: BuildNested<Rest extends string[] ? Rest : [], V> }
      : never
    : V;

type FirstSegment<S extends string> = S extends `${infer Head}_${string}` ? Head : never;

type HasSibling<K extends string, Keys extends string> =
  FirstSegment<K> extends infer S extends string
    ? Extract<Exclude<Keys, K>, `${S}_${string}`> extends never
      ? false
      : true
    : false;

/**
 * Flatten nested object paths with SCREAMING_SNAKE_CASE keys
 */
type FlattenToEnv<T, Prefix extends string = '', D extends Depth = 5> =
  // Stop recursion at depth 0 to keep types finite
  D extends 0
    ? Prefix extends ''
      ? Record<string, string>
      : Record<Prefix, string>
    : // Arrays serialize to comma-separated strings at runtime (check before object)
      [T] extends [Array<unknown>]
      ? Prefix extends ''
        ? never
        : Record<Prefix, string>
      : // Objects recurse through keys (check before primitives, use tuple to prevent distribution)
        [T] extends [object]
        ? {
            [K in keyof T & string]: FlattenToEnv<
              T[K],
              `${Prefix}${Prefix extends '' ? '' : '_'}${ScreamingSnakeCase<K>}`,
              Dec<D>
            >;
          }[keyof T & string]
        : // Primitives (using tuple to prevent distribution over unions)
          [T] extends [Primitive]
          ? Prefix extends ''
            ? never
            : Record<Prefix, UncoercedType<T>>
          : never;

/**
 * Merge union of records into intersection
 */

/**
 * Convert a nested camelCase config type to a flat `SCREAMING_SNAKE_CASE` env record, preserving
 * string literal and template literal types.
 *
 * @remarks
 * `ToEnv` recursively traverses the config type `T`, joining key segments with underscores and
 * uppercasing them (`portNumber` → `PORT_NUMBER`, `log.level` → `LOG_LEVEL`). Value types are
 * converted via `UncoercedType`: `boolean` → `BooleanString`, `number` → `NumberString`,
 * `string` → `string` (literal unions are preserved). Arrays are serialized as `string` (they
 * become comma-joined at runtime via `envy()`).
 *
 * Recursion is capped at depth 5 to prevent TypeScript from hanging on deeply nested schemas.
 * For configs deeper than 5 levels, the type degrades to `Record<string, string>` at that level.
 *
 * @typeParam T - The nested camelCase config type to convert.
 * @typeParam D - Internal recursion depth counter (do not set manually).
 *
 * @useWhen
 * - You want compile-time validation that your `.env.example` file has the correct keys.
 * - You're typing the argument to `child_process.spawn({ env: ... })` with static guarantees.
 * - You want IDE autocomplete for env variable names derived from your config type.
 *
 * @avoidWhen
 * - Your config type is recursive (tree structures, linked lists) — use a simpler mapped type.
 * - You need more than 5 levels of nesting — the type degrades silently at depth 5.
 *
 * @pitfalls
 * - NEVER use `ToEnv` on config types that contain non-serialisable values (Date, Map, Set) —
 *   BECAUSE the type utility models them as `string`, masking type errors at compile time even
 *   though `envy()` will produce `'[object Object]'` at runtime.
 * - NEVER manually set the `D` depth parameter — BECAUSE it exists solely to bound recursion;
 *   overriding it can cause TypeScript to instantiate the type incorrectly.
 *
 * @example
 * import type { ToEnv } from 'objectenvy';
 *
 * type Config = {
 *   portNumber: number;
 *   log: {
 *     level: 'debug' | 'info' | 'warn' | 'error';
 *     path: string;
 *   };
 *   apiUrl: `https://${string}`;
 * };
 *
 * type Env = ToEnv<Config>;
 * // {
 * //   PORT_NUMBER: `${number}`;
 * //   LOG_LEVEL: 'debug' | 'info' | 'warn' | 'error';
 * //   LOG_PATH: string;
 * //   API_URL: `https://${string}`;
 * // }
 *
 * @category Type Utilities
 * @see {@link FromEnv} for the inverse transformation
 * @see {@link SchemaToEnv} for extracting the env type from a Zod schema
 */
export type ToEnv<T, D extends Depth = 5> = Simplify<UnionToIntersection<FlattenToEnv<T, '', D>>>;

/**
 * Convert a flat `SCREAMING_SNAKE_CASE` env record type to a nested camelCase config type.
 *
 * @remarks
 * `FromEnv` examines the keys of `T` and applies smart nesting: if two or more keys share the same
 * first segment (e.g., `LOG_LEVEL` and `LOG_PATH` share `LOG`), those keys are grouped under a
 * nested object (`log: { level, path }`). Keys without siblings remain flat with the full key
 * camelCased (`PORT_NUMBER` → `portNumber`).
 *
 * Value types are passed through `CoercedType`: literal `BooleanString` unions become `boolean`,
 * literal `NumberString` values become `number`, and other strings stay as-is.
 *
 * Recursion is capped at depth 5. The type is a compile-time companion to the runtime behaviour of
 * `objectify()` — the two should produce equivalent shapes for well-formed env objects.
 *
 * @typeParam T - A flat env record type with `SCREAMING_SNAKE_CASE` keys.
 * @typeParam D - Internal recursion depth counter (do not set manually).
 *
 * @useWhen
 * - You have a `const`-asserted env literal and want to derive the config type without a Zod schema.
 * - You're writing type tests (`expectTypeOf`) to verify `objectify()` output shape.
 * - You want the config type inferred from a `satisfies EnvLike` env object.
 *
 * @avoidWhen
 * - The env object has dynamic (non-literal) keys — `FromEnv<Record<string, string>>` yields
 *   `Record<string, string>` rather than a useful nested type.
 * - You need validated values (not just typed) — use a Zod schema with `objectify()` instead.
 *
 * @pitfalls
 * - NEVER rely on `FromEnv` for nesting when keys share a prefix that is in `nonNestingPrefixes` —
 *   BECAUSE the type utility does not know about `nonNestingPrefixes`; the runtime and type may
 *   disagree for `MAX_*`, `IS_*`, etc. prefixes.
 * - NEVER pass a `process.env` type directly — BECAUSE `process.env` is `NodeJS.ProcessEnv`
 *   (`Record<string, string | undefined>`), which has no literal keys; `FromEnv` needs a
 *   `const`-asserted or explicitly typed object to produce useful output.
 *
 * @example
 * import type { FromEnv } from 'objectenvy';
 *
 * // Flat keys stay flat
 * type Env1 = { PORT_NUMBER: string };
 * type Config1 = FromEnv<Env1>;
 * // { portNumber: string }
 *
 * // Shared prefix triggers nesting
 * type Env2 = { LOG_LEVEL: string; LOG_PATH: string };
 * type Config2 = FromEnv<Env2>;
 * // { log: { level: string; path: string } }
 *
 * @category Type Utilities
 * @see {@link ToEnv} for the inverse transformation
 */
export type FromEnv<T, D extends Depth = 5> = Simplify<
  UnionToIntersection<
    {
      [K in keyof T & string]: HasSibling<K, keyof T & string> extends true
        ? BuildNested<SplitKey<K, D>, CoercedType<T[K]>>
        : { [P in CamelCase<Lowercase<K>>]: CoercedType<T[K]> };
    }[keyof T & string]
  >
>;

/**
 * Add a `Prefix_` to all keys in an env record type.
 *
 * @remarks
 * Maps every string key `K` in `T` to `` `${Prefix}_${K}` ``, preserving value types. Non-string
 * keys are dropped (`never`). Useful for namespacing env types when combining multiple services
 * or packages that each export their own env shapes.
 *
 * @typeParam T - The source env record type.
 * @typeParam Prefix - The string prefix to prepend (without trailing underscore).
 *
 * @useWhen
 * - You're composing env types from multiple packages and need to namespace them with a prefix.
 * - You want to generate the prefixed env shape for documentation or `.env.example` scaffolding.
 *
 * @avoidWhen
 * - You need to add the prefix at runtime — this is a type-level only utility; use string
 *   interpolation in your env object builder.
 *
 * @pitfalls
 * - NEVER use a `Prefix` that already ends with `_` — BECAUSE the type concatenates
 *   `${Prefix}_${K}`, resulting in double underscores (`APP__PORT`).
 *
 * @example
 * import type { WithPrefix } from 'objectenvy';
 * type Env = { PORT: string; DEBUG: string };
 * type PrefixedEnv = WithPrefix<Env, 'APP'>;
 * // { APP_PORT: string; APP_DEBUG: string }
 *
 * @category Type Utilities
 * @see {@link WithoutPrefix} for the inverse operation
 */
export type WithPrefix<T, Prefix extends string> = {
  [K in keyof T as K extends string ? `${Prefix}_${K}` : never]: T[K];
};

/**
 * Remove a `Prefix_` from all keys in an env record type, keeping only the matching keys.
 *
 * @remarks
 * Conditionally maps each key `K` in `T`: if `K` matches `` `${Prefix}_${Rest}` ``, the key becomes
 * `Rest` and the value type is preserved. Keys that do not start with `Prefix_` are dropped
 * (mapped to `never`). This is the type-level counterpart to the runtime `prefix` option of
 * `objectify()`.
 *
 * @typeParam T - The source env record type.
 * @typeParam Prefix - The prefix to remove (without trailing underscore).
 *
 * @useWhen
 * - You want to scope a broader env type to a specific namespace at the type level.
 * - You're computing the type that `objectify({ prefix: '...' })` would operate on.
 *
 * @avoidWhen
 * - You need runtime prefix stripping — use the `prefix` option of `objectify()` instead.
 *
 * @pitfalls
 * - NEVER use a `Prefix` that ends with `_` — BECAUSE the pattern is `` `${Prefix}_${Rest}` ``,
 *   which would match keys like `APP__PORT` instead of `APP_PORT`.
 *
 * @example
 * import type { WithoutPrefix } from 'objectenvy';
 * type Env = { APP_PORT: string; APP_DEBUG: string; OTHER_VAR: string };
 * type AppEnv = WithoutPrefix<Env, 'APP'>;
 * // { PORT: string; DEBUG: string }
 * // (OTHER_VAR is excluded — no APP_ prefix)
 *
 * @category Type Utilities
 * @see {@link WithPrefix} for the inverse operation
 */
export type WithoutPrefix<T, Prefix extends string> = {
  [K in keyof T as K extends `${Prefix}_${infer Rest}` ? Rest : never]: T[K];
};

/**
 * Extract the flat `SCREAMING_SNAKE_CASE` env record type from a Zod schema or a plain config type.
 *
 * @remarks
 * If `T` is a Zod schema (has `_output`), `SchemaToEnv` extracts the inferred output type and
 * passes it to `ToEnv`. Otherwise, `T` is treated as a plain config type and passed directly to
 * `ToEnv`. This makes the utility work for both `SchemaToEnv<typeof zodSchema>` and
 * `SchemaToEnv<ConfigType>` patterns.
 *
 * @typeParam T - A Zod schema (`z.ZodType`) or a plain TypeScript config type.
 *
 * @useWhen
 * - You have a Zod schema and want to derive the corresponding env variable type without manually
 *   writing `ToEnv<z.infer<typeof schema>>`.
 * - You want to statically validate `.env.example` generators against a Zod schema.
 *
 * @avoidWhen
 * - You already have `z.infer<typeof schema>` available — use `ToEnv<z.infer<typeof schema>>`
 *   directly for clarity.
 *
 * @pitfalls
 * - NEVER pass a Zod v4 schema if the `_output` field is structured differently from v3 — BECAUSE
 *   `SchemaToEnv` uses `_output` heuristically; if the Zod version changes the field name, the
 *   type falls back to treating the schema object itself as a config type.
 *
 * @example
 * import type { SchemaToEnv } from 'objectenvy';
 * import { z } from 'zod';
 *
 * const schema = z.object({
 *   port: z.number(),
 *   log: z.object({ level: z.string() })
 * });
 *
 * type Env = SchemaToEnv<typeof schema>;
 * // { PORT: `${number}`; LOG_LEVEL: string }
 *
 * @category Type Utilities
 * @see {@link ToEnv} for direct use with plain config types
 */
export type SchemaToEnv<T> = T extends { _output: infer O } ? ToEnv<O> : ToEnv<T>;

type InternalBooleanString = 'true' | 'false' | 'n' | 'y' | 'no' | 'yes' | 'on' | 'off';
export type BooleanString = Simplify<
  | InternalBooleanString
  | Uppercase<InternalBooleanString>
  | PascalCase<Lowercase<InternalBooleanString>, { preserveConsecutiveUppercase: true }>
>;

export type NumberString = `${number}`;

export type CoercedType<T> = T extends BooleanString
  ? boolean
  : T extends NumberString
    ? number
    : string;

export type CoercedEnv<T> = {
  [K in keyof T]: CoercedType<T[K]>;
};

export type UncoercedType<T> = T extends boolean
  ? BooleanString
  : T extends number
    ? NumberString
    : T extends string
      ? T
      : string;
