/**
 * CLI execution tests for config-y-env
 * Tests that the CLI runs successfully with various inputs
 */

import { describe, it, expect } from 'vitest';
import { execSync } from 'child_process';
import { resolve } from 'path';

const CLI_PATH = resolve(__dirname, '../../bin/config-y-env.js');

describe('config-y-env CLI execution', () => {
  it('should display version', () => {
    const output = execSync(`node ${CLI_PATH} --version`, { encoding: 'utf-8' }).trim();
    expect(output).toMatch(/\d+\.\d+\.\d+/);
  });

  it('should display help', () => {
    const output = execSync(`node ${CLI_PATH} --help`, { encoding: 'utf-8' });
    expect(output).toContain('config-y-env');
    expect(output).toContain('Generate TypeScript types and schemas from .env files');
  });

  it('should list help commands', () => {
    const output = execSync(`node ${CLI_PATH} help`, { encoding: 'utf-8' });
    expect(output).toContain('Usage:');
  });
});
