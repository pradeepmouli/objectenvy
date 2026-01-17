import { describe, it, expect, expectTypeOf } from 'vitest';
import { z } from 'zod';
import { objectify, objectEnvy, envy, override, merge } from './objectEnvy.js';
import type { ToEnv, FromEnv } from './typeUtils.js';
import type { EnvLike } from './types.js';

describe('objectify', () => {
  describe('FromEnv type mapping', () => {
    it('keeps single-prefix entries flat', () => {
      const env = {
        LOG_LEVEL: 'debug'
      } as const;

      type Result = FromEnv<typeof env>;
      expectTypeOf({} as Result).toEqualTypeOf<{ logLevel: string }>({} as any);
    });

    it('nests when multiple entries share a prefix', () => {
      const env = {
        LOG_LEVEL: 'debug',
        LOG_PATH: '/var/log'
      } as const;

      type Result = FromEnv<typeof env>;
      expectTypeOf({} as Result).toEqualTypeOf<{ log: { level: string; path: string } }>({} as any);
    });
  });

  describe('basic mapping', () => {
    it('maps simple env vars to flat config', () => {
      const env = {
        PORT: '3000',
        DEBUG: 'true'
      };
      const config = objectify({ env });
      expect(config).toEqual({
        port: 3000,
        debug: true
      });
    });

    it('keeps single SNAKE_CASE entry flat as camelCase', () => {
      const env = {
        PORT_NUMBER: '1234'
      } satisfies EnvLike;
      const config = objectify({ env });
      // Only one PORT_* entry, so it stays flat
      expect(config).toEqual({
        portNumber: 1234
      });
    });

    it('nests when multiple entries share a prefix', () => {
      const env = {
        LOG_LEVEL: 'debug',
        LOG_PATH: '/var/log'
      } satisfies EnvLike;
      const config = objectify({ env }) as FromEnv<typeof env>;
      // Multiple LOG_* entries, so they get nested
      expect(config).toEqual({
        log: {
          level: 'debug',
          path: '/var/log'
        }
      });
    });

    it('mixes flat and nested based on prefix count', () => {
      const env = {
        PORT_NUMBER: '1234',
        LOG_LEVEL: 'debug',
        LOG_PATH: '/var/log'
      };
      const config = objectify({ env });
      // PORT_NUMBER is flat (only one PORT_* entry)
      // LOG_* entries are nested (multiple)
      expect(config).toEqual({
        portNumber: 1234,
        log: {
          level: 'debug',
          path: '/var/log'
        }
      });
    });

    it('handles deeply nested structures when multiple entries share prefix', () => {
      const env = {
        DATABASE_CONNECTION_HOST: 'localhost',
        DATABASE_CONNECTION_PORT: '5432',
        DATABASE_CONNECTION_NAME: 'mydb'
      };
      const config = objectify({ env });
      // Multiple DATABASE_* entries, so they get nested
      expect(config).toEqual({
        database: {
          connection: {
            host: 'localhost',
            port: 5432,
            name: 'mydb'
          }
        }
      });
    });

    it('keeps deeply nested single entry flat', () => {
      const env = {
        DATABASE_CONNECTION_STRING: 'postgres://localhost'
      };
      const config = objectify({ env });
      // Only one DATABASE_* entry, stays flat
      expect(config).toEqual({
        databaseConnectionString: 'postgres://localhost'
      });
    });
  });

  describe('type coercion', () => {
    it('coerces numbers', () => {
      const env = {
        PORT: '3000',
        TIMEOUT: '5000',
        RATE: '0.5'
      };
      const config = objectify({ env });
      expect(config).toEqual({
        port: 3000,
        timeout: 5000,
        rate: 0.5
      });
    });

    it('coerces booleans', () => {
      const env = {
        DEBUG: 'true',
        VERBOSE: 'false',
        ENABLED: 'TRUE'
      };
      const config = objectify({ env });
      expect(config).toEqual({
        debug: true,
        verbose: false,
        enabled: true
      });
    });

    it('keeps strings as strings when appropriate', () => {
      const env = {
        HOST: 'localhost',
        PATH: '/var/log/app.log',
        NAME: 'my-app'
      };
      const config = objectify({ env });
      expect(config).toEqual({
        host: 'localhost',
        path: '/var/log/app.log',
        name: 'my-app'
      });
    });

    it('can disable coercion', () => {
      const env = {
        PORT: '3000',
        DEBUG: 'true'
      };
      const config = objectify({ env, coerce: false });
      expect(config).toEqual({
        port: '3000',
        debug: 'true'
      });
    });
  });

  describe('prefix filtering', () => {
    it('filters by prefix', () => {
      const env = {
        APP_PORT: '3000',
        APP_DEBUG: 'true',
        OTHER_VAR: 'ignored',
        RANDOM: 'also ignored'
      };
      const config = objectify({ env, prefix: 'APP' });
      expect(config).toEqual({
        port: 3000,
        debug: true
      });
    });

    it('handles nested keys with prefix when multiple share prefix', () => {
      const env = {
        APP_LOG_LEVEL: 'debug',
        APP_LOG_PATH: '/var/log',
        APP_DB_HOST: 'localhost'
      };
      const config = objectify({ env, prefix: 'APP' });
      // LOG has 2 entries, DB has 1 entry
      expect(config).toEqual({
        log: {
          level: 'debug',
          path: '/var/log'
        },
        dbHost: 'localhost'
      });
    });

    it('handles prefix with trailing underscore', () => {
      const env = {
        APP_PORT: '3000'
      };
      const config = objectify({ env, prefix: 'APP_' });
      expect(config).toEqual({
        port: 3000
      });
    });
  });

  describe('custom delimiter', () => {
    it('uses double underscore for nesting when multiple entries share prefix', () => {
      const env = {
        LOG__LEVEL: 'debug',
        LOG__FILE_PATH: '/var/log'
      };
      const config = objectify({ env, delimiter: '__' });
      expect(config).toEqual({
        log: {
          level: 'debug',
          filePath: '/var/log'
        }
      });
    });

    it('keeps single entry flat with double underscore delimiter', () => {
      const env = {
        DATABASE__CONNECTION_STRING: 'postgres://localhost'
      };
      const config = objectify({ env, delimiter: '__' });
      // Only one DATABASE__* entry
      expect(config).toEqual({
        databaseConnectionString: 'postgres://localhost'
      });
    });

    it('preserves single underscores as camelCase with double underscore delimiter', () => {
      const env = {
        DATABASE__CONNECTION_STRING: 'postgres://localhost',
        DATABASE__POOL_SIZE: '10'
      };
      const config = objectify({ env, delimiter: '__' });
      expect(config).toEqual({
        database: {
          connectionString: 'postgres://localhost',
          poolSize: 10
        }
      });
    });
  });

  describe('Zod schema validation', () => {
    it('validates config with schema', () => {
      const schema = z.object({
        port: z.number(),
        debug: z.boolean()
      });

      const env = {
        PORT: '3000',
        DEBUG: 'true'
      };

      const config = objectify({ env, schema });
      expect(config).toEqual({
        port: 3000,
        debug: true
      });
    });

    it('validates nested config with schema', () => {
      const schema = z.object({
        log: z.object({
          level: z.enum(['debug', 'info', 'warn', 'error']),
          path: z.string()
        })
      });

      const env = {
        LOG_LEVEL: 'debug',
        LOG_PATH: '/var/log'
      };

      const config = objectify({ env, schema });
      expect(config).toEqual({
        log: {
          level: 'debug',
          path: '/var/log'
        }
      });
    });

    it('throws on validation error', () => {
      const schema = z.object({
        port: z.number().min(1000)
      });

      const env = {
        PORT: '80'
      };

      expect(() => objectify({ env, schema })).toThrow();
    });

    it('provides type safety with schema', () => {
      const schema = z.object({
        portNumber: z.number(),
        log: z.object({
          level: z.string()
        })
      });

      const env = {
        PORT_NUMBER: '3000',
        LOG_LEVEL: 'info',
        LOG_PATH: '/var/log'
      };

      const config = objectify({ env, schema });
      type ExpectedConfig = z.infer<typeof schema>;

      // TypeScript should infer these types
      const port: number = (config as ExpectedConfig).portNumber;
      const level: string = (config as ExpectedConfig).log.level;

      expect(port).toBe(3000);
      expect(level).toBe('info');
    });

    it('schema guides nesting even for single entries', () => {
      // Without schema, a single LOG_LEVEL would become logLevel (flat)
      // With schema specifying log.level, it becomes nested
      const schema = z.object({
        log: z.object({
          level: z.string()
        })
      });

      const env = {
        LOG_LEVEL: 'debug'
      };

      const config = objectify({ env, schema });
      expect(config).toEqual({
        log: {
          level: 'debug'
        }
      });
    });

    it('schema allows mixing flat and nested based on schema shape', () => {
      const schema = z.object({
        portNumber: z.number(), // PORT_NUMBER -> portNumber (flat)
        log: z.object({
          // LOG_LEVEL -> log.level (nested)
          level: z.string()
        })
      });

      const env = {
        PORT_NUMBER: '3000',
        LOG_LEVEL: 'info'
      };

      const config = objectify({ env, schema });
      expect(config).toEqual({
        portNumber: 3000,
        log: {
          level: 'info'
        }
      });
    });

    it('schema handles deeply nested structures', () => {
      const schema = z.object({
        database: z.object({
          connection: z.object({
            host: z.string(),
            port: z.number()
          })
        })
      });

      const env = {
        DATABASE_CONNECTION_HOST: 'localhost',
        DATABASE_CONNECTION_PORT: '5432'
      };

      const config = objectify({ env, schema });
      expect(config).toEqual({
        database: {
          connection: {
            host: 'localhost',
            port: 5432
          }
        }
      });
    });

    it('schema with optional fields works correctly', () => {
      const schema = z.object({
        port: z.number(),
        debug: z.boolean().optional()
      });

      const env = {
        PORT: '3000'
      };

      const config = objectify({ env, schema });
      expect(config).toEqual({
        port: 3000
      });
    });

    it('schema with default values works correctly', () => {
      const schema = z.object({
        port: z.number(),
        debug: z.boolean().default(false)
      });

      const env = {
        PORT: '3000'
      };

      const config = objectify({ env, schema });
      expect(config).toEqual({
        port: 3000,
        debug: false
      });
    });
  });

  describe('complex scenarios', () => {
    it('handles a realistic app config with smart nesting', () => {
      const env = {
        APP_PORT: '3000',
        APP_HOST: '0.0.0.0',
        APP_LOG_LEVEL: 'info',
        APP_LOG_FORMAT: 'json',
        APP_DATABASE_HOST: 'localhost',
        APP_DATABASE_PORT: '5432',
        APP_DATABASE_NAME: 'myapp',
        APP_DATABASE_SSL: 'true',
        APP_REDIS_URL: 'redis://localhost:6379',
        APP_FEATURE_NEW_UI: 'true',
        APP_FEATURE_DARK_MODE: 'false'
      };

      const config = objectify({ env, prefix: 'APP' });

      expect(config).toEqual({
        port: 3000,
        host: '0.0.0.0',
        log: {
          level: 'info',
          format: 'json'
        },
        database: {
          host: 'localhost',
          port: 5432,
          name: 'myapp',
          ssl: true
        },
        redisUrl: 'redis://localhost:6379', // Only one REDIS_* entry, stays flat
        feature: {
          new: { ui: true },
          dark: { mode: false }
        }
      });
    });

    it('handles empty env', () => {
      const config = objectify({ env: {} });
      expect(config).toEqual({});
    });

    it('handles undefined values in env', () => {
      const env: NodeJS.ProcessEnv = {
        PORT: '3000',
        EMPTY: undefined
      };
      const config = objectify({ env });
      expect(config).toEqual({ port: 3000 });
    });
  });

  it('does not nest for non-nesting prefixes (max)', () => {
    const env = {
      MAX_CONNECTIONS: '100',
      MAX_TIMEOUT: '30'
    };
    const config = objectify({ env });
    // Even though MAX_* appears multiple times, do not nest under 'max'
    expect(config).toEqual({
      maxConnections: 100,
      maxTimeout: 30
    });
  });

  it('does not nest for non-nesting prefixes (min)', () => {
    const env = {
      MIN_CONNECTIONS: '2',
      MIN_TIMEOUT: '5'
    };
    const config = objectify({ env });
    expect(config).toEqual({
      minConnections: 2,
      minTimeout: 5
    });
  });

  it('does not nest for non-nesting prefixes (is)', () => {
    const env = {
      IS_DEBUG: 'true',
      IS_VERBOSE: 'false'
    };
    const config = objectify({ env });
    expect(config).toEqual({
      isDebug: true,
      isVerbose: false
    });
  });

  it('does not nest for non-nesting prefixes (enable)', () => {
    const env = {
      ENABLE_FEATURE_X: 'true',
      ENABLE_FEATURE_Y: 'false'
    };
    const config = objectify({ env });
    expect(config).toEqual({
      enableFeatureX: true,
      enableFeatureY: false
    });
  });

  it('does not nest for non-nesting prefixes (disable)', () => {
    const env = {
      DISABLE_CACHE: 'true',
      DISABLE_LOGGING: 'false'
    };
    const config = objectify({ env });
    expect(config).toEqual({
      disableCache: true,
      disableLogging: false
    });
  });
});

