/**
 * Downloader - Handles file downloads and hash verification
 */

import https from 'https';
import http from 'http';
import zlib from 'zlib';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { FetchOptions, DownloadProgress, DownloadResult } from './types.js';
import { HTTP, Math as MathConstants, Timeouts, UserAgent } from './constants.js';

export class Downloader {
    private userAgent = UserAgent.DEFAULT;

    /**
     * Download a file from URL with progress tracking
     */
    async downloadFile(url: string, outputPath: string, onProgress?: (progress: DownloadProgress) => void): Promise<void> {
        return new Promise((resolve, reject) => {
            const protocol = url.startsWith('https:') ? https : http;
            
            const options: FetchOptions = {
                headers: {
                    'User-Agent': this.userAgent,
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                    'Accept-Language': 'en-US,en;q=0.5',
                    'Accept-Encoding': 'gzip, deflate, br',
                    'Connection': 'keep-alive',
                    'Upgrade-Insecure-Requests': '1'
                }
            };

            const request = protocol.get(url, options, (response) => {
                if (response.statusCode !== HTTP.SUCCESS_STATUS) {
                    reject(new Error(`HTTP ${response.statusCode}: ${response.statusMessage}`));
                    return;
                }

                const totalBytes = parseInt(response.headers['content-length'] || '0', 10);
                let bytesDownloaded = 0;

                // Handle compression
                let stream: any = response;
                const contentEncoding = response.headers['content-encoding'];
                
                if (contentEncoding === 'gzip') {
                    stream = response.pipe(zlib.createGunzip());
                } else if (contentEncoding === 'deflate') {
                    stream = response.pipe(zlib.createInflate());
                } else if (contentEncoding === 'br') {
                    stream = response.pipe(zlib.createBrotliDecompress());
                }

                const fileStream = fs.createWriteStream(outputPath);

                stream.on('data', (chunk: any) => {
                    bytesDownloaded += chunk.length;
                    
                    if (onProgress && totalBytes > 0) {
                        const percentage = (bytesDownloaded / totalBytes) * MathConstants.PERCENTAGE_MULTIPLIER;
                        onProgress({
                            bytesDownloaded,
                            totalBytes,
                            percentage
                        });
                    }
                });

                stream.on('end', () => {
                    fileStream.end();
                    resolve();
                });

                stream.on('error', (error: any) => {
                    fileStream.destroy();
                    reject(error);
                });

                fileStream.on('error', (error: any) => {
                    reject(error);
                });

                stream.pipe(fileStream);
            });

            request.on('error', (error) => {
                reject(error);
            });

            request.setTimeout(Timeouts.REQUEST_TIMEOUT, () => {
                request.destroy();
                reject(new Error('Request timeout'));
            });
        });
    }

    /**
     * Calculate SHA256 checksum of a file
     */
    async calculateChecksum(filePath: string): Promise<string> {
        return new Promise((resolve, reject) => {
            const hash = crypto.createHash('sha256');
            const stream = fs.createReadStream(filePath);

            stream.on('data', (data) => {
                hash.update(data);
            });

            stream.on('end', () => {
                resolve(hash.digest('hex'));
            });

            stream.on('error', (error) => {
                reject(error);
            });
        });
    }

    /**
     * Calculate MD5 checksum of a file
     */
    async calculateMD5Checksum(filePath: string): Promise<string> {
        return new Promise((resolve, reject) => {
            const hash = crypto.createHash('md5');
            const stream = fs.createReadStream(filePath);

            stream.on('data', (data) => {
                hash.update(data);
            });

            stream.on('end', () => {
                resolve(hash.digest('hex'));
            });

            stream.on('error', (error) => {
                reject(error);
            });
        });
    }

    /**
     * Download and verify a file
     */
    async downloadAndVerify(
        url: string, 
        outputPath: string, 
        expectedHash?: string,
        hashType?: string,
        onProgress?: (progress: DownloadProgress) => void
    ): Promise<DownloadResult> {
        console.log(`📦 Starting download: ${path.basename(outputPath)}`);
        
        await this.downloadFile(url, outputPath, onProgress);
        
        const stats = fs.statSync(outputPath);
        const fileSize = stats.size;
        const fileSizeMB = (fileSize / (MathConstants.BYTES_TO_MB * MathConstants.BYTES_TO_MB)).toFixed(2);
        
        console.log(`✅ Download completed: ${path.basename(outputPath)}`);
        console.log(`📏 File size: ${fileSizeMB} MB`);
        
        console.log(`\n=== Verifying Download ===`);
        console.log(`✅ File: ${path.basename(outputPath)}`);
        console.log(`📊 Size: ${fileSizeMB} MB`);
        
        // Determine which checksum algorithm to use based on hashType parameter or fallback to length detection
        const isMD5Expected = hashType === 'MD5' || (expectedHash && expectedHash.length === 32 && !hashType);
        const checksum = isMD5Expected 
            ? await this.calculateMD5Checksum(outputPath)
            : await this.calculateChecksum(outputPath);
        const downloadTime = new Date().toISOString();
        
        const algorithm = isMD5Expected ? 'MD5' : 'SHA256';
        console.log(`🔒 ${algorithm}: ${checksum}`);
        console.log(`📅 Downloaded: ${downloadTime}`);
        
        // Verify hash if provided
        if (expectedHash) {
            console.log(`\n=== Hash Verification ===`);
            console.log(`Expected: ${expectedHash}`);
            console.log(`Actual:   ${checksum}`);
            
            if (checksum.toLowerCase() === expectedHash.toLowerCase()) {
                console.log(`✅ ${algorithm} hash verification PASSED - File integrity confirmed!`);
            } else {
                console.log(`❌ ${algorithm} hash verification FAILED - File may be corrupted!`);
                throw new Error(`Hash verification failed! Expected: ${expectedHash}, Actual: ${checksum}`);
            }
        }
        
        return {
            filePath: outputPath,
            fileSize,
            checksum,
            downloadTime
        };
    }

    /**
     * Format file size for display
     */
    formatFileSize(bytes: number): string {
        const mb = bytes / (MathConstants.BYTES_TO_MB * MathConstants.BYTES_TO_MB);
        return `${mb.toFixed(2)} MB`;
    }

    /**
     * Format progress for display with line replacement
     */
    formatProgress(progress: DownloadProgress): string {
        const mbDownloaded = (progress.bytesDownloaded / (MathConstants.BYTES_TO_MB * MathConstants.BYTES_TO_MB)).toFixed(2);
        const mbTotal = (progress.totalBytes / (MathConstants.BYTES_TO_MB * MathConstants.BYTES_TO_MB)).toFixed(2);
        return `\r⬇️  Progress: ${progress.percentage.toFixed(1)}% (${mbDownloaded}/${mbTotal} MB)`;
    }
}
