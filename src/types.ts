/**
 * Type definitions for the ArcGIS Experience Builder Downloader
 */

export interface FetchOptions {
    headers: Record<string, string>;
}

export interface EBVersion {
    version: string;
    hash: string;
    lastUpdated: string;
    checksum?: string;
    releaseDate?: string;
    hashType?: string;
}

export interface EBVersionsData {
    versions: EBVersion[];
    lastScraped: string;
}

export interface DownloadProgress {
    bytesDownloaded: number;
    totalBytes: number;
    percentage: number;
}

export interface DownloadResult {
    filePath: string;
    fileSize: number;
    checksum: string;
    downloadTime: string;
}

