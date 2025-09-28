#!/usr/bin/env node

import { spawn } from 'child_process';
import { promises as fs } from 'fs';

interface VersionInfo {
    version: string;
    date: string;
    checksum: string;
}

interface TestResult {
    version: string;
    success: boolean;
    error?: string;
    downloadTime?: number;
    fileSize?: string;
}

class VersionTester {
    private results: TestResult[] = [];
    private failedVersions: string[] = [];
    private startTime: number = Date.now();

    async run(): Promise<void> {
        console.log('🚀 Starting comprehensive version test...\n');
        
        // Read versions from the JSON file
        const versions = await this.loadVersions();
        console.log(`📋 Found ${versions.length} versions to test\n`);

        // Test each version
        for (let i = 0; i < versions.length; i++) {
            const version = versions[i];
            console.log(`\n[${i + 1}/${versions.length}] Testing version ${version.version}...`);
            
            const result = await this.testVersion(version);
            this.results.push(result);
            
            if (!result.success) {
                this.failedVersions.push(version.version);
                console.log(`❌ FAILED: ${version.version} - ${result.error}`);
            } else {
                console.log(`✅ SUCCESS: ${version.version} (${result.fileSize}, ${result.downloadTime}ms)`);
            }
        }

        // Generate reports
        await this.generateReports();
    }

    private async loadVersions(): Promise<VersionInfo[]> {
        try {
            const versionsData = await fs.readFile('versions-list.json', 'utf-8');
            const data = JSON.parse(versionsData);
            return data.versions || [];
        } catch (error) {
            console.error('❌ Failed to load versions:', error);
            throw error;
        }
    }

    private async testVersion(version: VersionInfo): Promise<TestResult> {
        const startTime = Date.now();
        const outputFile = `test-${version.version.replace(/\./g, '-')}.zip`;
        
        return new Promise((resolve) => {
            const child = spawn('npm', ['start', '--', '--d', version.version, '--output', outputFile], {
                stdio: ['pipe', 'pipe', 'pipe'],
                cwd: process.cwd()
            });

            let stdout = '';
            let stderr = '';

            child.stdout?.on('data', (data) => {
                stdout += data.toString();
            });

            child.stderr?.on('data', (data) => {
                stderr += data.toString();
            });

            child.on('close', async (code) => {
                const downloadTime = Date.now() - startTime;
                
                if (code === 0) {
                    // Check if file was created and get its size
                    try {
                        const stats = await fs.stat(outputFile);
                        const fileSize = this.formatFileSize(stats.size);
                        
                        // Clean up test file
                        await fs.unlink(outputFile);
                        
                        resolve({
                            version: version.version,
                            success: true,
                            downloadTime,
                            fileSize
                        });
                    } catch (error) {
                        resolve({
                            version: version.version,
                            success: false,
                            error: 'Download completed but file not found',
                            downloadTime
                        });
                    }
                } else {
                    // Clean up any partial file
                    try {
                        await fs.unlink(outputFile);
                    } catch {
                        // File might not exist, ignore error
                    }
                    
                    resolve({
                        version: version.version,
                        success: false,
                        error: stderr || stdout || `Process exited with code ${code}`,
                        downloadTime
                    });
                }
            });

            child.on('error', (error) => {
                resolve({
                    version: version.version,
                    success: false,
                    error: error.message,
                    downloadTime: Date.now() - startTime
                });
            });

            // Set a timeout for each download (5 minutes)
            setTimeout(() => {
                if (!child.killed) {
                    child.kill('SIGTERM');
                    resolve({
                        version: version.version,
                        success: false,
                        error: 'Download timeout (5 minutes)',
                        downloadTime: Date.now() - startTime
                    });
                }
            }, 5 * 60 * 1000);
        });
    }

    private formatFileSize(bytes: number): string {
        const sizes = ['B', 'KB', 'MB', 'GB'];
        if (bytes === 0) return '0 B';
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
    }

    private async generateReports(): Promise<void> {
        const totalTime = Date.now() - this.startTime;
        const successCount = this.results.filter(r => r.success).length;
        const failureCount = this.results.filter(r => !r.success).length;

        // Generate summary report
        const summary = {
            timestamp: new Date().toISOString(),
            totalVersions: this.results.length,
            successful: successCount,
            failed: failureCount,
            successRate: `${((successCount / this.results.length) * 100).toFixed(1)}%`,
            totalTime: this.formatDuration(totalTime),
            results: this.results
        };

        await fs.writeFile('test-results-summary.json', JSON.stringify(summary, null, 2));

        // Generate failed versions file
        if (this.failedVersions.length > 0) {
            const failedReport = {
                timestamp: new Date().toISOString(),
                totalFailed: this.failedVersions.length,
                failedVersions: this.failedVersions,
                failedDetails: this.results.filter(r => !r.success)
            };
            
            await fs.writeFile('failed-versions.json', JSON.stringify(failedReport, null, 2));
        }

        // Print summary
        console.log('\n' + '='.repeat(60));
        console.log('📊 TEST SUMMARY');
        console.log('='.repeat(60));
        console.log(`Total Versions: ${this.results.length}`);
        console.log(`✅ Successful: ${successCount}`);
        console.log(`❌ Failed: ${failureCount}`);
        console.log(`📈 Success Rate: ${((successCount / this.results.length) * 100).toFixed(1)}%`);
        console.log(`⏱️  Total Time: ${this.formatDuration(totalTime)}`);
        
        if (this.failedVersions.length > 0) {
            console.log('\n❌ Failed Versions:');
            this.failedVersions.forEach(version => {
                const result = this.results.find(r => r.version === version);
                console.log(`  - ${version}: ${result?.error}`);
            });
        }

        console.log('\n📄 Reports saved:');
        console.log('  - test-results-summary.json (complete results)');
        if (this.failedVersions.length > 0) {
            console.log('  - failed-versions.json (failed versions only)');
        }
    }

    private formatDuration(ms: number): string {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        
        if (hours > 0) {
            return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
        } else if (minutes > 0) {
            return `${minutes}m ${seconds % 60}s`;
        } else {
            return `${seconds}s`;
        }
    }
}

// Run the test
async function main() {
    try {
        const tester = new VersionTester();
        await tester.run();
    } catch (error) {
        console.error('❌ Test failed:', error);
        process.exit(1);
    }
}

if (import.meta.url === `file://${process.argv[1]}`) {
    main();
}
