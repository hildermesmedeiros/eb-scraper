/**
 * CLI - Command-line interface setup and handlers
 */

import { Command } from 'commander';
import { VersionManager } from './version-manager.js';
import { Downloader } from './downloader.js';
import { Scraper } from './scraper.js';
import { AppInfo, Messages, Validation, ExitCodes, FileNames } from './constants.js';

export class CLI {
    private versionManager: VersionManager;
    private downloader: Downloader;
    private scraper: Scraper;
    private program: Command;

    constructor() {
        this.versionManager = new VersionManager();
        this.downloader = new Downloader();
        this.scraper = new Scraper(this.versionManager, this.downloader);
        this.program = new Command();
        this.setupCommands();
    }

    /**
     * Setup all CLI commands
     */
    private setupCommands(): void {
        this.program
            .name(AppInfo.NAME)
            .description(AppInfo.DESCRIPTION)
            .version(AppInfo.VERSION);

        // List command
        this.program
            .option('--list', 'List available Experience Builder versions and their checksums')
            .option('--get-version <version>', 'Get and verify hash for a specific version by downloading it')
            .option('-d, --d <version>', 'Download a specific version using stored checksum')
            .option('-o, --output <file>', `Output filename (default: ${FileNames.DEFAULT_OUTPUT_PREFIX}-{version}${FileNames.DEFAULT_OUTPUT_EXTENSION})`);

        this.program.parse();
    }

    /**
     * Handle list command
     */
    private async handleList(): Promise<void> {
        console.log(Messages.VERSIONS_HEADER);
        
        const versions = this.versionManager.getVersions();
        
        if (versions.length === 0) {
            console.log(Messages.NO_VERSIONS_FOUND);
            return;
        }
        
        console.log(`📋 Found ${versions.length} versions:\n`);
        
        versions.forEach(version => {
            const checksumDisplay = version.checksum || Messages.NO_CHECKSUM_AVAILABLE;
            const releaseDate = version.releaseDate || Messages.UNKNOWN_RELEASE_DATE;
            console.log(`${version.version} - ${releaseDate} - ${checksumDisplay}`);
        });
        
        const lastScraped = this.versionManager.getLastScraped();
        if (lastScraped) {
            console.log(`\n📅 Last updated: ${lastScraped}`);
        }
    }


    /**
     * Handle get version command
     */
    private async handleGetVersion(version: string): Promise<void> {
        // Validate version format
        if (!Validation.VERSION_PATTERN.test(version)) {
            console.error(Messages.INVALID_VERSION_FORMAT);
            process.exit(ExitCodes.ERROR);
        }

        // Check if version exists in the list
        if (!this.versionManager.hasVersion(version)) {
            console.error(Messages.VERSION_NOT_FOUND.replace('{version}', version));
            process.exit(ExitCodes.ERROR);
        }

        try {
            const hash = await this.scraper.getVersionHash(version);
            if (hash) {
                console.log(`\n🎉 Hash for version ${version}: ${hash}`);
            } else {
                console.error(`❌ Failed to get hash for version ${version}`);
                process.exit(ExitCodes.ERROR);
            }
        } catch (error) {
            console.error(Messages.GET_VERSION_FAILED, error instanceof Error ? error.message : String(error));
            process.exit(ExitCodes.ERROR);
        }
    }

    /**
     * Handle download command
     */
    private async handleDownload(version: string): Promise<void> {
        // Validate version format
        if (!Validation.VERSION_PATTERN.test(version)) {
            console.error(Messages.INVALID_VERSION_FORMAT);
            process.exit(ExitCodes.ERROR);
        }

        // Check if version exists in the list
        if (!this.versionManager.hasVersion(version)) {
            console.error(Messages.VERSION_NOT_FOUND.replace('{version}', version));
            process.exit(ExitCodes.ERROR);
        }

        try {
            await this.scraper.downloadVersion(version);
        } catch (error) {
            console.error(Messages.DOWNLOAD_FAILED, error instanceof Error ? error.message : String(error));
            process.exit(ExitCodes.ERROR);
        }
    }


    /**
     * Run the CLI
     */
    async run(): Promise<void> {
        const options = this.program.opts();

        // Handle --list command
        if (options.list) {
            await this.handleList();
        }
        // Handle --get-version command
        else if (options.getVersion) {
            await this.handleGetVersion(options.getVersion);
        }
        // Handle --d command
        else if (options.d) {
            await this.handleDownload(options.d);
        }
        // No command provided, show help
        else {
            this.program.help();
        }
    }
}
