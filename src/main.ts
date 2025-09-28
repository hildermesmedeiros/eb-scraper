#!/usr/bin/env node

/**
 * ArcGIS Experience Builder Downloader
 * Main entry point for the application
 */
import { ExitCodes } from './constants.js';

import { CLI } from './cli.js';

async function main(): Promise<void> {
    try {
        const cli = new CLI();
        await cli.run();
    } catch (error) {
        console.error('❌ Application error:', error instanceof Error ? error.message : String(error));
        process.exit(ExitCodes.ERROR);
    }
}

// Run the application
main();
