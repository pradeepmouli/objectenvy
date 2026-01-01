import { describe, it, expect } from 'vitest';
import {
  toCamelCase,
  toSnakeCase,
  coerceValue,
  setNestedValue,
  parseEnvKeyToPath
} from './utils.js';

describe('toCamelCase', () => {
  it('converts SCREAMING_SNAKE_CASE to camelCase', () => {
    expect(toCamelCase('PORT_NUMBER')).toBe('portNumber');
    expect(toCamelCase('LOG_LEVEL')).toBe('logLevel');
    expect(toCamelCase('DATABASE_CONNECTION_STRING')).toBe('databaseConnectionString');
  });

  it('handles single word', () => {
    expect(toCamelCase('PORT')).toBe('port');
    expect(toCamelCase('DEBUG')).toBe('debug');
  });

  it('handles already lowercase', () => {
    expect(toCamelCase('port')).toBe('port');
    expect(toCamelCase('log_level')).toBe('logLevel');
  });
});

describe('toSnakeCase', () => {
  it('converts camelCase to SCREAMING_SNAKE_CASE', () => {
    expect(toSnakeCase('portNumber')).toBe('PORT_NUMBER');
    expect(toSnakeCase('logLevel')).toBe('LOG_LEVEL');
    expect(toSnakeCase('databaseConnectionString')).toBe('DATABASE_CONNECTION_STRING');
  });

  it('handles single word', () => {
    expect(toSnakeCase('port')).toBe('PORT');
    expect(toSnakeCase('debug')).toBe('DEBUG');
  });
});

describe('coerceValue', () => {
  it('coerces boolean strings', () => {
    expect(coerceValue('true')).toBe(true);
    expect(coerceValue('false')).toBe(false);
    expect(coerceValue('TRUE')).toBe(true);
    expect(coerceValue('FALSE')).toBe(false);
    expect(coerceValue('True')).toBe(true);
  });

  it('coerces yes/no and y/n boolean equivalents', () => {
    expect(coerceValue('yes')).toBe(true);
    expect(coerceValue('y')).toBe(true);
    expect(coerceValue('no')).toBe(false);
    expect(coerceValue('n')).toBe(false);
    expect(coerceValue('YES')).toBe(true);
    expect(coerceValue('Yes')).toBe(true);
    expect(coerceValue('Y')).toBe(true);
    expect(coerceValue('NO')).toBe(false);
    expect(coerceValue('No')).toBe(false);
    expect(coerceValue('N')).toBe(false);
  });

  it('coerces integer strings', () => {
    expect(coerceValue('123')).toBe(123);
    expect(coerceValue('0')).toBe(0);
    expect(coerceValue('-42')).toBe(-42);
    expect(coerceValue('3000')).toBe(3000);
  });

  it('coerces float strings', () => {
    expect(coerceValue('3.14')).toBe(3.14);
    expect(coerceValue('-2.5')).toBe(-2.5);
    expect(coerceValue('0.123')).toBe(0.123);
  });

  it('keeps non-numeric strings as strings', () => {
    expect(coerceValue('hello')).toBe('hello');
    expect(coerceValue('/var/log')).toBe('/var/log');
    expect(coerceValue('123abc')).toBe('123abc');
    expect(coerceValue('')).toBe('');
  });
});

describe('setNestedValue', () => {
  it('sets a simple value', () => {
    const obj: Record<string, unknown> = {};
    setNestedValue(obj, ['port'], 3000);
    expect(obj).toEqual({ port: 3000 });
  });

  it('sets nested values', () => {
    const obj: Record<string, unknown> = {};
    setNestedValue(obj, ['log', 'level'], 'debug');
    expect(obj).toEqual({ log: { level: 'debug' } });
  });

  it('sets deeply nested values', () => {
    const obj: Record<string, unknown> = {};
    setNestedValue(obj, ['database', 'connection', 'host'], 'localhost');
    expect(obj).toEqual({ database: { connection: { host: 'localhost' } } });
  });

  it('preserves existing nested structure', () => {
    const obj: Record<string, unknown> = { log: { level: 'debug' } };
    setNestedValue(obj, ['log', 'path'], '/var/log');
    expect(obj).toEqual({ log: { level: 'debug', path: '/var/log' } });
  });
});

describe('parseEnvKeyToPath', () => {
  it('parses simple keys', () => {
    expect(parseEnvKeyToPath('PORT')).toEqual(['port']);
    expect(parseEnvKeyToPath('DEBUG')).toEqual(['debug']);
  });

  it('parses compound keys into nested paths', () => {
    expect(parseEnvKeyToPath('LOG_LEVEL')).toEqual(['log', 'level']);
    expect(parseEnvKeyToPath('LOG_PATH')).toEqual(['log', 'path']);
    expect(parseEnvKeyToPath('DATABASE_CONNECTION_STRING')).toEqual([
      'database',
      'connection',
      'string'
    ]);
  });

  it('handles prefix stripping', () => {
    expect(parseEnvKeyToPath('APP_PORT', 'APP')).toEqual(['port']);
    expect(parseEnvKeyToPath('APP_LOG_LEVEL', 'APP')).toEqual(['log', 'level']);
    expect(parseEnvKeyToPath('APP_DATABASE_HOST', 'APP_')).toEqual(['database', 'host']);
  });

  it('returns empty for non-matching prefix', () => {
    expect(parseEnvKeyToPath('OTHER_VAR', 'APP')).toEqual([]);
    expect(parseEnvKeyToPath('PORT', 'APP')).toEqual([]);
  });
});
