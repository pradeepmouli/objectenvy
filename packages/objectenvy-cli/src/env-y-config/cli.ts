/**
 * Commander.js CLI setup for env-y-config
 * @module cli
 */

import { Command } from 'commander';
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { generateCommand } from './commands/generate.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const packageJson = JSON.parse(readFileSync(join(__dirname, '../../package.json'), 'utf-8'));

/**
 * Initialize and run CLI application
 */
export async function cli(argv?: string[]): Promise<void> {
  const program = new Command();

  program
    .name('env-y-config')
    .description('Generate .env files from schema definitions (Zod, JSON Schema, TypeScript, JSON)')
    .version(packageJson.version, '-v, --version', 'Display version')
    .helpOption('-h, --help', 'Display help')
    .addHelpCommand('help [command]', 'Display help for a command');

  // Main command: generate .env from schema
  program
    .argument('<input>', 'Path to input schema file')
    .option('-o, --output <path>', 'Output file path (default: stdout)')
    .option('--from <format>', 'Input format (zod, json-schema, json, typescript)')
    .option('--type <name>', 'TypeScript export name')
    .option('--prefix <string>', 'Prefix for environment variable names')
    .option('--include <fields>', 'Include only specified fields (comma-separated)')
    .option('--exclude <fields>', 'Exclude specified fields (comma-separated)')
    .option('--comments', 'Include comments from descriptions (default: true)')
    .option('--no-comments', 'Exclude comments')
    .option('--required-only', 'Generate only required fields')
    .option('--list-exports', 'List available exports (for TypeScript files)')
    .action(async (input, options) => {
      try {
        await generateCommand(input, options);
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
