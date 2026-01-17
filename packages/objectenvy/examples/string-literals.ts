/**
 * Example demonstrating ToEnv preserving string literal and template literal types
 *
 * This feature allows for type-safe environment variable declarations
 * that preserve union types and template literal types, catching configuration
 * errors at compile time rather than runtime.
 *
 * Note: This example imports directly from source for development.
 * In published packages, use: import type { ToEnv } from 'objectenvy';
 */

import type { ToEnv } from '../src/typeUtils.js';

// Example 1: Preserving union types for environment configuration
type AppConfig = {
  environment: 'development' | 'production' | 'staging';
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  enableFeatureX: boolean;
  port: number;
};

type AppEnv = ToEnv<AppConfig>;
/**
 * AppEnv resolves to:
 * {
 *   ENVIRONMENT: 'development' | 'production' | 'staging';
 *   LOG_LEVEL: 'debug' | 'info' | 'warn' | 'error';
 *   ENABLE_FEATURE_X: 'true' | 'false' | 'yes' | 'no' | 'y' | 'n';
 *   PORT: `${number}`;
 * }
 */

// Example 2: Template literal types for enforcing string patterns
type ApiConfig = {
  apiUrl: `https://${string}`; // Must start with https://
  version: `v${number}`;        // Must start with v followed by a number
  region: 'us-east-1' | 'us-west-2' | 'eu-west-1';
};

type ApiEnv = ToEnv<ApiConfig>;
/**
 * ApiEnv resolves to:
 * {
 *   API_URL: `https://${string}`;
 *   VERSION: `v${number}`;
 *   REGION: 'us-east-1' | 'us-west-2' | 'eu-west-1';
 * }
 */

// Example 3: Nested configuration with mixed types
type DatabaseConfig = {
  database: {
    type: 'postgres' | 'mysql' | 'sqlite';
    host: string;
    port: number;
    ssl: boolean;
  };
  cache: {
    enabled: boolean;
    ttl: number;
  };
};

type DatabaseEnv = ToEnv<DatabaseConfig>;
/**
 * DatabaseEnv resolves to:
 * {
 *   DATABASE_TYPE: 'postgres' | 'mysql' | 'sqlite';
 *   DATABASE_HOST: string;
 *   DATABASE_PORT: `${number}`;
 *   DATABASE_SSL: 'true' | 'false' | 'yes' | 'no' | 'y' | 'n';
 *   CACHE_ENABLED: 'true' | 'false' | 'yes' | 'no' | 'y' | 'n';
 *   CACHE_TTL: `${number}`;
 * }
 */

/**
 * Benefits of preserving literal types:
 *
 * 1. **Compile-time validation**: Typos and invalid values are caught during development
 *    - ✓ ENVIRONMENT: 'production'
 *    - ✗ ENVIRONMENT: 'prod' // Type error!
 *
 * 2. **IDE Autocomplete**: Your editor can suggest all valid values
 *
 * 3. **Self-documenting**: The type itself shows all allowed values
 *
 * 4. **Pattern enforcement**: Template literals enforce string patterns
 *    - ✓ API_URL: 'https://api.example.com'
 *    - ✗ API_URL: 'http://api.example.com' // Type error - must be https!
 *
 * 5. **Refactoring safety**: Changing config types automatically updates env types
 */

// Example usage with type checking
function validateEnv<T extends Record<string, string | undefined>>(
  env: T
): T {
  // Your validation logic here
  return env;
}

// TypeScript will enforce that the env object matches AppEnv
declare const processEnv: AppEnv;

const validatedAppEnv = validateEnv<AppEnv>(processEnv);

export type { AppConfig, AppEnv, ApiConfig, ApiEnv, DatabaseConfig, DatabaseEnv };
export { validatedAppEnv };
