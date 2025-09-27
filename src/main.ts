#!/usr/bin/env node

/**
 * ArcGIS Experience Builder Downloader
 * Main entry point for the application
 */

import { CLI } from './cli.js';

async function main(): Promise<void> {
    try {
        const cli = new CLI();
        await cli.run();
    } catch (error) {
        console.error('❌ Application error:', error instanceof Error ? error.message : String(error));
        process.exit(1);
    }
}

// Run the application
main();
