/**
 * CLI command handler for env-y-config
 * @module commands/generate
 */

import { parseJsonFile } from '../parsers/json.js';
import { parseTypeScriptFile, listTypeScriptExports } from '../parsers/typescript.js';
import { generateEnvFile, createDefaultOptions } from '../generators/env-formatter.js';
import { writeFileAtomic, validateOutputPath } from '../utils/file-io.js';
import type { InputFormat, ParsedSchema, EnvGeneratorOptions } from '../types.js';
import { extname } from 'path';

/**
 * CLI command options
 */
export interface CommandOptions {
  output?: string;
  from?: InputFormat;
  type?: string;
  prefix?: string;
  include?: string;
  exclude?: string;
  comments?: boolean;
  requiredOnly?: boolean;
  listExports?: boolean;
}

/**
 * Detect input format from file extension
 */
function detectFormat(filePath: string): InputFormat {
  const ext = extname(filePath).toLowerCase();

  switch (ext) {
    case '.ts':
      return 'typescript';
    case '.json':
      return 'json';
    case '.js':
      return 'json-schema';
    default:
      return 'json';
  }
}

/**
 * Parse input file based on format
 */
async function parseInputFile(
  filePath: string,
  format: InputFormat,
  exportName?: string
): Promise<ParsedSchema> {
  switch (format) {
    case 'json':
      return await parseJsonFile(filePath);

    case 'typescript':
      return await parseTypeScriptFile(filePath, exportName);

    case 'json-schema':
      // JSON Schema support is planned for a future release
      throw new Error('JSON Schema format is not yet supported. Use TypeScript or JSON instead.');

    case 'zod':
      // Zod schema extraction support is planned for a future release
      throw new Error('Zod format is not yet supported. Use TypeScript or JSON instead.');

    default:
      throw new Error(`Unsupported format: ${format}`);
  }
}

/**
 * Main command handler for generating .env files
 */
export async function generateCommand(input: string, options: CommandOptions): Promise<void> {
  const startTime = performance.now();

  try {
    // Handle --list-exports flag for TypeScript files
    if (options.listExports) {
      if (!options.from || options.from !== 'typescript') {
        const detectedFormat = detectFormat(input);
        if (detectedFormat !== 'typescript') {
          throw new Error('--list-exports is only available for TypeScript files');
        }
      }

      const exports = await listTypeScriptExports(input);
      // eslint-disable-next-line no-console
      console.log('Available exports:');
      for (const exp of exports) {
        // eslint-disable-next-line no-console
        console.log(`  - ${exp}`);
      }
      return;
    }

    // Detect or use specified format
    const format = options.from || detectFormat(input);

    // Parse input file
    const schema = await parseInputFile(input, format, options.type);

    // Create generator options
    const genOptions: EnvGeneratorOptions = createDefaultOptions({
      prefix: options.prefix,
      include: options.include?.split(',').map((s) => s.trim()),
      exclude: options.exclude?.split(',').map((s) => s.trim()),
      comments: options.comments !== false,
      requiredOnly: options.requiredOnly || false
    });

    // Generate .env file
    const generated = generateEnvFile(schema, genOptions);

    // Output to file or stdout
    if (options.output) {
      // Validate output path before writing
      await validateOutputPath(options.output);

      // Write atomically
      await writeFileAtomic(options.output, generated.content);

      const endTime = performance.now();
      const duration = (endTime - startTime).toFixed(2);

      // eslint-disable-next-line no-console
      console.log(`✓ Generated .env file: ${options.output}`);
      // eslint-disable-next-line no-console
      console.log(`  Fields: ${generated.entries.length}`);
      // eslint-disable-next-line no-console
      console.log(`  Time: ${duration}ms`);
    } else {
      // Output to stdout
      // eslint-disable-next-line no-console
      console.log(generated.content);
    }
  } catch (error) {
    // Re-throw with better error context
    if (error instanceof Error) {
      throw new Error(`Failed to generate .env file: ${error.message}`);
    }
    throw error;
  }
}