describe('objectEnvy (config loader factory)', () => {
  it('creates a reusable config loader', () => {
    const { objectify: loadConfig } = objectEnvy({ prefix: 'APP' });

    const env1 = { APP_PORT: '3000' };
    const env2 = { APP_PORT: '4000' };

    expect(loadConfig({ env: env1 })).toEqual({ port: 3000 });
    expect(loadConfig({ env: env2 })).toEqual({ port: 4000 });
  });

  it('creates a typed config loader with schema', () => {
    const schema = z.object({
      port: z.number(),
      debug: z.boolean()
    });

    const { objectify: loadConfig } = objectEnvy({ prefix: 'APP', schema });

    const env = { APP_PORT: '3000', APP_DEBUG: 'true' };
    const config = loadConfig({ env });
    type ExpectedConfig = z.infer<typeof schema>;

    expect(config).toEqual({ port: 3000, debug: true });
    // TypeScript infers the type from schema
    const port: number = (config as ExpectedConfig).port;
    expect(port).toBe(3000);
  });

  it('allows overriding default options', () => {
    const { objectify: loadConfig } = objectEnvy({ prefix: 'APP', coerce: true });

    const env = { APP_PORT: '3000' };

    // Override coerce
    const config = loadConfig({ env, coerce: false });
    expect(config).toEqual({ port: '3000' });
  });

  it('returns both objectify and envy functions', () => {
    const { objectify: loadConfig, envy: toEnv } = objectEnvy({ prefix: 'APP' });

    const env = { APP_PORT: '3000', APP_DEBUG: 'true' };
    const config = loadConfig({ env });

    expect(config).toEqual({ port: 3000, debug: true });

    // Can use envy to convert back
    const envVars = toEnv(config);
    expect(envVars).toEqual({ PORT: '3000', DEBUG: 'true' });
  });

  it('memoizes objectify calls with same env and options', () => {
    const { objectify: loadConfig } = objectEnvy({ prefix: 'APP' });

    const env = { APP_PORT: '3000' };

    const config1 = loadConfig({ env });
    const config2 = loadConfig({ env });

    // Same reference indicates memoization
    expect(config1).toBe(config2);
  });

  it('does not memoize when env changes', () => {
    const { objectify: loadConfig } = objectEnvy({ prefix: 'APP' });

    const env1 = { APP_PORT: '3000' };
    const env2 = { APP_PORT: '3000' };

    const config1 = loadConfig({ env: env1 });
    const config2 = loadConfig({ env: env2 });

    // Different env objects = different cache entries
    expect(config1).not.toBe(config2);
    expect(config1).toEqual(config2); // But same values
  });

  it('returns typed env for nested config', () => {
    type NestedConfig = {
      database: {
        host: string;
        ports: {
          read: number;
          write: number;
        };
      };
      features: string[];
    };

    const schema: NestedConfig = {
      database: {
        host: '',
        ports: {
          read: 0,
          write: 0
        }
      },
      features: ['']
    };

    const { objectify: loadConfig, envy: toEnv } = objectEnvy<NestedConfig>({
      prefix: 'APP',
      schema
    });

    const envInput = {
      APP_DATABASE_HOST: 'localhost',
      APP_DATABASE_PORTS_READ: '5432',
      APP_DATABASE_PORTS_WRITE: '5433',
      APP_FEATURES: 'alpha,beta'
    };

    const config = loadConfig({ env: envInput });
    const envOutput = toEnv(config);

    expect(envOutput).toEqual({
      DATABASE_HOST: 'localhost',
      DATABASE_PORTS_READ: '5432',
      DATABASE_PORTS_WRITE: '5433',
      FEATURES: 'alpha,beta'
    });

    // Type-level assertion: ToEnv maps nested keys to SCREAMING_SNAKE_CASE strings
    expectTypeOf(envOutput).toEqualTypeOf<ToEnv<typeof config>>();
  });
});

