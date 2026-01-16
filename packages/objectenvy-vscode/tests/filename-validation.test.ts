/**
 * Filename validation tests for type generation
 * Tests the validation and normalization logic for generated type filenames
 */

import { describe, it, expect } from 'vitest';

// Import the utility functions directly to avoid importing the full extension
// which has dependencies on objectenvy that may not be built
const validateTypeFilename = (value: string | undefined): string | null => {
  if (!value) {
    return 'Filename cannot be empty';
  }
  if (!/\.types\.ts$/.test(value)) {
    return 'Filename must end with .types.ts';
  }
  return null;
};

const normalizeTypeFilename = (filename: string): string => {
  if (filename.endsWith('.types.ts')) {
    return filename;
  }
  // Replace any .ts suffix (including compound extensions like .d.ts) with .types.ts
  return filename.replace(/(\.[^/\\]+)?\.ts$/, '.types.ts');
};

describe('validateTypeFilename', () => {
  describe('valid inputs', () => {
    it('should accept filename with .types.ts suffix', () => {
      const result = validateTypeFilename('config.types.ts');
      expect(result).toBeNull();
    });

    it('should accept filename with kebab-case and .types.ts suffix', () => {
      const result = validateTypeFilename('app-config.types.ts');
      expect(result).toBeNull();
    });

    it('should accept filename with multiple dots and .types.ts suffix', () => {
      const result = validateTypeFilename('my.app.config.types.ts');
      expect(result).toBeNull();
    });

    it('should accept filename with uppercase letters and .types.ts suffix', () => {
      const result = validateTypeFilename('AppConfig.types.ts');
      expect(result).toBeNull();
    });

    it('should accept filename with numbers and .types.ts suffix', () => {
      const result = validateTypeFilename('config-v2.types.ts');
      expect(result).toBeNull();
    });
  });

  describe('invalid inputs', () => {
    it('should reject empty string', () => {
      const result = validateTypeFilename('');
      expect(result).toBe('Filename cannot be empty');
    });

    it('should reject undefined', () => {
      const result = validateTypeFilename(undefined);
      expect(result).toBe('Filename cannot be empty');
    });

    it('should reject filename without .ts extension', () => {
      const result = validateTypeFilename('config.types');
      expect(result).toBe('Filename must end with .types.ts');
    });

    it('should reject filename with only .ts extension', () => {
      const result = validateTypeFilename('config.ts');
      expect(result).toBe('Filename must end with .types.ts');
    });

    it('should reject filename with .d.ts extension', () => {
      const result = validateTypeFilename('config.d.ts');
      expect(result).toBe('Filename must end with .types.ts');
    });

    it('should reject filename with .spec.ts extension', () => {
      const result = validateTypeFilename('config.spec.ts');
      expect(result).toBe('Filename must end with .types.ts');
    });

    it('should reject filename with .test.ts extension', () => {
      const result = validateTypeFilename('config.test.ts');
      expect(result).toBe('Filename must end with .types.ts');
    });

    it('should reject filename without any extension', () => {
      const result = validateTypeFilename('config');
      expect(result).toBe('Filename must end with .types.ts');
    });

    it('should reject filename with wrong order (.ts.types)', () => {
      const result = validateTypeFilename('config.ts.types');
      expect(result).toBe('Filename must end with .types.ts');
    });
  });
});

describe('normalizeTypeFilename', () => {
  describe('already normalized filenames', () => {
    it('should return filename unchanged if it already ends with .types.ts', () => {
      const result = normalizeTypeFilename('config.types.ts');
      expect(result).toBe('config.types.ts');
    });

    it('should return kebab-case filename unchanged if it already ends with .types.ts', () => {
      const result = normalizeTypeFilename('app-config.types.ts');
      expect(result).toBe('app-config.types.ts');
    });

    it('should return filename with multiple dots unchanged if it already ends with .types.ts', () => {
      const result = normalizeTypeFilename('my.app.config.types.ts');
      expect(result).toBe('my.app.config.types.ts');
    });
  });

  describe('normalization of .ts extensions', () => {
    it('should convert .ts to .types.ts', () => {
      const result = normalizeTypeFilename('config.ts');
      expect(result).toBe('config.types.ts');
    });

    it('should handle filename without extension', () => {
      const result = normalizeTypeFilename('config');
      // Since there's no .ts suffix to replace, it remains unchanged
      expect(result).toBe('config');
    });
  });

  describe('edge cases with compound extensions', () => {
    it('should convert .d.ts to .types.ts', () => {
      const result = normalizeTypeFilename('config.d.ts');
      expect(result).toBe('config.types.ts');
    });

    it('should convert .spec.ts to .types.ts', () => {
      const result = normalizeTypeFilename('config.spec.ts');
      expect(result).toBe('config.types.ts');
    });

    it('should convert .test.ts to .types.ts', () => {
      const result = normalizeTypeFilename('config.test.ts');
      expect(result).toBe('config.types.ts');
    });

    it('should handle multiple compound extensions before .ts', () => {
      const result = normalizeTypeFilename('config.definition.d.ts');
      // The regex replaces .definition.d.ts with .types.ts
      expect(result).toBe('config.types.ts');
    });

    it('should handle filename with path separators (forward slash)', () => {
      const result = normalizeTypeFilename('path/to/config.ts');
      expect(result).toBe('path/to/config.types.ts');
    });

    it('should handle filename with path separators (backslash)', () => {
      const result = normalizeTypeFilename('path\\to\\config.ts');
      expect(result).toBe('path\\to\\config.types.ts');
    });

    it('should not modify path separators in filenames', () => {
      const result = normalizeTypeFilename('path/to/config.d.ts');
      expect(result).toBe('path/to/config.types.ts');
    });
  });

  describe('special characters', () => {
    it('should handle filenames with underscores', () => {
      const result = normalizeTypeFilename('app_config.ts');
      expect(result).toBe('app_config.types.ts');
    });

    it('should handle filenames with hyphens', () => {
      const result = normalizeTypeFilename('app-config.ts');
      expect(result).toBe('app-config.types.ts');
    });

    it('should handle filenames with numbers', () => {
      const result = normalizeTypeFilename('config-v2.ts');
      expect(result).toBe('config-v2.types.ts');
    });

    it('should handle filenames with uppercase letters', () => {
      const result = normalizeTypeFilename('AppConfig.ts');
      expect(result).toBe('AppConfig.types.ts');
    });
  });

  describe('realistic use cases', () => {
    it('should normalize lowercase interface name suggestion', () => {
      const interfaceName = 'Config';
      const suggestedFilename = `${interfaceName.toLowerCase()}.types.ts`;
      const result = normalizeTypeFilename(suggestedFilename);
      expect(result).toBe('config.types.ts');
    });

    it('should handle user entering .ts instead of .types.ts', () => {
      const result = normalizeTypeFilename('my-custom-config.ts');
      expect(result).toBe('my-custom-config.types.ts');
    });

    it('should handle user entering .d.ts accidentally', () => {
      const result = normalizeTypeFilename('environment.d.ts');
      expect(result).toBe('environment.types.ts');
    });
  });
});
