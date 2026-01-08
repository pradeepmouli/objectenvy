/**
 * Error handling for config-y-env
 * @module utils/errors
 */

/**
 * Exit codes for CLI operations
 */
export const EXIT_CODES = {
  SUCCESS: 0,
  FILE_NOT_FOUND: 1,
  PARSE_ERROR: 2,
  INVALID_FORMAT: 3,
  OUTPUT_ERROR: 4,
  EXECUTION_TIMEOUT: 5
} as const;

/**
 * Error categories
 */
export enum ErrorCategory {
  INPUT = 'INPUT',
  PARSE = 'PARSE',
  VALIDATION = 'VALIDATION',
  OUTPUT = 'OUTPUT',
  EXECUTION = 'EXECUTION'
}

/**
 * Detailed error information
 */
export interface DetailedError {
  category: ErrorCategory;
  code: keyof typeof EXIT_CODES;
  message: string;
  detail?: string;
  file?: string;
  line?: number;
  suggestion?: string;
}

/**
 * Conversion-specific error class
 */
export class ConversionError extends Error {
  constructor(
    public category: ErrorCategory,
    public exitCode: number,
    message: string,
    public detail?: string,
    public suggestion?: string,
    public file?: string,
    public line?: number
  ) {
    super(message);
    this.name = 'ConversionError';
  }

  /**
   * Get formatted error message with details
   */
  getFormattedMessage(): string {
    let msg = `Error: ${this.message}`;

    if (this.file) {
      msg += `\n\nFile: ${this.file}`;
      if (this.line) {
        msg += `:${this.line}`;
      }
    }

    if (this.detail) {
      msg += `\n\nDetails: ${this.detail}`;
    }

    if (this.suggestion) {
      msg += `\n\nSuggestion: ${this.suggestion}`;
    }

    return msg;
  }
}

/**
 * Create error with file not found details
 */
export function createFileNotFoundError(filePath: string): ConversionError {
  return new ConversionError(
    ErrorCategory.INPUT,
    EXIT_CODES.FILE_NOT_FOUND,
    `Input file not found: ${filePath}`,
    'Make sure the file path is correct and the file exists.',
    'Use absolute or relative path from current directory'
  );
}

/**
 * Create error with parse failure details
 */
export function createParseError(filePath: string, reason: string): ConversionError {
  return new ConversionError(
    ErrorCategory.PARSE,
    EXIT_CODES.PARSE_ERROR,
    `Failed to parse .env file: ${filePath}`,
    `Reason: ${reason}`,
    'Check the .env file syntax (KEY=value format)'
  );
}

/**
 * Create error with invalid syntax details
 */
export function createInvalidSyntaxError(
  filePath: string,
  line: number,
  lineContent: string
): ConversionError {
  return new ConversionError(
    ErrorCategory.INPUT,
    EXIT_CODES.INVALID_FORMAT,
    `Invalid .env syntax in ${filePath}`,
    `Line ${line}: ${lineContent}`,
    'Expected format: KEY=value (single = sign)'
  );
}

/**
 * Create error with output writing details
 */
export function createOutputError(
  filePath: string,
  reason: string
): ConversionError {
  return new ConversionError(
    ErrorCategory.OUTPUT,
    EXIT_CODES.OUTPUT_ERROR,
    `Cannot write to output file: ${filePath}`,
    `Reason: ${reason}`,
    'Check directory permissions or use a different output path'
  );
}

/**
 * Create error with timeout details
 */
export function createTimeoutError(operation: string): ConversionError {
  return new ConversionError(
    ErrorCategory.EXECUTION,
    EXIT_CODES.EXECUTION_TIMEOUT,
    `Operation timed out: ${operation}`,
    'The conversion took longer than expected.',
    'For large files, try increasing the timeout or processing in chunks'
  );
}