describe('filtering with include/exclude', () => {
  it('includes only matching fields with include option', () => {
    const env = {
      DATABASE_HOST: 'localhost',
      DATABASE_PORT: '5432',
      API_KEY: 'secret',
      PORT: '3000'
    };
    const config = objectify({ env, include: ['database'] });
    expect(config).toEqual({
      database: {
        host: 'localhost',
        port: 5432
      }
    });
  });

  it('excludes matching fields with exclude option', () => {
    const env = {
      DATABASE_HOST: 'localhost',
      DATABASE_PORT: '5432',
      API_KEY: 'secret',
      API_SECRET: 'topsecret'
    };
    const config = objectify({ env, exclude: ['secret'] });
    expect(config).toEqual({
      database: {
        host: 'localhost',
        port: 5432
      },
      apiKey: 'secret'
    });
  });

  it('applies both include and exclude filters', () => {
    const env = {
      DATABASE_HOST: 'localhost',
      DATABASE_PASSWORD: 'secret',
      API_KEY: 'key',
      PORT: '3000'
    };
    const config = objectify({ env, include: ['database'], exclude: ['password'] });
    // Only one DATABASE_HOST remains after filtering, so it stays flat
    expect(config).toEqual({
      databaseHost: 'localhost'
    });
  });

  it('works with prefix and filtering', () => {
    const env = {
      APP_DATABASE_HOST: 'localhost',
      APP_DATABASE_PORT: '5432',
      APP_API_KEY: 'secret',
      OTHER_VAR: 'ignored'
    };
    const config = objectify({ env, prefix: 'APP', include: ['database'] });
    expect(config).toEqual({
      database: {
        host: 'localhost',
        port: 5432
      }
    });
  });

  it('filtering is case-insensitive', () => {
    const env = {
      DATABASE_HOST: 'localhost',
      database_port: '5432',
      API_KEY: 'secret'
    };
    const config = objectify({ env, include: ['DATABASE'] });
    expect(config).toEqual({
      database: {
        host: 'localhost',
        port: 5432
      }
    });
  });
});

