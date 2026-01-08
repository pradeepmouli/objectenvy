import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import { configEnvy, createConfigEnvy, applyDefaults, merge } from './configEnvy.js';

describe('configEnvy', () => {
  describe('basic mapping', () => {
    it('maps simple env vars to flat config', () => {
      const env = {
        PORT: '3000',
        DEBUG: 'true'
      };
      const config = configEnvy({ env });
      expect(config).toEqual({
        port: 3000,
        debug: true
      });
    });

    it('keeps single SNAKE_CASE entry flat as camelCase', () => {
      const env = {
        PORT_NUMBER: '1234'
      };
      const config = configEnvy({ env });
      // Only one PORT_* entry, so it stays flat
      expect(config).toEqual({
        portNumber: 1234
      });
    });

    it('nests when multiple entries share a prefix', () => {
      const env = {
        LOG_LEVEL: 'debug',
        LOG_PATH: '/var/log'
      };
      const config = configEnvy({ env });
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
      const config = configEnvy({ env });
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
      const config = configEnvy({ env });
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
      const config = configEnvy({ env });
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
      const config = configEnvy({ env });
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
      const config = configEnvy({ env });
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
      const config = configEnvy({ env });
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
      const config = configEnvy({ env, coerce: false });
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
      const config = configEnvy({ env, prefix: 'APP' });
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
      const config = configEnvy({ env, prefix: 'APP' });
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
      const config = configEnvy({ env, prefix: 'APP_' });
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
      const config = configEnvy({ env, delimiter: '__' });
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
      const config = configEnvy({ env, delimiter: '__' });
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
      const config = configEnvy({ env, delimiter: '__' });
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

      const config = configEnvy({ env, schema });
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

      const config = configEnvy({ env, schema });
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

      expect(() => configEnvy({ env, schema })).toThrow();
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

      const config = configEnvy({ env, schema });

      // TypeScript should infer these types
      const port: number = config.portNumber;
      const level: string = config.log.level;

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

      const config = configEnvy({ env, schema });
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

      const config = configEnvy({ env, schema });
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

      const config = configEnvy({ env, schema });
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

      const config = configEnvy({ env, schema });
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

      const config = configEnvy({ env, schema });
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

      const config = configEnvy({ env, prefix: 'APP' });

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
      const config = configEnvy({ env: {} });
      expect(config).toEqual({});
    });

    it('handles undefined values in env', () => {
      const env: NodeJS.ProcessEnv = {
        PORT: '3000',
        EMPTY: undefined
      };
      const config = configEnvy({ env });
      expect(config).toEqual({ port: 3000 });
    });
  });
});

describe('createConfigEnvy', () => {
  it('creates a reusable config loader', () => {
    const loadConfig = createConfigEnvy({ prefix: 'APP' });

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

    const loadConfig = createConfigEnvy({ prefix: 'APP', schema });

    const env = { APP_PORT: '3000', APP_DEBUG: 'true' };
    const config = loadConfig({ env });

    expect(config).toEqual({ port: 3000, debug: true });
    // TypeScript infers the type from schema
    const port: number = config.port;
    expect(port).toBe(3000);
  });

  it('allows overriding default options', () => {
    const loadConfig = createConfigEnvy({ prefix: 'APP', coerce: true });

    const env = { APP_PORT: '3000' };

    // Override coerce
    const config = loadConfig({ env, coerce: false });
    expect(config).toEqual({ port: '3000' });
  });
});

describe('applyDefaults', () => {
  it('applies default values to empty config', () => {
    const config = {};
    const defaults = { port: 3000, debug: false };
    const result = applyDefaults(config, defaults);
    expect(result).toEqual({ port: 3000, debug: false });
  });

  it('preserves existing values over defaults', () => {
    const config = { port: 8080 };
    const defaults = { port: 3000, debug: false };
    const result = applyDefaults(config, defaults);
    expect(result).toEqual({ port: 8080, debug: false });
  });

  it('recursively applies defaults to nested objects', () => {
    const config = { log: { level: 'debug' } };
    const defaults = { port: 3000, log: { level: 'info', path: '/var/log' } };
    const result = applyDefaults(config, defaults);
    expect(result).toEqual({
      port: 3000,
      log: { level: 'debug', path: '/var/log' }
    });
  });

  it('handles deeply nested objects', () => {
    const config = { database: { connection: { host: 'localhost' } } };
    const defaults = {
      database: { connection: { host: 'db.example.com', port: 5432 }, timeout: 30 }
    };
    const result = applyDefaults(config, defaults);
    expect(result).toEqual({
      database: {
        connection: { host: 'localhost', port: 5432 },
        timeout: 30
      }
    });
  });

  it('does not override with undefined defaults', () => {
    const config = { port: 8080 };
    const defaults = { port: undefined, debug: false };
    const result = applyDefaults(config, defaults);
    expect(result).toEqual({ port: 8080, debug: false });
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
});

describe('array value support', () => {
  it('parses comma-separated values as arrays', () => {
    const env = {
      ALLOWED_HOSTS: 'localhost,example.com,api.example.com'
    };
    const config = configEnvy({ env });
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
    const config = configEnvy({ env });
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
    const config = configEnvy({ env });
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
    const config = configEnvy({ env });
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
    const config = configEnvy({ env, prefix: 'APP' });
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

    const config = configEnvy({ env, schema });
    expect(config).toEqual({
      allowedHosts: ['localhost', 'example.com'],
      ports: [3000, 3001, 3002]
    });
  });

  it('does not parse arrays when coerce is disabled', () => {
    const env = {
      HOSTS: 'host1,host2,host3'
    };
    const config = configEnvy({ env, coerce: false });
    // With coerce disabled, values remain as strings
    expect(config).toEqual({
      hosts: 'host1,host2,host3'
    });
  });

  it('trims whitespace from array elements', () => {
    const env = {
      TAGS: ' tag1 , tag2 , tag3 '
    };
    const config = configEnvy({ env });
    expect(config).toEqual({
      tags: ['tag1', 'tag2', 'tag3']
    });
  });

  it('filters empty array elements', () => {
    const env = {
      VALUES: 'a,,b,,,c'
    };
    const config = configEnvy({ env });
    expect(config).toEqual({
      values: ['a', 'b', 'c']
    });
  });

  it('preserves single values without commas', () => {
    const env = {
      HOST: 'localhost',
      PORT: '3000'
    };
    const config = configEnvy({ env });
    expect(config).toEqual({
      host: 'localhost',
      port: 3000
    });
  });
});
