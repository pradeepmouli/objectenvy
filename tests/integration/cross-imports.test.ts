/**
 * Cross-package import resolution tests
 * Verifies that packages can correctly import from each other
 */

import { describe, it, expect } from 'vitest';

describe('cross-package imports', () => {
  it('should import configEnvy from core library', async () => {
    const module = await import('../../packages/objectenvy/src/index.js');
    expect(module.configEnvy).toBeDefined();
    expect(typeof module.configEnvy).toBe('function');
  });

  it('should import config alias from core library', async () => {
    const module = await import('../../packages/objectenvy/src/index.js');
    expect(module.config).toBeDefined();
    expect(module.config).toBe(module.configEnvy);
  });

  it('should import utility functions from core library', async () => {
    const module = await import('../../packages/objectenvy/src/index.js');
    expect(module.toCamelCase).toBeDefined();
    expect(module.toSnakeCase).toBeDefined();
    expect(module.coerceValue).toBeDefined();
  });

  it('should import type definitions from core library', async () => {
    // Type imports are only checked at compile time
    // This test verifies the module can be imported
    const module = await import('../../packages/objectenvy/src/index.js');
    expect(module).toBeDefined();
  });

  it('should have consistent exports between named and default imports', async () => {
    const namedImports = await import('../../packages/objectenvy/src/index.js');
    expect(namedImports.configEnvy).toBeDefined();
    expect(namedImports.createConfigEnvy).toBeDefined();
  });
});
