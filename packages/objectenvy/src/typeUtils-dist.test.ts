/**
 * Tests for ToEnv type preservation
 *
 * Note: VS Code's TypeScript language server may incorrectly show these types as `never`
 * due to caching or type resolution issues. However, these tests pass when run via vitest,
 * confirming that the types work correctly at compile time and runtime.
 */
import { describe, it, expectTypeOf } from 'vitest';
import type { ToEnv } from './typeUtils.js';

describe('ToEnv type preservation', () => {
  it('preserves string literals', () => {
    type Config = {
      environment: 'development' | 'production';
      logLevel: 'debug' | 'info' | 'warn' | 'error';
    };

    type Env = ToEnv<Config>;

    expectTypeOf<Env>().toEqualTypeOf<{
      ENVIRONMENT: 'development' | 'production';
      LOG_LEVEL: 'debug' | 'info' | 'warn' | 'error';
    }>();
  });

  it('preserves template literal types', () => {
    type Config = {
      apiUrl: `https://${string}`;
      version: `v${number}`;
    };

    type Env = ToEnv<Config>;

    expectTypeOf<Env>().toEqualTypeOf<{
      API_URL: `https://${string}`;
      VERSION: `v${number}`;
    }>();
  });
});
