import type {
  CamelCasedPropertiesDeep,
  ScreamingSnakeCase,
  Simplify,
  UnionToIntersection,
  UppercaseLetter
} from 'type-fest';

/**
 * Flatten nested object paths with SCREAMING_SNAKE_CASE keys
 */
type FlattenToEnv<T, Prefix extends string = ''> = T extends object
  ? {
      [K in keyof T & string]: T[K] extends object
        ? FlattenToEnv<T[K], `${Prefix}${Prefix extends '' ? '' : '_'}${ScreamingSnakeCase<K>}`>
        : Record<
            `${Prefix}${Prefix extends '' ? '' : '_'}${ScreamingSnakeCase<K>}`,
            UncoercedType<T[K]>
          >;
    }[keyof T & string]
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
export type ToEnv<T> = Simplify<UnionToIntersection<FlattenToEnv<T>>>;

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
export type FromEnv<T> = CamelCasedPropertiesDeep<CoercedEnv<T>>;

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

type InternalBooleanString =
  | 'true'
  | 'false'
  | 'n'
  | 'y'
  | 'no'
  | 'yes'
  | 'True'
  | 'False'
  | 'No'
  | 'Yes';
export type BooleanString = Simplify<Uppercase<InternalBooleanString> | InternalBooleanString>;

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
    : string;
