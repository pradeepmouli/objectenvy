/**
 * CLI execution tests for env-y-config
 * Tests that the CLI runs successfully with various inputs
 */

import { describe, it, expect } from 'vitest';
import { execSync } from 'child_process';
import { resolve } from 'path';

const CLI_PATH = resolve(__dirname, '../../bin/env-y-config.js');

describe('env-y-config CLI execution', () => {
  it('should display version', () => {
    const output = execSync(`node ${CLI_PATH} --version`, { encoding: 'utf-8' }).trim();
    expect(output).toMatch(/\d+\.\d+\.\d+/);
  });

  it('should display help', () => {
    const output = execSync(`node ${CLI_PATH} --help`, { encoding: 'utf-8' });
    expect(output).toContain('env-y-config');
    expect(output).toContain('Generate .env files from schema definitions');
  });

  it('should list help commands', () => {
    const output = execSync(`node ${CLI_PATH} help`, { encoding: 'utf-8' });
    expect(output).toContain('Usage:');
  });
});
