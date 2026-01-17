// oxlint-disable no-console
/**
 * Example: dotenv + objectenvy Integration
 *
 * This example demonstrates how to:
 * 1. Load environment variables from a .env file using dotenv
 * 2. Parse them into a strongly-typed config object with objectenvy
 * 3. Validate with a Zod schema
 *
 * Usage:
 *   npx tsx examples/dotenv-integration.ts
 *
 * Or add to your app:
 *   import { loadConfig } from './examples/dotenv-integration.js';
 *   const config = loadConfig();
 */

import { config as dotenvConfig } from '@dotenvx/dotenvx';
import { objectify, type ToEnv } from '../src/index.js';
import { z } from 'zod';
import { pathToFileURL } from 'url';


// Load .env file
dotenvConfig();

// Define your configuration schema
const configSchema = z.object({
  // Server config
  portNumber: z.number().default(3000),
  host: z.string().default('localhost'),
  nodeEnv: z.enum(['development', 'production', 'test']).default('development'),

  // Database config
  database: z.object({
    host: z.string(),
    port: z.number().default(5432),
    name: z.string(),
    user: z.string(),
    password: z.string()
  }),

  // Features
  features: z.object({
    enableCaching: z.boolean().default(false),
    enableLogging: z.boolean().default(true),
    enableMetrics: z.boolean().default(false)
  }),

  // Limits
  maxConnections: z.number().default(100),
  maxTimeout: z.number().default(30000),
  minPoolSize: z.number().default(2),

  // Debugging
  isDebug: z.boolean().default(false),
  isVerbose: z.boolean().default(false)
});

export type AppConfig = z.infer<typeof configSchema>;

/**
 * Load and validate configuration from environment variables
 * Throws if validation fails
 */
export function loadConfig(env?: ToEnv<AppConfig>): AppConfig {
  // Parse environment variables using schema-guided nesting
  // The schema determines the structure, non-nesting prefixes apply to smart nesting fallback
  const config = objectify({
    env: env || process.env,
    prefix: 'APP',
    schema: configSchema,
    coerce: true,
    nonNestingPrefixes: ['max', 'min', 'is', 'enable', 'disable']
  });

  // Validate against schema
  return configSchema.parse(config);
}

/**
 * Example usage
 */
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const config = loadConfig();

    console.log('✓ Configuration loaded successfully\n');
    console.log('Server:');
    console.log(`  Host: ${config.host}`);
    console.log(`  Port: ${config.portNumber}`);
    console.log(`  Environment: ${config.nodeEnv}\n`);

    console.log('Database:');
    console.log(`  Host: ${config.database.host}`);
    console.log(`  Port: ${config.database.port}`);
    console.log(`  Name: ${config.database.name}\n`);

    console.log('Features:');
    console.log(`  Caching: ${config.features.enableCaching}`);
    console.log(`  Logging: ${config.features.enableLogging}`);
    console.log(`  Metrics: ${config.features.enableMetrics}\n`);

    console.log('Limits:');
    console.log(`  Max Connections: ${config.maxConnections}`);
    console.log(`  Max Timeout: ${config.maxTimeout}ms`);
    console.log(`  Min Pool Size: ${config.minPoolSize}\n`);

    console.log('Debug:');
    console.log(`  Debug Mode: ${config.isDebug}`);
    console.log(`  Verbose: ${config.isVerbose}`);
  } catch (error) {
    console.error('✗ Configuration validation failed:');
    if (error instanceof z.ZodError) {
      console.error(error.issues.map((e) => `  ${e.path.join('.')}: ${e.message}`).join('\n'));
    } else {
      console.error(error);
    }
    process.exit(1);
  }
}
