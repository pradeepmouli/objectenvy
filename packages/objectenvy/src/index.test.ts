import { describe, it, expect } from 'vitest';
import * as objectenvy from './index.js';

describe('Module exports', () => {
  it('exports all main functions', () => {
    expect(objectenvy.objectify).toBeDefined();
    expect(objectenvy.objectEnvy).toBeDefined();
    expect(objectenvy.override).toBeDefined();
    expect(objectenvy.merge).toBeDefined();
    expect(objectenvy.toCamelCase).toBeDefined();
    expect(objectenvy.toSnakeCase).toBeDefined();
    expect(objectenvy.coerceValue).toBeDefined();
  });

  it('exports objectify for creating config from env', () => {
    expect(typeof objectenvy.objectify).toBe('function');
  });

  it('exports objectEnvy for creating config loader', () => {
    expect(typeof objectenvy.objectEnvy).toBe('function');
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
