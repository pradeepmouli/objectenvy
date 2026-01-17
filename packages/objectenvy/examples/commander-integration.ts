/**
 * Example: commander + objectenvy Integration
 *
 * This example demonstrates how to:
 * 1. Use commander to parse CLI arguments
 * 2. Merge CLI args with environment variables using objectenvy
 * 3. Apply defaults and smart array merging
 *
 * Usage:
 *   npx tsx examples/commander-integration.ts --port 8080 --debug
 *   npx tsx examples/commander-integration.ts --help
 */

import { Command } from 'commander';
import { objectify, merge, override } from '../src/index.js';
import { z } from 'zod';
import { pathToFileURL } from 'url';

// Define CLI options
interface Options {
  port?: string;
  host?: string;
  debug?: boolean;
  verbose?: boolean;
  workers?: string;
  allowedOrigins?: string[];
  env: 'development' | 'production' | 'test';
}

// Define configuration schema
const configSchema = z.object({
  portNumber: z.number().default(3000),
  host: z.string().default('localhost'),
  isDebug: z.boolean().default(false),
  isVerbose: z.boolean().default(false),
  maxWorkers: z.number().default(4),
  allowedOrigins: z.array(z.string()).default(['localhost:3000']),
  nodeEnv: z.enum(['development', 'production', 'test']).default('development')
});

export type AppConfig = z.infer<typeof configSchema>;

/**
 * Parse CLI arguments into config format
 */
function parseCliArgs(args: Options) {
  const cliConfig: Partial<AppConfig> = {};

  if (args.port) cliConfig['portNumber'] = parseInt(args.port, 10);
  if (args.host) cliConfig['host'] = args.host;
  if (args.debug !== undefined) cliConfig['isDebug'] = args.debug;
  if (args.verbose !== undefined) cliConfig['isVerbose'] = args.verbose;
  if (args.workers) cliConfig['maxWorkers'] = parseInt(args.workers, 10);
  if (args.allowedOrigins && args.allowedOrigins.length > 0) {
    cliConfig['allowedOrigins'] = args.allowedOrigins;
  }
  if (args.env) cliConfig['nodeEnv'] = args.env;

  return cliConfig;
}

/**
 * Load config from environment, CLI args, and defaults
 */
export function loadConfig(cliArgs: Options, env?: NodeJS.ProcessEnv): AppConfig {
  // 1. Parse environment variables with schema-guided nesting
  const envConfig = objectify({
    env: env || process.env,
    prefix: 'APP',
    schema: configSchema,
    coerce: true,
    nonNestingPrefixes: ['max', 'min', 'is', 'enable', 'disable']
  });

  // 2. Parse CLI arguments
  const cliConfig = parseCliArgs(cliArgs);

  // 3. Merge: env < cli args (cli args override env)
  // CLI array args concatenate with env arrays
  const merged = merge(envConfig, cliConfig, { arrayMergeStrategy: 'concat-unique' });

  // 4. Apply defaults
  const defaults = {
    portNumber: 3000,
    host: 'localhost',
    isDebug: false,
    isVerbose: false,
    maxWorkers: 4,
    allowedOrigins: ['localhost:3000'],
    nodeEnv: 'development'
  };

  const config = override(defaults, merged);

  // 5. Validate against schema
  return configSchema.parse(config);
}

/**
 * Example: CLI with commander
 */
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const program = new Command()
    .name('app')
    .description('Example app with objectenvy config')
    .version('1.0.0')

    .option('-p, --port <number>', 'Server port')
    .option('-h, --host <string>', 'Server host')
    .option('-d, --debug', 'Enable debug mode')
    .option('-v, --verbose', 'Enable verbose logging')
    .option('-w, --workers <number>', 'Number of worker threads')
    .option('-o, --allowed-origins <origins...>', 'Allowed CORS origins')
    .option('-e, --env <environment>', 'Node environment')
    .action((options: Options) => {
      try {

        const config = loadConfig(options);

        // eslint-disable-next-line no-console
        console.log('✓ Configuration loaded\n');
        // eslint-disable-next-line no-console
        console.log('Server:', {
          port: config.portNumber,
          host: config.host,
          env: config.nodeEnv
        });
        // eslint-disable-next-line no-console
        console.log('Workers:', config.maxWorkers);
        // eslint-disable-next-line no-console
        console.log('Debug:', { debug: config.isDebug, verbose: config.isVerbose });
        // eslint-disable-next-line no-console
        console.log('Allowed Origins:', config.allowedOrigins);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('✗ Configuration error:', error);
        process.exit(1);
      }
    });

  program.parse();
}
