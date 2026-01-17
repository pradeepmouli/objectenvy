import type {
  CamelCase,
  PascalCase,
  ScreamingSnakeCase,
  Simplify,
  UnionToIntersection,
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

type HasSibling<K extends string, Keys extends string> = FirstSegment<K> extends infer S extends string
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
 * Convert a nested camelCase config type to a flat SCREAMING_SNAKE_CASE env record.
 *
 * @example
 * type Config = {
 *   portNumber: number;
 *   log: {
 *     level: string;
 *     path: string;
 *   };
 * };
 *
 * type Env = ToEnv<Config>;
 * // {
 * //   PORT_NUMBER: string;
 * //   LOG_LEVEL: string;
 * //   LOG_PATH: string;
 * // }
 */
export type ToEnv<T, D extends Depth = 5> = Simplify<UnionToIntersection<FlattenToEnv<T, '', D>>>;

/**
 * Convert a flat SCREAMING_SNAKE_CASE env record to nested camelCase config.
 * Uses type-fest's CamelCasedPropertiesDeep under the hood.
 *
 * Note: This only transforms keys, not structure. For nested structures,
 * use a Zod schema with configEnvy().
 *
 * @example
 * type Env = {
 *   PORT_NUMBER: string;
 *   LOG_LEVEL: string;
 * };
 *
 * type Config = FromEnv<Env>;
 * // { portNumber: string; logLevel: string }
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
 * Add a prefix to all keys in an env type
 *
 * @example
 * type Env = { PORT: string; DEBUG: string };
 * type PrefixedEnv = WithPrefix<Env, 'APP'>;
 * // { APP_PORT: string; APP_DEBUG: string }
 */
export type WithPrefix<T, Prefix extends string> = {
  [K in keyof T as K extends string ? `${Prefix}_${K}` : never]: T[K];
};

/**
 * Remove a prefix from all keys in an env type
 *
 * @example
 * type Env = { APP_PORT: string; APP_DEBUG: string };
 * type UnprefixedEnv = WithoutPrefix<Env, 'APP'>;
 * // { PORT: string; DEBUG: string }
 */
export type WithoutPrefix<T, Prefix extends string> = {
  [K in keyof T as K extends `${Prefix}_${infer Rest}` ? Rest : never]: T[K];
};

/**
 * Extract env type from a Zod schema
 *
 * @example
 * const schema = z.object({
 *   port: z.number(),
 *   log: z.object({ level: z.string() })
 * });
 *
 * type Env = SchemaToEnv<typeof schema>;
 * // { PORT: string; LOG_LEVEL: string }
 */
export type SchemaToEnv<T> = T extends { _output: infer O } ? ToEnv<O> : ToEnv<T>;

type InternalBooleanString = 'true' | 'false' | 'n' | 'y' | 'no' | 'yes' | 'on' | 'off';
export type BooleanString = Simplify<InternalBooleanString | Uppercase<InternalBooleanString> | PascalCase<Lowercase<InternalBooleanString>, { preserveConsecutiveUppercase: true }>>;

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
      : string