import { Command } from 'commander';
import { cli as envCli } from './env-y-config/cli.js';
import { cli as configCli } from './config-y-env/cli.js';

function wrapSubcommand(targetCli: (args?: string[]) => Promise<void>, args: string[]): Promise<void> {
  // Delegate to sub-CLI with isolated argv
  return targetCli(args);
}

export async function cli(argv: string[] = process.argv): Promise<void> {
  const program = new Command();
  const args = argv.slice(2);

  program
    .name('objectenvy-cli')
    .description('Unified CLI for env-y-config and config-y-env')
    .version('1.0.0', '-v, --version', 'Display version')
    .helpOption('-h, --help', 'Display help')
    .addHelpCommand('help [command]', 'Display help for a command');

  program
    .command('env-y-config [input]')
    .allowUnknownOption(true)
    .description('Generate .env files from schema definitions')
    .action(async (_input: string | undefined, _options: unknown) => {
      const subArgs = args.slice(1);
      await wrapSubcommand(envCli, ['node', 'env-y-config', ...subArgs]);
    });

  program
    .command('config-y-env [input]')
    .allowUnknownOption(true)
    .description('Generate TypeScript types and schemas from .env files')
    .action(async (_input: string | undefined, _options: unknown) => {
      const subArgs = args.slice(1);
      await wrapSubcommand(configCli, ['node', 'config-y-env', ...subArgs]);
    });

  // Default: show help when no subcommand provided
  if (argv.length <= 2) {
    program.outputHelp();
    return;
  }

  await program.parseAsync(argv);
}

cli();
