import { describe, it, expectTypeOf } from 'vitest';
import type {
  ToEnv,
  FromEnv,
  WithPrefix,
  WithoutPrefix,
  SchemaToEnv,
  BooleanString,
  NumberString
} from './typeUtils.js';
import { z } from 'zod';

describe('Type Utilities', () => {
  describe('ToEnv', () => {
    it('converts flat config to env keys', () => {
      type Config = {
        port: number;
        debug: boolean;
      };

      type Env = ToEnv<Config>;

      expectTypeOf<Env>().toEqualTypeOf<{
        PORT: NumberString;
        DEBUG: BooleanString;
      }>();
    });

    it('converts nested config to flat env keys', () => {
      type Config = {
        portNumber: number;
        log: {
          level: string;
          path: string;
        };
      };

      type Env = ToEnv<Config>;

      expectTypeOf<Env>().toEqualTypeOf<{
        PORT_NUMBER: NumberString;
        LOG_LEVEL: string;
        LOG_PATH: string;
      }>();
    });

    it('handles deeply nested config', () => {
      type Config = {
        database: {
          connection: {
            host: string;
            port: number;
          };
        };
      };

      type Env = ToEnv<Config>;

      expectTypeOf<Env>().toEqualTypeOf<{
        DATABASE_CONNECTION_HOST: string;
        DATABASE_CONNECTION_PORT: `${number}`;
      }>();
    });

    it('preserves string literals', () => {
      type Config = {
        environment: 'development' | 'production';
        logLevel: 'debug' ;
        host: string;
      };

      type Env = ToEnv<Config>;

      expectTypeOf<Env>().toEqualTypeOf<{
        ENVIRONMENT: 'development' | 'production',
        LOG_LEVEL: 'debug',
        HOST: string;
      }>();
    });

    it('preserves template literal types', () => {
      type Config = {
        apiUrl: `https://${string}`;
        version: `v${number}`;
        tag: string;
      };

      type Env = ToEnv<Config>;

      expectTypeOf<Env>().toEqualTypeOf<{
        API_URL: `https://${string}`;
        VERSION: `v${number}`;
        TAG: string;
      }>();
    });
  });

  describe('FromEnv', () => {
    it('converts env keys to camelCase', () => {
      type Env = {
        PORT_NUMBER: NumberString;
        LOG_LEVEL: string;
      };

      type Config = FromEnv<Env>;

      expectTypeOf<Config>().toEqualTypeOf<{
        portNumber: number;
        logLevel: string;
      }>();
    });
  });

  describe('WithPrefix', () => {
    it('adds prefix to env keys', () => {
      type Env = {
        PORT: string;
        DEBUG: string;
      };

      type PrefixedEnv = WithPrefix<Env, 'APP'>;

      expectTypeOf<PrefixedEnv>().toEqualTypeOf<{
        APP_PORT: string;
        APP_DEBUG: string;
      }>();
    });
  });

  describe('WithoutPrefix', () => {
    it('removes prefix from env keys', () => {
      type Env = {
        APP_PORT: string;
        APP_DEBUG: string;
        OTHER: string;
      };

      type UnprefixedEnv = WithoutPrefix<Env, 'APP'>;

      expectTypeOf<UnprefixedEnv>().toEqualTypeOf<{
        PORT: string;
        DEBUG: string;
      }>();
    });
  });

  describe('SchemaToEnv', () => {
    it('extracts env type from Zod schema', () => {
      const schema = z.object({
        port: z.number(),
        log: z.object({
          level: z.string()
        })
      });

      type Env = SchemaToEnv<z.infer<typeof schema>>;

      expectTypeOf<Env>().toEqualTypeOf<{
        PORT: NumberString;
        LOG_LEVEL: string;
      }>();
    });
  });
});
