/**
 * Scraper - Handles web scraping of ArcGIS Experience Builder versions
 */

import puppeteer from 'puppeteer';
import { VersionManager } from './version-manager.js';
import { Downloader } from './downloader.js';
import { PathValidator } from './path-validator.js';
import { Urls, Selectors, Timeouts, Validation, Messages, FileNames, UrlPatterns, Display, UserAgent } from './constants.js';

export class Scraper {
    private versionManager: VersionManager;
    private downloader: Downloader;

    constructor(versionManager: VersionManager, downloader: Downloader) {
        this.versionManager = versionManager;
        this.downloader = downloader;
    }


    /**
     * Scrape hash value for a specific version by clicking the checksums button
     */
    private async scrapeVersionHash(page: any, version: string): Promise<string | null> {
        try {
            // Find the checksums button for this specific version
            const checksumsButton = await page.evaluateHandle((version: string) => {
                // Look for all table rows
                const rows = document.querySelectorAll('tr');
                
                for (let i = 0; i < rows.length; i++) {
                    const row = rows[i];
                    const rowText = row.textContent || '';
                    
                    // Check if this row contains the version we're looking for
                    if (rowText.includes(`v${version}`)) {
                        // Look for the checksums button in this row
                        const checksumsBtn = row.querySelector('button');
                        if (checksumsBtn && checksumsBtn.textContent && 
                            (checksumsBtn.textContent.includes('Checksums') || checksumsBtn.textContent.includes('Checksum'))) {
                            return checksumsBtn;
                        }
                    }
                }
                
                return null;
            }, version);
            
            if (!checksumsButton || await checksumsButton.evaluate((el: any) => el === null)) {
                console.log(`No checksums button found for version ${version}`);
                return null;
            }
            
            console.log(`✅ Found checksums button for v${version}`);
            
            // Click the checksums button
            await checksumsButton.click();
            
            // Wait for dialog to appear (try multiple selectors)
            console.log('⏳ Waiting for dialog to appear...');
            await new Promise(resolve => setTimeout(resolve, Timeouts.PAGE_LOAD));
            
            // Try to wait for a specific dialog element
            try {
                await page.waitForSelector(Selectors.CALCITE_DIALOG, { timeout: Timeouts.DIALOG_WAIT });
                console.log('✅ Found calcite-dialog');
            } catch (e) {
                console.log('⚠️ calcite-dialog not found, trying other selectors...');
            }
            
            // Wait a bit more for content to load
            console.log('⏳ Waiting for dialog content to load...');
            await new Promise(resolve => setTimeout(resolve, Timeouts.PAGE_LOAD));
            
            // Automatically find and click the copy button
            console.log('🔍 Looking for copy button in dialog...');
            
            // Log the dialog HTML specifically
            const dialogHTML = await page.evaluate(() => {
                const dialog = document.querySelector('calcite-dialog');
                return dialog ? dialog.outerHTML : 'No dialog found';
            });
            console.log('📄 Dialog HTML:');
            console.log(dialogHTML);
            
            // Try to find and click the copy button using different approaches
            try {
                // Find calcite-button elements in the dialog
                const calciteButtons = await page.evaluate(() => {
                    const dialog = document.querySelector('calcite-dialog');
                    if (!dialog) return [];
                    
                    const buttons = dialog.querySelectorAll('calcite-button');
                    return Array.from(buttons).map((btn, index) => ({
                        index,
                        text: btn.textContent,
                        className: btn.className,
                        iconStart: btn.getAttribute('icon-start'),
                        id: btn.id
                    }));
                });
                console.log('🔍 Calcite buttons found in dialog:', calciteButtons);
                
                // Try to click the first copy button (should be for Download hash)
                if (calciteButtons.length > 0) {
                    await page.evaluate(() => {
                        const dialog = document.querySelector('calcite-dialog');
                        if (dialog) {
                            const firstCopyButton = dialog.querySelector('calcite-button[icon-start="copy-to-clipboard"]') as HTMLElement;
                            if (firstCopyButton) {
                                firstCopyButton.click();
                            }
                        }
                    });
                    console.log('✅ Clicked first copy button in dialog');
                    
                    // Clipboard permissions should be handled at browser level
                    console.log('📋 Clipboard permissions should be pre-granted');
                    
                    // Try to get hash directly from input field instead of clipboard
                    console.log('🔍 Looking for hash in input field...');
                    const hashFromInput = await page.evaluate(() => {
                        const dialog = document.querySelector('calcite-dialog');
                        if (!dialog) return null;
                        
                        // Look for the first calcite-input (should be the Download hash)
                        const firstInput = dialog.querySelector('calcite-input');
                        if (firstInput) {
                            // Try to get the value from the input
                            const inputElement = firstInput.querySelector('input');
                            if (inputElement) {
                                return inputElement.value;
                            }
                        }
                        return null;
                    });
                    
                    console.log('📋 Hash from input field:', hashFromInput);
                    
                    // Check if it's a valid hash
                    if (hashFromInput && hashFromInput.length === Validation.HASH_LENGTH && Validation.HASH_PATTERN.test(hashFromInput)) {
                        console.log(`✅ Found hash in input field: ${hashFromInput.substring(0, Display.HASH_PREVIEW_LENGTH)}...`);
                        
                        // Close the checksums modal
                        console.log('🚪 Closing checksums modal...');
                        await page.evaluate(() => {
                            const dialog = document.querySelector('calcite-dialog');
                            if (dialog) {
                                const closeButton = dialog.querySelector('calcite-button[slot="footer-end"]') as HTMLElement;
                                if (closeButton) {
                                    closeButton.click();
                                }
                            }
                        });
                        console.log('✅ Closed checksums modal');
                        
                        // Return the hash directly from this function
                        return hashFromInput;
                    } else {
                        console.log('⚠️ No valid hash found in input field');
                        
                        // Fallback: try clipboard
                        await new Promise(resolve => setTimeout(resolve, Timeouts.CLIPBOARD_WAIT));
                        const clipboardText = await page.evaluate(() => {
                            return navigator.clipboard.readText();
                        });
                        console.log('📋 Clipboard content (fallback):', clipboardText);
                        
                        if (clipboardText && clipboardText.length === Validation.HASH_LENGTH && Validation.HASH_PATTERN.test(clipboardText)) {
                            console.log(`✅ Found hash in clipboard: ${clipboardText.substring(0, Display.HASH_PREVIEW_LENGTH)}...`);
                            return clipboardText;
                        }
                    }
                } else {
                    throw new Error('No calcite buttons found in dialog');
                }
            } catch (e) {
                console.log('⚠️ Could not find or click copy button:', e);
            }
            
            // Check if there's another cookie modal and handle it (reject for speed)
            const cookieModalHandled = await page.evaluate(() => {
                const dialogSelectors = [
                    'calcite-dialog',
                    '.modal',
                    '[role="dialog"]',
                    '.dialog',
                    '[class*="modal"]',
                    '[class*="dialog"]'
                ];
                
                let dialog = null;
                for (const selector of dialogSelectors) {
                    dialog = document.querySelector(selector);
                    if (dialog) break;
                }
                
                if (dialog) {
                    const dialogText = dialog.textContent?.toLowerCase() || '';
                    if (dialogText.includes('cookie') || dialogText.includes('accept all')) {
                        // This is a cookie modal, try to reject it (faster)
                        const buttons = dialog.querySelectorAll('button');
                        for (let i = 0; i < buttons.length; i++) {
                            const button = buttons[i];
                            const text = button.textContent?.toLowerCase() || '';
                            if (text.includes('reject') || text.includes('decline') || text.includes('necessary only')) {
                                (button as HTMLButtonElement).click();
                                return true;
                            }
                        }
                        // Fallback to accept if no reject button
                        for (let i = 0; i < buttons.length; i++) {
                            const button = buttons[i];
                            const text = button.textContent?.toLowerCase() || '';
                            if (text.includes('accept') || text.includes('agree') || text.includes('ok')) {
                                (button as HTMLButtonElement).click();
                                return true;
                            }
                        }
                    }
                }
                return false;
            });
            
            if (cookieModalHandled) {
                console.log('✅ Handled additional cookie modal (rejected)');
                // Wait for the cookie modal to close and the checksums dialog to appear
                await new Promise(resolve => setTimeout(resolve, Timeouts.MODAL_CLOSE));
            }
            
            // Extract hash from the dialog
            const hash = await page.evaluate(() => {
                console.log('Starting hash extraction...');
                
                // Look for various dialog selectors
                const dialogSelectors = [
                    'calcite-dialog',
                    '.modal',
                    '[role="dialog"]',
                    '.dialog',
                    '[class*="modal"]',
                    '[class*="dialog"]'
                ];
                
                let dialog = null;
                for (const selector of dialogSelectors) {
                    dialog = document.querySelector(selector);
                    if (dialog) {
                        console.log(`Found dialog with selector: ${selector}`);
                        break;
                    }
                }
                
                if (!dialog) {
                    console.log('No dialog found with any selector');
                    return { hash: null, debug: 'No dialog found with any selector' };
                }
                
                console.log('Found dialog');
                console.log('Dialog tagName:', dialog.tagName);
                console.log('Dialog className:', dialog.className);
                
                // Check if there are any hash values in the dialog text
                const dialogText = dialog.textContent || '';
                console.log('Dialog text:', dialogText);
                
                // Look for copy buttons and click the first one to get the Download hash
                let copyButtons = Array.from(dialog.querySelectorAll('button[aria-label=""], button[class*="copy"], button[class*="clipboard"]'));
                console.log(`Found ${copyButtons.length} copy buttons with basic selectors`);
                
                // Also try to find buttons containing calcite-icon with copy-to-clipboard
                const allButtons = dialog.querySelectorAll('button');
                for (let i = 0; i < allButtons.length; i++) {
                    const button = allButtons[i];
                    const icon = button.querySelector('calcite-icon[icon="copy-to-clipboard"]');
                    if (icon && !copyButtons.includes(button)) {
                        console.log(`Found copy button with calcite-icon at index ${i}`);
                        copyButtons.push(button);
                    }
                }
                
                console.log(`Total copy buttons found: ${copyButtons.length}`);
                
                if (copyButtons.length > 0) {
                    // Click the first copy button (should be for Download hash)
                    const firstCopyButton = copyButtons[0] as HTMLButtonElement;
                    console.log('Clicking first copy button...');
                    firstCopyButton.click();
                    return { hash: 'CLICKED_COPY_BUTTON', debug: 'Clicked copy button, will read clipboard outside' };
                }
                
                // Fallback: look for input fields with hash values
                const inputs = dialog.querySelectorAll('input');
                console.log(`Found ${inputs.length} input fields in dialog`);
                
                for (let i = 0; i < inputs.length; i++) {
                    const input = inputs[i] as HTMLInputElement;
                    const value = input.value;
                    console.log(`Input ${i}: type="${input.type}", value="${value}", length=${value?.length}`);
                    
                    if (value && value.length === Validation.HASH_LENGTH && Validation.HASH_PATTERN.test(value)) {
                        console.log(`Found hash in input ${i}: ${value.substring(0, Display.HASH_PREVIEW_LENGTH)}...`);
                        return { hash: value, debug: `Found hash in input ${i}: ${value.substring(0, Display.HASH_PREVIEW_LENGTH)}...` };
                    }
                }
                
                // Fallback: look for any 64-character hex string in the dialog text
                const hashMatches = dialogText.match(new RegExp(`\\b[a-f0-9]{${Validation.HASH_LENGTH}}\\b`, 'gi'));
                if (hashMatches) {
                    console.log('Found hash matches in text:', hashMatches);
                    return { hash: hashMatches[0], debug: `Found hash in dialog text: ${hashMatches[0].substring(0, Display.HASH_PREVIEW_LENGTH)}...` };
                }
                
                console.log('No hash found in dialog');
                return { hash: null, debug: `No hash found. Dialog has ${inputs.length} inputs, text: ${dialogText.substring(0, Display.DEBUG_TEXT_LENGTH)}` };
            });
            
            console.log(`🔍 Hash extraction result:`, hash);
            
            let extractedHash = hash.hash;
            
            // If we clicked a copy button, try to read from clipboard
            if (extractedHash === 'CLICKED_COPY_BUTTON') {
                console.log('📋 Reading from clipboard...');
                await new Promise(resolve => setTimeout(resolve, Timeouts.CLIPBOARD_WAIT)); // Wait for clipboard to update
                
                try {
                    const clipboardText = await page.evaluate(() => {
                        return navigator.clipboard.readText();
                    });
                    console.log('📋 Clipboard content:', clipboardText);
                    
                    // Check if it's a valid hash
                    if (clipboardText && clipboardText.length === Validation.HASH_LENGTH && Validation.HASH_PATTERN.test(clipboardText)) {
                        console.log(`✅ Found hash in clipboard: ${clipboardText.substring(0, Display.HASH_PREVIEW_LENGTH)}...`);
                        extractedHash = clipboardText;
                    } else {
                        console.log('⚠️ Clipboard content is not a valid hash');
                        extractedHash = null;
                    }
                } catch (e) {
                    console.log('❌ Could not read clipboard:', e);
                    extractedHash = null;
                }
            }
            
            // Close the dialog
            await page.evaluate(() => {
                const dialogSelectors = [
                    'calcite-dialog',
                    '.modal',
                    '[role="dialog"]',
                    '.dialog',
                    '[class*="modal"]',
                    '[class*="dialog"]'
                ];
                
                let dialog = null;
                for (const selector of dialogSelectors) {
                    dialog = document.querySelector(selector);
                    if (dialog) break;
                }
                
                if (dialog) {
                    // Try to find and click the close button
                    const closeBtn = dialog.querySelector('button[aria-label="Close"]');
                    if (closeBtn) {
                        (closeBtn as HTMLButtonElement).click();
                    } else {
                        // Try pressing Escape
                        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
                    }
                }
            });
            
            // Wait for dialog to close
            await new Promise(resolve => setTimeout(resolve, Timeouts.CLIPBOARD_WAIT));
            
            return extractedHash;
            
        } catch (error) {
            console.error(`Error scraping hash for version ${version}:`, error);
            return null;
        }
    }


