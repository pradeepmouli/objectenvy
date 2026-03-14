/**
 * File I/O utilities with atomic writes for env-y-config
 * @module utils/file-io
 */

import { promises as fs } from 'fs';
import { dirname } from 'path';
import { createOutputError } from './errors.js';

/**
 * Write file with atomic operations (write to temp, then move)
 */
export async function writeFileAtomic(filePath: string, content: string): Promise<void> {
  try {
    const dir = dirname(filePath);

    // Ensure directory exists
    await fs.mkdir(dir, { recursive: true });

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
 * Pre-flight validation before writing
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