describe('override', () => {
  it('applies default values to empty config', () => {
    const config = {};
    const defaults = { port: 3000, debug: false };
    const result = override(defaults, config);
    expect(result).toEqual({ port: 3000, debug: false });
  });

  it('preserves existing values over defaults', () => {
    const config = { port: 8080 };
    const defaults = { port: 3000, debug: false };
    const result = override(defaults, config);
    expect(result).toEqual({ port: 8080, debug: false });
  });

  it('recursively applies defaults to nested objects', () => {
    const config: any = { log: { level: 'debug' } };
    const defaults = { port: 3000, log: { level: 'info', path: '/var/log' } };
    const result = override(defaults, config);
    expect(result).toEqual({
      port: 3000,
      log: { level: 'debug', path: '/var/log' }
    });
  });

  it('handles deeply nested objects', () => {
    const config: any = { database: { connection: { host: 'localhost' } } };
    const defaults = {
      database: { connection: { host: 'db.example.com', port: 5432 }, timeout: 30 }
    };
    const result = override(defaults, config);
    expect(result).toEqual({
      database: {
        connection: { host: 'localhost', port: 5432 },
        timeout: 30
      }
    });
  });

  it('does not override with undefined defaults', () => {
    const config = { port: 8080 };
    const defaults = { port: 3000, debug: false };
    const result = override(defaults, config);
    expect(result).toEqual({ port: 8080, debug: false });
  });

  describe('smart array merging', () => {
    it('replaces arrays by default', () => {
      const config = { tags: ['prod'] };
      const defaults = { port: 3000, tags: ['v1'] };
      const result = override(defaults, config);
      expect(result).toEqual({ port: 3000, tags: ['prod'] });
    });

    it('concatenates arrays with concat strategy', () => {
      const config = { tags: ['prod'] };
      const defaults = { port: 3000, tags: ['v1'] };
      const result = override(defaults, config, { arrayMergeStrategy: 'concat' });
      expect(result).toEqual({ port: 3000, tags: ['prod', 'v1'] });
    });

    it('concatenates and deduplicates with concat-unique strategy', () => {
      const config = { hosts: ['localhost', 'example.com'] };
      const defaults = { port: 3000, hosts: ['example.com', 'api.example.com'] };
      const result = override(defaults, config, { arrayMergeStrategy: 'concat-unique' });
      expect(result).toEqual({
        port: 3000,
        hosts: ['localhost', 'example.com', 'api.example.com']
      });
    });

    it('applies defaults to missing arrays', () => {
      const config = { port: 8080 };
      const defaults = { port: 3000, tags: ['v1', 'prod'] };
      const result = override(defaults, config, { arrayMergeStrategy: 'concat' });
      expect(result).toEqual({ port: 8080, tags: ['v1', 'prod'] });
    });

    it('concatenates arrays in deeply nested structures', () => {
      const config: any = { server: { tags: ['prod'] }, db: { hosts: ['db1'] } };
      const defaults = {
        server: { tags: ['v1'], port: 3000 },
        db: { hosts: ['db2'], pool: 10 }
      };
      const result = override(defaults, config, { arrayMergeStrategy: 'concat' });
      expect(result).toEqual({
        server: { tags: ['prod', 'v1'], port: 3000 },
        db: { hosts: ['db1', 'db2'], pool: 10 }
      });
    });
  });
});