    /**
     * Get hash for a specific version by downloading it
     */
    async getVersionHash(version: string): Promise<string | null> {
        let browser;
        
        try {
            console.log(`=== Getting hash for version ${version} ===`);
            console.log('🚀 Launching browser...');
            
            browser = await puppeteer.launch({
                headless: true,
                args: ['--no-sandbox', '--disable-setuid-sandbox']
            });
            
            const page = await browser.newPage();
            await page.setExtraHTTPHeaders({
                'User-Agent': UserAgent.DEFAULT
            });
            
            console.log('📄 Navigating to downloads page...');
            await page.goto(Urls.DOWNLOADS_PAGE, { waitUntil: 'networkidle2' });
            await new Promise(resolve => setTimeout(resolve, Timeouts.PAGE_LOAD));
            
            console.log(`🔍 Looking for ${version} download button...`);
            
            const versionForSelector = version.startsWith('v') ? version.substring(1) : version;
            const downloadButton = await page.$(Selectors.DOWNLOAD_BUTTON.replace('{version}', versionForSelector));
            
            if (!downloadButton) {
                console.log(`❌ Could not find download button for version ${version}`);
                return null;
            }
            
            console.log(`✅ Found v${version} download button`);
            console.log('🖱️ Clicking download button...');
            
            // Listen for download URL
            let downloadUrl: string | null = null;
            
            page.on('response', async (response) => {
                const url = response.url();
                const contentType = response.headers()['content-type'];
                
                if (url.includes(UrlPatterns.ARCGIS_DOWNLOAD) && 
                    url.includes(UrlPatterns.ZIP_EXTENSION) && 
                    contentType && 
                    contentType.includes('application/zip')) {
                    downloadUrl = url;
                }
            });
            
            // Click the download button
            await page.evaluate((button: any) => {
                button.click();
            }, downloadButton);
            
            // Wait for download URL to be captured
            await new Promise(resolve => setTimeout(resolve, Timeouts.DOWNLOAD_URL_CAPTURE));
            
            if (downloadUrl) {
                console.log(`🎯 Found download URL: ${downloadUrl}`);
                
                const outputPath = `${FileNames.DEFAULT_OUTPUT_PREFIX}-${version}${FileNames.DEFAULT_OUTPUT_EXTENSION}`;
                
                // Download the file and calculate hash
                const result = await this.downloader.downloadAndVerify(
                    downloadUrl, 
                    outputPath,
                    undefined, // No expected hash for this operation
                    undefined, // No hash type for this operation
                    (progress) => {
                        process.stdout.write(this.downloader.formatProgress(progress));
                    }
                );
                
                // Update the version manager with the new hash
                this.versionManager.addOrUpdateVersion(version, result.checksum);
                
                console.log(`\n✅ Hash calculated and stored: ${result.checksum}`);
                
                return result.checksum;
            } else {
                console.log('❌ Could not capture download URL');
                return null;
            }
            
        } catch (error) {
            console.error('❌ Hash calculation failed:', error instanceof Error ? error.message : String(error));
            return null;
        } finally {
            if (browser) {
                await browser.close();
            }
        }
    }

