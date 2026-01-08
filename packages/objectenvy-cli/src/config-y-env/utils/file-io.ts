/**
 * File I/O utilities with pre-flight validation for config-y-env
 * @module utils/file-io
 */

import { promises as fs } from 'fs';
import { dirname } from 'path';
import { createOutputError } from './errors.js';

/**
 * Read file contents
 */
export async function readFile(filePath: string): Promise<string> {
  try {
    return await fs.readFile(filePath, 'utf-8');
  } catch (error) {
    throw createOutputError(filePath, `Cannot read file: ${String(error)}`);
  }
}

/**
 * Write file atomically (write to temp, then move)
 */
export async function writeFileAtomic(filePath: string, content: string): Promise<void> {
  try {
    const dir = dirname(filePath);

    // Ensure directory exists
    try {
      await fs.mkdir(dir, { recursive: true });
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'EEXIST') {
        throw error;
      }
    }

    // Write to temporary file first
    const tempPath = `${filePath}.tmp`;
    await fs.writeFile(tempPath, content, 'utf-8');

    // Atomic move (rename)
    await fs.rename(tempPath, filePath);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw createOutputError(filePath, message);
  }
}

/**
 * Check if file exists
 */
export async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get file size in bytes
 */
export async function getFileSize(filePath: string): Promise<number> {
  try {
    const stat = await fs.stat(filePath);
    return stat.size;
  } catch (error) {
    throw createOutputError(filePath, `Cannot get file stats: ${String(error)}`);
  }
}

/**
 * Pre-flight validation before writing output
 */
export async function validateOutputPath(filePath: string): Promise<void> {
  try {
    const dir = dirname(filePath);

    // Check if directory is writable
    try {
      await fs.access(dir, fs.constants.W_OK);
    } catch {
      throw new Error('Directory is not writable');
    }

    // Check if file already exists and is writable
    if (await fileExists(filePath)) {
      try {
        await fs.access(filePath, fs.constants.W_OK);
      } catch {
        throw new Error('File exists but is not writable');
      }
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw createOutputError(filePath, message);
  }
}
