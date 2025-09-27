/**
 * Constants and enums for the ArcGIS Experience Builder Downloader
 */

export enum AppInfo {
    NAME = 'eb-downloader',
    VERSION = '1.0.0',
    DESCRIPTION = 'Download ArcGIS Experience Builder with hash verification'
}

export enum FileNames {
    VERSIONS_LIST = 'versions-list.json',
    DEFAULT_OUTPUT_PREFIX = 'arcgis-experience-builder',
    DEFAULT_OUTPUT_EXTENSION = '.zip'
}

export enum Urls {
    DOWNLOADS_PAGE = 'https://developers.arcgis.com/experience-builder/guide/downloads/'
}

export enum Messages {
    // Version management
    VERSIONS_HEADER = '=== Available Experience Builder Versions ===',
    NO_VERSIONS_FOUND = '📋 No versions found in versions-list.json file.',
    VERSION_NOT_FOUND = '❌ Error: Version {version} not found in versions-list.json file.',
    
    // Version format validation
    INVALID_VERSION_FORMAT = '❌ Error: Version must be in format X.Y (e.g., 1.18)',
    
    // Error messages
    GET_VERSION_FAILED = '❌ Get version failed:',
    DOWNLOAD_FAILED = '❌ Download failed:',
    
    // Display values
    NO_CHECKSUM_AVAILABLE = 'No checksum available',
    UNKNOWN_RELEASE_DATE = 'Unknown release date'
}

export enum Selectors {
    // Download page selectors
    DOWNLOAD_BUTTON = 'calcite-button[data-component-link="arcgis-experience-builder-{version}.zip"]',
    CALCITE_DIALOG = 'calcite-dialog',
    COPY_BUTTON = 'calcite-button[icon-start="copy-to-clipboard"]',
    TABLE_ROWS = 'tr',
    
    // Button text patterns
    CHECKSUMS_BUTTON_TEXT = 'Checksums',
    CHECKSUM_BUTTON_TEXT = 'Checksum'
}

export enum Timeouts {
    PAGE_LOAD = 3000,
    DIALOG_WAIT = 5000,
    CLIPBOARD_WAIT = 1000,
    MODAL_CLOSE = 2000
}

export const Validation = {
    VERSION_PATTERN: /^\d+\.\d+$/,
    HASH_LENGTH: 64,
    HASH_PATTERN: /^[a-f0-9]+$/i
} as const;

export enum ExitCodes {
    SUCCESS = 0,
    ERROR = 1
}

export enum FileExtensions {
    ZIP = '.zip',
    JSON = '.json'
}

export enum UrlPatterns {
    ARCGIS_DOWNLOAD = 'arcgis-experience-builder-',
    ZIP_EXTENSION = '.zip'
}
