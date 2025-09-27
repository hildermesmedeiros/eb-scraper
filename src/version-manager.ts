/**
 * Version Manager - Handles version data storage and retrieval
 */

import fs from 'fs';
import { EBVersion, EBVersionsData } from './types.js';
import { FileNames } from './constants.js';

export class VersionManager {
    private data: EBVersionsData;

    constructor() {
        this.data = this.loadVersionsData();
    }

    /**
     * Load version data from JSON file
     */
    private loadVersionsData(): EBVersionsData {
        try {
            if (fs.existsSync(FileNames.VERSIONS_LIST)) {
                const data = fs.readFileSync(FileNames.VERSIONS_LIST, 'utf8');
                return JSON.parse(data);
            }
        } catch (error) {
            console.warn('⚠️ Could not load versions file:', error instanceof Error ? error.message : String(error));
        }
        
        return {
            versions: [],
            lastScraped: ''
        };
    }

    /**
     * Save version data to JSON file
     */
    private saveVersionsData(): void {
        try {
            fs.writeFileSync(FileNames.VERSIONS_LIST, JSON.stringify(this.data, null, 2));
        } catch (error) {
            console.error('❌ Could not save versions file:', error instanceof Error ? error.message : String(error));
        }
    }

    /**
     * Get all versions
     */
    getVersions(): EBVersion[] {
        return this.data.versions;
    }

    /**
     * Get a specific version
     */
    getVersion(version: string): EBVersion | undefined {
        // Try exact match first
        let found = this.data.versions.find(v => v.version === version);
        
        // If not found, try with 'v' prefix
        if (!found && !version.startsWith('v')) {
            found = this.data.versions.find(v => v.version === `v${version}`);
        }
        
        // If not found, try without 'v' prefix
        if (!found && version.startsWith('v')) {
            found = this.data.versions.find(v => v.version === version.substring(1));
        }
        
        return found;
    }

    /**
     * Add or update a version (for manual updates only)
     */
    addOrUpdateVersion(version: string, hash: string, checksum?: string, releaseDate?: string): void {
        const existingVersion = this.getVersion(version);
        
        if (existingVersion) {
            existingVersion.hash = hash;
            existingVersion.lastUpdated = new Date().toISOString();
            if (checksum !== undefined) {
                existingVersion.checksum = checksum;
            }
            if (releaseDate !== undefined) {
                existingVersion.releaseDate = releaseDate;
            }
        } else {
            this.data.versions.push({
                version,
                hash,
                lastUpdated: new Date().toISOString(),
                checksum,
                releaseDate
            });
        }
        
        this.saveVersionsData();
    }

    /**
     * Update the last scraped timestamp
     */
    updateLastScraped(): void {
        this.data.lastScraped = new Date().toISOString();
        this.saveVersionsData();
    }

    /**
     * Set all versions (for manual updates only - versions list is maintained manually)
     */
    setVersions(versions: EBVersion[]): void {
        this.data.versions = versions;
        this.updateLastScraped();
    }

    /**
     * Check if version exists
     */
    hasVersion(version: string): boolean {
        return this.getVersion(version) !== undefined;
    }

    /**
     * Get version count
     */
    getVersionCount(): number {
        return this.data.versions.length;
    }

    /**
     * Get last scraped timestamp
     */
    getLastScraped(): string {
        return this.data.lastScraped;
    }
}
