import { describe, it, expect } from 'vitest';
import * as configenvy from './index.js';

describe('Module exports', () => {
  it('exports all main functions', () => {
    expect(configenvy.configEnvy).toBeDefined();
    expect(configenvy.config).toBeDefined();
    expect(configenvy.createConfigEnvy).toBeDefined();
    expect(configenvy.createConfig).toBeDefined();
    expect(configenvy.applyDefaults).toBeDefined();
    expect(configenvy.merge).toBeDefined();
    expect(configenvy.toCamelCase).toBeDefined();
    expect(configenvy.toSnakeCase).toBeDefined();
    expect(configenvy.coerceValue).toBeDefined();
  });

  it('maintains backward compatibility with aliases', () => {
    // Original names should still work
    expect(configenvy.configEnvy).toBe(configenvy.config);
    expect(configenvy.createConfigEnvy).toBe(configenvy.createConfig);
  });
});

describe('Example test suite', () => {
  it('should pass a basic test', () => {
    expect(true).toBe(true);
  });

  it('should perform arithmetic correctly', () => {
    expect(2 + 2).toBe(4);
  });
});