describe('merge', () => {
  it('merges two flat objects', () => {
    const obj1 = { port: 3000, debug: false };
    const obj2 = { debug: true, host: 'localhost' };
    const result = merge(obj1, obj2);
    expect(result).toEqual({ port: 3000, debug: true, host: 'localhost' });
  });

  it('recursively merges nested objects', () => {
    const obj1 = { port: 3000, log: { level: 'info' } };
    const obj2 = { log: { path: '/var/log' }, debug: true };
    const result = merge(obj1, obj2);
    expect(result).toEqual({
      port: 3000,
      log: { level: 'info', path: '/var/log' },
      debug: true
    });
  });

  it('overwrites values from second object', () => {
    const obj1 = { port: 3000, debug: false };
    const obj2 = { port: 8080 };
    const result = merge(obj1, obj2);
    expect(result).toEqual({ port: 8080, debug: false });
  });

  it('handles deeply nested merging', () => {
    const obj1 = {
      database: { connection: { host: 'localhost', port: 5432 }, timeout: 30 }
    };
    const obj2 = {
      database: { connection: { host: 'db.example.com' }, poolSize: 10 }
    };
    const result = merge(obj1, obj2);
    expect(result).toEqual({
      database: {
        connection: { host: 'db.example.com', port: 5432 },
        timeout: 30,
        poolSize: 10
      }
    });
  });

  it('does not merge arrays recursively', () => {
    const obj1 = { tags: ['a', 'b'] };
    const obj2 = { tags: ['c', 'd'] };
    const result = merge(obj1, obj2);
    expect(result).toEqual({ tags: ['c', 'd'] });
  });

  describe('smart array merging', () => {
    it('replaces arrays by default', () => {
      const obj1 = { tags: ['a', 'b'], port: 3000 };
      const obj2 = { tags: ['c', 'd'] };
      const result = merge(obj1, obj2);
      expect(result).toEqual({ tags: ['c', 'd'], port: 3000 });
    });

    it('concatenates arrays with concat strategy', () => {
      const obj1 = { tags: ['a', 'b'], port: 3000 };
      const obj2 = { tags: ['c', 'd'] };
      const result = merge(obj1, obj2, { arrayMergeStrategy: 'concat' });
      expect(result).toEqual({ tags: ['a', 'b', 'c', 'd'], port: 3000 });
    });

    it('concatenates and deduplicates primitives with concat-unique strategy', () => {
      const obj1 = { hosts: ['localhost', 'example.com'], port: 3000 };
      const obj2 = { hosts: ['example.com', 'api.example.com'] };
      const result = merge(obj1, obj2, { arrayMergeStrategy: 'concat-unique' });
      expect(result).toEqual({
        hosts: ['localhost', 'example.com', 'api.example.com'],
        port: 3000
      });
    });

    it('concatenates arrays in deeply nested structures', () => {
      const obj1 = {
        server: { hosts: ['host1'], port: 3000 },
        db: { hosts: ['db1'] }
      };
      const obj2 = {
        server: { hosts: ['host2'] },
        db: { hosts: ['db2'], pool: 10 }
      };
      const result = merge(obj1, obj2, { arrayMergeStrategy: 'concat' });
      expect(result).toEqual({
        server: { hosts: ['host1', 'host2'], port: 3000 },
        db: { hosts: ['db1', 'db2'], pool: 10 }
      });
    });

    it('handles mixed primitive types in concat-unique', () => {
      const obj1 = { values: [1, 'a', true], port: 3000 };
      const obj2 = { values: ['a', 2, false, 1] };
      const result = merge(obj1, obj2, { arrayMergeStrategy: 'concat-unique' });
      expect(result).toEqual({
        values: [1, 'a', true, 2, false],
        port: 3000
      });
    });

    it('handles objects in arrays with concat-unique', () => {
      const obj1 = { items: [{ id: 1 }, { id: 2 }] };
      const obj2 = { items: [{ id: 2 }, { id: 3 }] };
      const result = merge(obj1, obj2, { arrayMergeStrategy: 'concat-unique' });
      // Note: Objects are deduplicated by JSON serialization
      expect(result.items).toHaveLength(3);
      expect(result.items).toContainEqual({ id: 1 });
      expect(result.items).toContainEqual({ id: 2 });
      expect(result.items).toContainEqual({ id: 3 });
    });

    it('handles empty arrays with concat strategy', () => {
      const obj1 = { tags: [] };
      const obj2 = { tags: ['a', 'b'] };
      const result = merge(obj1, obj2, { arrayMergeStrategy: 'concat' });
      expect(result).toEqual({ tags: ['a', 'b'] });
    });

    it('handles empty arrays with concat-unique strategy', () => {
      const obj1 = { tags: ['a'] };
      const obj2 = { tags: [] };
      const result = merge(obj1, obj2, { arrayMergeStrategy: 'concat-unique' });
      expect(result).toEqual({ tags: ['a'] });
    });

    it('preserves nested object merge when using array strategies', () => {
      const obj1 = {
        config: { port: 3000, tags: ['prod'] },
        features: { enabled: true }
      };
      const obj2 = {
        config: { timeout: 30, tags: ['v1'] },
        features: { debug: true }
      };
      const result = merge(obj1, obj2, { arrayMergeStrategy: 'concat' });
      expect(result).toEqual({
        config: { port: 3000, timeout: 30, tags: ['prod', 'v1'] },
        features: { enabled: true, debug: true }
      });
    });
  });
});

