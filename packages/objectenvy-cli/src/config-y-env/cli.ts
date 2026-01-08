/**
 * Commander.js CLI setup for config-y-env
 * @module cli
 */

import { Command } from 'commander';
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const packageJson = JSON.parse(readFileSync(join(__dirname, '../../package.json'), 'utf-8'));

/**
 * Initialize and run CLI application
 */
export async function cli(argv?: string[]): Promise<void> {
  const program = new Command();

  program
    .name('config-y-env')
    .description('Generate TypeScript types and schemas from .env files with smart type inference')
    .version(packageJson.version, '-v, --version', 'Display version')
    .helpOption('-h, --help', 'Display help')
    .addHelpCommand('help [command]', 'Display help for a command');

  // Main command: generate types from .env
  program
    .argument('<input>', 'Path to input .env file')
    .option('-o, --output <path>', 'Output file path (default: stdout)')
    .option('--to <format>', 'Output format (typescript, json-schema, javascript, zod)', 'typescript')
    .option('--interface-name <name>', 'TypeScript interface name', 'Config')
    .option('--inference-mode <mode>', 'Type inference mode (strict, loose)', 'strict')
    .option('--prefix <string>', 'Filter environment variables by prefix')
    .option('--exclude <fields>', 'Exclude specified fields (comma-separated)')
    .option('--zod-schema', 'Also generate Zod validation schema')
    .option('--with-comments', 'Include JSDoc comments (default: true)')
    .option('--no-comments', 'Exclude JSDoc comments')
    .action(async (input, options) => {
      try {
        // TODO: Implement command handler in Phase 4
        // eslint-disable-next-line no-console
        console.log(`config-y-env: ${input}`);
        // eslint-disable-next-line no-console
        console.log('Options:', options);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Error:', error instanceof Error ? error.message : String(error));
        process.exit(1);
      }
    });

  await program.parseAsync(argv ?? process.argv);
}

// Run CLI if this is the main module
if (import.meta.url === `file://${process.argv[1]}`) {
  cli().catch((error) => {
    // eslint-disable-next-line no-console
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export {};
