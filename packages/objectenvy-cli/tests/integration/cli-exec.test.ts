/**
 * CLI execution tests for objectenvy-cli
 * Verifies unified CLI delegates to legacy commands
 */

import { describe, it, expect } from 'vitest';
import { execSync } from 'child_process';
import { resolve } from 'path';

const CLI_PATH = resolve(__dirname, '../../bin/objectenvy-cli.js');

function run(command: string): string {
  return execSync(command, { encoding: 'utf-8' });
}

describe('objectenvy-cli', () => {
  it('shows help when no args are provided', () => {
    const output = run(`node ${CLI_PATH}`);
    expect(output).toContain('objectenvy-cli');
    expect(output).toContain('env-y-config');
    expect(output).toContain('config-y-env');
  });

  it('delegates env-y-config --version', () => {
    const output = run(`node ${CLI_PATH} env-y-config --version`).trim();
    expect(output).toMatch(/\d+\.\d+\.\d+/);
  });

  it('delegates env-y-config --help', () => {
    const output = run(`node ${CLI_PATH} env-y-config --help`);
    expect(output).toContain('env-y-config');
    expect(output).toContain('Generate .env files from schema definitions');
  });

  it('delegates config-y-env --version', () => {
    const output = run(`node ${CLI_PATH} config-y-env --version`).trim();
    expect(output).toMatch(/\d+\.\d+\.\d+/);
  });

  it('delegates config-y-env --help', () => {
    const output = run(`node ${CLI_PATH} config-y-env --help`);
    expect(output).toContain('config-y-env');
    expect(output).toContain('Generate TypeScript types and schemas from .env files');
  });
});