describe('array value support', () => {
  it('parses comma-separated values as arrays', () => {
    const env = {
      ALLOWED_HOSTS: 'localhost,example.com,api.example.com'
    };
    const config = objectify({ env });
    expect(config).toEqual({
      allowedHosts: ['localhost', 'example.com', 'api.example.com']
    });
  });

  it('coerces array elements to appropriate types', () => {
    const env = {
      PORT_NUMBERS: '3000,3001,3002',
      FEATURE_FLAGS: 'feature1,feature2,feature3',
      BOOLEAN_LIST: 'true,false,yes,no'
    };
    const config = objectify({ env });
    expect(config).toEqual({
      portNumbers: [3000, 3001, 3002],
      featureFlags: ['feature1', 'feature2', 'feature3'],
      booleanList: [true, false, true, false]
    });
  });

  it('handles mixed type arrays', () => {
    const env = {
      MIXED_VALUES: '1,hello,true,3.14'
    };
    const config = objectify({ env });
    expect(config).toEqual({
      mixedValues: [1, 'hello', true, 3.14]
    });
  });

  it('works with nested configs and arrays', () => {
    const env = {
      LOG_LEVELS: 'debug,info,warn',
      LOG_PATH: '/var/log',
      SERVER_HOSTS: 'host1,host2',
      SERVER_PORT: '3000'
    };
    const config = objectify({ env });
    expect(config).toEqual({
      log: {
        levels: ['debug', 'info', 'warn'],
        path: '/var/log'
      },
      server: {
        hosts: ['host1', 'host2'],
        port: 3000
      }
    });
  });

  it('works with prefix filtering and arrays', () => {
    const env = {
      APP_ALLOWED_ORIGINS: 'http://localhost,https://example.com',
      APP_PORT: '3000',
      OTHER_VAR: 'ignored'
    };
    const config = objectify({ env, prefix: 'APP' });
    expect(config).toEqual({
      allowedOrigins: ['http://localhost', 'https://example.com'],
      port: 3000
    });
  });

  it('validates arrays with Zod schema', () => {
    const schema = z.object({
      allowedHosts: z.array(z.string()),
      ports: z.array(z.number())
    });

    const env = {
      ALLOWED_HOSTS: 'localhost,example.com',
      PORTS: '3000,3001,3002'
    };

    const config = objectify({ env, schema });
    expect(config).toEqual({
      allowedHosts: ['localhost', 'example.com'],
      ports: [3000, 3001, 3002]
    });
  });

  it('does not parse arrays when coerce is disabled', () => {
    const env = {
      HOSTS: 'host1,host2,host3'
    };
    const config = objectify({ env, coerce: false });
    // With coerce disabled, values remain as strings
    expect(config).toEqual({
      hosts: 'host1,host2,host3'
    });
  });

  it('trims whitespace from array elements', () => {
    const env = {
      TAGS: ' tag1 , tag2 , tag3 '
    };
    const config = objectify({ env });
    expect(config).toEqual({
      tags: ['tag1', 'tag2', 'tag3']
    });
  });

  it('filters empty array elements', () => {
    const env = {
      VALUES: 'a,,b,,,c'
    };
    const config = objectify({ env });
    expect(config).toEqual({
      values: ['a', 'b', 'c']
    });
  });

  it('preserves single values without commas', () => {
    const env = {
      HOST: 'localhost',
      PORT: '3000'
    };
    const config = objectify({ env });
    expect(config).toEqual({
      host: 'localhost',
      port: 3000
    });
  });
});

