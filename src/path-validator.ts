/**
 * Path validation utilities using sanitize-filename package
 */

import sanitize from 'sanitize-filename';
import { Messages, Validation } from './constants.js';
import path from 'path';
import fs from 'fs';

export interface PathValidationResult {
    isValid: boolean;
    error?: string;
    normalizedPath?: string;
    sanitizedPath?: string;
}

export class PathValidator {
    /**
     * Validates an output path for file operations using sanitize-filename package
     * @param outputPath - The path to validate
     * @returns PathValidationResult with validation status and details
     */
    static validateOutputPath(outputPath: string): PathValidationResult {
        // Check if path is empty or only whitespace
        if (!outputPath || outputPath.trim().length === 0) {
            return {
                isValid: false,
                error: Messages.EMPTY_PATH
            };
        }

        // Trim whitespace
        const trimmedPath = outputPath.trim();

        // Check path length
        if (trimmedPath.length > Validation.MAX_PATH_LENGTH) {
            return {
                isValid: false,
                error: Messages.PATH_TOO_LONG
            };
        }

        // Extract filename for additional validation
        const filename = path.basename(trimmedPath);
        
        // Check filename length
        if (filename.length > Validation.MAX_FILENAME_LENGTH) {
            return {
                isValid: false,
                error: Messages.FILENAME_TOO_LONG
            };
        }

        // Check for reserved filenames (Windows only)
        if (process.platform === 'win32' && Validation.RESERVED_NAMES.test(filename)) {
            return {
                isValid: false,
                error: Messages.RESERVED_FILENAME
            };
        }

        // Check for path traversal attempts
        if (trimmedPath.includes('..') || trimmedPath.includes('~')) {
            return {
                isValid: false,
                error: Messages.INVALID_PATH_FORMAT
            };
        }

        // Sanitize the filename to check if it changes (indicating invalid characters)
        const sanitizedFilename = sanitize(filename);
        if (sanitizedFilename !== filename) {
            return {
                isValid: false,
                error: Messages.INVALID_PATH_CHARS,
                sanitizedPath: path.join(path.dirname(trimmedPath), sanitizedFilename)
            };
        }

        // Path is valid, normalize it
        const normalizedPath = path.resolve(trimmedPath);
        
        return {
            isValid: true,
            normalizedPath: normalizedPath
        };
    }

    /**
     * Validates and sanitizes a filename using sanitize-filename package
     * @param filename - The filename to validate
     * @returns PathValidationResult with validation status and sanitized filename
     */
    static validateAndSanitizeFilename(filename: string): PathValidationResult {
        if (!filename || filename.trim().length === 0) {
            return {
                isValid: false,
                error: Messages.EMPTY_PATH
            };
        }

        const trimmedFilename = filename.trim();

        // Check filename length
        if (trimmedFilename.length > Validation.MAX_FILENAME_LENGTH) {
            return {
                isValid: false,
                error: Messages.FILENAME_TOO_LONG
            };
        }

        // Check for reserved names (Windows only)
        if (process.platform === 'win32' && Validation.RESERVED_NAMES.test(trimmedFilename)) {
            return {
                isValid: false,
                error: Messages.RESERVED_FILENAME
            };
        }

        // Sanitize the filename
        const sanitizedFilename = sanitize(trimmedFilename);
        
        // Check if sanitization changed the filename
        if (sanitizedFilename !== trimmedFilename) {
            return {
                isValid: false,
                error: Messages.INVALID_PATH_CHARS,
                sanitizedPath: sanitizedFilename
            };
        }

        return {
            isValid: true,
            normalizedPath: sanitizedFilename
        };
    }

    /**
     * Sanitizes a filename without validation (always returns a valid filename)
     * @param filename - The filename to sanitize
     * @returns string - The sanitized filename
     */
    static sanitizeFilename(filename: string): string {
        if (!filename || filename.trim().length === 0) {
            return 'untitled';
        }

        const trimmedFilename = filename.trim();
        const sanitized = sanitize(trimmedFilename);
        
        // If sanitization results in empty string, use a default
        if (!sanitized || sanitized.length === 0) {
            return 'untitled';
        }

        return sanitized;
    }

    /**
     * Checks if a directory exists and is writable
     * @param dirPath - The directory path to check
     * @returns boolean indicating if directory is writable
     */
    static async isDirectoryWritable(dirPath: string): Promise<boolean> {
        try {
            // Check if directory exists
            const stats = await fs.promises.stat(dirPath);
            if (!stats.isDirectory()) {
                return false;
            }

            // Try to write a test file
            const testFile = path.join(dirPath, '.write-test-' + Date.now());
            await fs.promises.writeFile(testFile, 'test');
            await fs.promises.unlink(testFile);
            
            return true;
        } catch (error) {
            return false;
        }
    }

    /**
     * Ensures the directory for a given file path exists
     * @param filePath - The file path whose directory should exist
     * @returns Promise<boolean> indicating success
     */
    static async ensureDirectoryExists(filePath: string): Promise<boolean> {
        try {
            const dir = path.dirname(filePath);
            await fs.promises.mkdir(dir, { recursive: true });
            return true;
        } catch (error) {
            return false;
        }
    }
}
