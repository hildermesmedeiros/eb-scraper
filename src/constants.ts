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

export const UserAgent = {
    DEFAULT: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
} as const;

export enum Messages {
    // Version management
    VERSIONS_HEADER = '=== Available Experience Builder Versions ===',
    NO_VERSIONS_FOUND = '📋 No versions found in versions-list.json file.',
    VERSION_NOT_FOUND = '❌ Error: Version {version} not found in versions-list.json file.',
    
    // Version format validation
    INVALID_VERSION_FORMAT = '❌ Error: Version must be in format X.Y (e.g., 1.18)',
    
    // Path validation
    INVALID_PATH_FORMAT = '❌ Error: Invalid output path format',
    PATH_TOO_LONG = '❌ Error: Output path is too long (maximum 4096 characters)',
    FILENAME_TOO_LONG = '❌ Error: Filename is too long (maximum 255 characters)',
    INVALID_PATH_CHARS = '❌ Error: Output path contains invalid characters',
    RESERVED_FILENAME = '❌ Error: Filename is reserved by the operating system',
    EMPTY_PATH = '❌ Error: Output path cannot be empty',
    
    // Error messages
    GET_VERSION_FAILED = '❌ Get version failed:',
    DOWNLOAD_FAILED = '❌ Download failed:',
    
    // Display values
    NO_CHECKSUM_AVAILABLE = 'No checksum available',
    UNKNOWN_RELEASE_DATE = 'Unknown release date'
}

export enum Selectors {
    // Download page selectors
    DOWNLOAD_BUTTON = 'calcite-button[data-component-link*="arcgis-experience-builder"]',
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
    MODAL_CLOSE = 2000,
    DOWNLOAD_URL_CAPTURE = 5000,
    REQUEST_TIMEOUT = 30000
}

export const Validation = {
    VERSION_PATTERN: /^v?\d+\.\d+$/,
    HASH_LENGTH: 64,
    HASH_PATTERN: /^[a-f0-9]+$/i,
    // Path validation
    MAX_PATH_LENGTH: 4096, // Maximum path length on most systems
    MAX_FILENAME_LENGTH: 255, // Maximum filename length on most systems
    INVALID_PATH_CHARS: /[<>:"|?*\x00-\x1f]/g, // Invalid characters for file paths
    INVALID_FILENAME_CHARS: /[<>:"|?*\x00-\x1f]/g, // Invalid characters for filenames
    RESERVED_NAMES: /^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])$/i, // Reserved Windows names
    PATH_PATTERN: /^[^<>:"|?*\x00-\x1f]+$/ // Basic valid path pattern
} as const;

export const Display = {
    HASH_PREVIEW_LENGTH: 16,
    DEBUG_TEXT_LENGTH: 200
} as const;

export const HTTP = {
    SUCCESS_STATUS: 200
} as const;

export const Math = {
    BYTES_TO_MB: 1024,
    PERCENTAGE_MULTIPLIER: 100
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