describe('envy (reverse transformation)', () => {
  it('converts flat camelCase config to SCREAMING_SNAKE_CASE env', () => {
    const config = {
      port: 3000,
      debug: true,
      host: 'localhost'
    };

    const env = envy(config);
    expect(env).toEqual({
      PORT: '3000',
      DEBUG: 'true',
      HOST: 'localhost'
    });
  });

  it('converts nested config to flattened SCREAMING_SNAKE_CASE env', () => {
    const config = {
      portNumber: 3000,
      log: {
        level: 'debug',
        path: '/var/log'
      }
    };

    const env = envy(config);
    expect(env).toEqual({
      PORT_NUMBER: '3000',
      LOG_LEVEL: 'debug',
      LOG_PATH: '/var/log'
    });
  });

  it('converts deeply nested structures', () => {
    const config = {
      database: {
        connection: {
          host: 'localhost',
          port: 5432
        },
        pool: {
          min: 2,
          max: 10
        }
      }
    };

    const env = envy(config);
    expect(env).toEqual({
      DATABASE_CONNECTION_HOST: 'localhost',
      DATABASE_CONNECTION_PORT: '5432',
      DATABASE_POOL_MIN: '2',
      DATABASE_POOL_MAX: '10'
    });
  });

  it('converts boolean values to string', () => {
    const config = {
      debug: true,
      production: false,
      verbose: true
    };

    const env = envy(config);
    expect(env).toEqual({
      DEBUG: 'true',
      PRODUCTION: 'false',
      VERBOSE: 'true'
    });
  });

  it('converts arrays to comma-separated strings', () => {
    const config = {
      tags: ['api', 'v1', 'beta'],
      hosts: ['host1', 'host2']
    };

    const env = envy(config);
    expect(env).toEqual({
      TAGS: 'api,v1,beta',
      HOSTS: 'host1,host2'
    });
  });

  it('handles mixed nested and array values', () => {
    const config = {
      server: {
        port: 3000,
        hosts: ['localhost', '127.0.0.1']
      },
      debug: false
    };

    const env = envy(config);
    expect(env).toEqual({
      SERVER_PORT: '3000',
      SERVER_HOSTS: 'localhost,127.0.0.1',
      DEBUG: 'false'
    });
  });

  it('is reversible with objectify', () => {
    const originalEnv = {
      PORT: '3000',
      HOST: 'localhost',
      DEBUG: 'true'
    };

    const config = objectify({ env: originalEnv });
    const recoveredEnv = envy(config);

    expect(recoveredEnv).toEqual(originalEnv);
  });

  it('is reversible with nested structures', () => {
    const originalEnv = {
      PORT_NUMBER: '3000',
      LOG_LEVEL: 'debug',
      LOG_PATH: '/var/log'
    };

    const config = objectify({ env: originalEnv });
    const recoveredEnv = envy(config);

    expect(recoveredEnv).toEqual(originalEnv);
  });

  it('handles empty object', () => {
    const config = {};
    const env = envy(config);
    expect(env).toEqual({});
  });

  it('handles null and undefined values', () => {
    const config = {
      port: 3000,
      // null values should be skipped
      nullValue: null as any,
      // undefined values should be skipped
      undefinedValue: undefined as any,
      host: 'localhost'
    };

    const env = envy(config);
    expect(env).toEqual({
      PORT: '3000',
      HOST: 'localhost'
    });
  });
});