    /**
     * Download a specific version using stored hash
     */
    async downloadVersion(version: string, outputPath?: string): Promise<void> {
        const versionData = this.versionManager.getVersion(version);
        
        if (!versionData) {
            throw new Error(Messages.VERSION_NOT_FOUND.replace('{version}', version));
        }

        // Validate output path if provided
        let validatedOutputPath = outputPath;
        if (outputPath) {
            const validation = PathValidator.validateOutputPath(outputPath);
            if (!validation.isValid) {
                throw new Error(validation.error);
            }
            validatedOutputPath = validation.normalizedPath;
        }
        
        let browser;
        
        try {
            console.log(`=== ArcGIS Experience Builder ${version} Downloader ===`);
            console.log('🚀 Launching browser...');
            
            browser = await puppeteer.launch({
                headless: true,
                args: ['--no-sandbox', '--disable-setuid-sandbox']
            });
            
            const page = await browser.newPage();
            await page.setExtraHTTPHeaders({
                'User-Agent': UserAgent.DEFAULT
            });
            
            console.log('📄 Navigating to downloads page...');
            await page.goto(Urls.DOWNLOADS_PAGE, { waitUntil: 'networkidle2' });
            await new Promise(resolve => setTimeout(resolve, Timeouts.PAGE_LOAD));
            
            console.log(`🔍 Looking for ${version} download button...`);
            
            // Find all download buttons and look for the one that matches our version
            const downloadButtons = await page.$$('calcite-button[data-component-link*="arcgis-experience-builder"]');
            let downloadButton = null;
            
            // Normalize version format (remove 'v' prefix and handle 1.00 -> 1.0)
            const normalizedVersion = version.replace('v', '').replace(/\.0+$/, '.0');
            
            for (const button of downloadButtons) {
                const dataComponentLink = await button.evaluate(el => el.getAttribute('data-component-link'));
                if (dataComponentLink && dataComponentLink.includes(normalizedVersion)) {
                    downloadButton = button;
                    break;
                }
            }
            
            if (!downloadButton) {
                throw new Error(`Could not find download button for version ${version}`);
            }
            
            console.log(`✅ Found v${version} download button`);
            console.log('🖱️ Clicking download button...');
            
            // Listen for download URL
            let downloadUrl: string | null = null;
            
            page.on('response', async (response) => {
                const url = response.url();
                const contentType = response.headers()['content-type'];
                
                if (url.includes(UrlPatterns.ARCGIS_DOWNLOAD) && 
                    url.includes(UrlPatterns.ZIP_EXTENSION) && 
                    contentType && 
                    contentType.includes('application/zip')) {
                    downloadUrl = url;
                }
            });
            
            // Click the download button
            await page.evaluate((button: any) => {
                button.click();
            }, downloadButton);
            
            // Wait for download URL to be captured
            await new Promise(resolve => setTimeout(resolve, Timeouts.DOWNLOAD_URL_CAPTURE));
            
            if (downloadUrl) {
                console.log(`🎯 Found download URL: ${downloadUrl}`);
                
                const finalOutputPath = validatedOutputPath || `${FileNames.DEFAULT_OUTPUT_PREFIX}-${version}${FileNames.DEFAULT_OUTPUT_EXTENSION}`;
                
                console.log('\n=== Downloading from captured URL ===');
                
                // Download and verify
                const result = await this.downloader.downloadAndVerify(
                    downloadUrl, 
                    finalOutputPath,
                    versionData.checksum || undefined,
                    versionData.hashType || undefined,
                    (progress) => {
                        process.stdout.write(this.downloader.formatProgress(progress));
                    }
                );
                
                // Update checksum if it was empty
                if (!versionData.checksum) {
                    console.log('\n🔄 Updating stored checksum with calculated value...');
                    this.versionManager.addOrUpdateVersion(version, versionData.hash, result.checksum);
                    console.log('✅ Checksum updated in version list');
                    console.log(`📝 New checksum for ${version}: ${result.checksum}`);
                }
                
                console.log(`\n🎉 Download completed successfully!`);
                
            } else {
                throw new Error('Could not capture download URL');
            }
            
        } catch (error) {
            console.error('❌ Download failed:', error instanceof Error ? error.message : String(error));
            throw error;
        } finally {
            if (browser) {
                await browser.close();
            }
        }
    }
}
