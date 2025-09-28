# ArcGIS Experience Builder Downloader

A powerful CLI tool that downloads any version of ArcGIS Experience Builder with hash verification using headless browser automation. Features manual version management, checksum verification, and automated download handling.

## Features

- 🚀 **Download any version** - Specify any EB version (e.g., 1.18, 1.17, etc.)
- 🔒 **SHA256 hash verification** - Automatic hash verification with proper error throwing
- 📊 **Real-time progress tracking** - Live download progress with file size
- 🕷️ **Headless browser automation** - Uses Puppeteer to handle JavaScript redirects
- 📋 **Version management** - List and manage available EB versions with manual checksums
- 🔄 **Manual version list** - Pre-configured version list with checksums for verification
- 📝 **TypeScript with full type safety** - Modern, maintainable codebase
- 🔧 **ES modules support** - Latest Node.js module system
- ⚡ **Simple CLI interface** - Easy-to-use command-line tool

## Prerequisites

- Node.js >= 16.13.1
- npm >= 8.5.3

## Installation

```bash
# Clone or download the project
cd eb-scraper

# Install dependencies
npm install
```

## Usage

### Version Management Commands

```bash
# List all available versions and their checksums
npm start -- --list

# Get and verify hash for a specific version
npm start -- --get-version 1.18
```

### Download Commands

```bash
# Download a specific version using stored checksum
npm start -- --d 1.18

# Download with custom output filename
npm start -- --d 1.18 --output my-eb.zip
```

### Development Mode

```bash
# Run TypeScript directly
npm start -- --d 1.18

# Build and run
npm run build
node dist/main.js -- --d 1.18
```

## CLI Options

### Version Management
- `--list` - List available Experience Builder versions and their checksums
- `--get-version <version>` - Get and verify hash for a specific version by downloading it

### Download Options
- `-d, --d <version>` - Download a specific version using stored checksum
- `-o, --output <file>` - Output filename (default: arcgis-experience-builder-{version}.zip)

### General Options
- `--help` - Show help information
- `--version` - Show tool version

## Scripts

- `npm run start` - Run TypeScript source directly using ts-node
- `npm run build` - Compile TypeScript to JavaScript
- `npm run install-global` - Build and install globally as `eb-downloader`

## Global Installation

### Install Globally

```bash
# Build and install globally
npm run install-global
```

After installation, you can use the tool from anywhere:

```bash
# List versions
eb-downloader --list

# Download a version
eb-downloader --d 1.18
```

### Uninstall Globally

```bash
# Uninstall the global package
npm uninstall -g eb-downloader
```

## How It Works

The downloader uses **Puppeteer** (headless browser automation) to:

### Version Management
1. **Manual version list** maintained in `versions-list.json` with checksums
2. **Version lookup** supports both "1.18" and "v1.18" formats
3. **Checksum verification** using pre-configured SHA256 hashes
4. **Version database** for quick access and verification

### Download Process
1. **Launch a headless browser** and navigate to the ArcGIS downloads page
2. **Find the download button** for the specified version using CSS selectors
3. **Intercept network requests** to capture the real download URL from redirects
4. **Click the download button** and capture the redirect chain
5. **Download the actual file** using the captured URL with progress tracking
6. **Calculate SHA256 checksum** for verification
7. **Verify against provided hash** and throw proper errors if mismatched

### Example Output

#### List Versions
```bash
$ npm start -- --list

=== Available Experience Builder Versions ===
📋 Found 19 versions:

v1.18 - 23/07/2025 - bb4774c1669ae9cee019d26f446f24a600eb5b9e20ef13cad6bc295cd3de4966
v1.17 - 19/03/2025 - f3ea35b7e8f145d5b155621bf169431de96e154b672dbf483e5f86c678ad1785
v1.16 - 04/12/2024 - aa15b5115bca149b71eb13456a5b1858a572edfe53a7ce979bedb14e633bac21
...
```

#### Download with Hash Verification
```bash
$ npm start -- --d 1.18

=== ArcGIS Experience Builder v1.18 Downloader ===
🚀 Launching browser...
📄 Navigating to downloads page...
🔍 Looking for v1.18 download button...
✅ Found v1.18 download button
🖱️ Clicking download button...
🎯 Found download URL: https://downloads.esri.com/arcgis-experience-builder/arcgis-experience-builder-1.18.zip

=== Downloading from captured URL ===
📦 Starting download: arcgis-experience-builder-1.18.zip
📏 File size: 82.77 MB
⬇️  Progress: 100.0% (82.77 MB)
✅ Download completed: arcgis-experience-builder-1.18.zip

=== Verifying Download ===
✅ File: arcgis-experience-builder-1.18.zip
📊 Size: 82.77 MB
🔒 SHA256: bb4774c1669ae9cee019d26f446f24a600eb5b9e20ef13cad6bc295cd3de4966
📅 Downloaded: 2025-09-27T20:43:18.133Z

=== Hash Verification ===
Expected: bb4774c1669ae9cee019d26f446f24a600eb5b9e20ef13cad6bc295cd3de4966
Actual:   bb4774c1669ae9cee019d26f446f24a600eb5b9e20ef13cad6bc295cd3de4966
✅ Hash verification PASSED - File integrity confirmed!

🎉 Download completed successfully!
```

#### Hash Verification Error
```bash
$ npm start -- --d 1.18

=== Hash Verification ===
Expected: wronghash123456789abcdef
Actual:   bb4774c1669ae9cee019d26f446f24a600eb5b9e20ef13cad6bc295cd3de4966
❌ Hash verification FAILED - File may be corrupted!
❌ Error: Hash verification failed! Expected: wronghash123456789abcdef, Actual: bb4774c1669ae9cee019d26f446f24a600eb5b9e20ef13cad6bc295cd3de4966
```

## Project Structure

```
eb-downloader/
├── src/
│   ├── main.ts                   # Main entry point
│   ├── cli.ts                    # Command-line interface
│   ├── scraper.ts                # Web scraping functionality
│   ├── downloader.ts             # File download and hash verification
│   ├── version-manager.ts        # Version data management
│   └── types.ts                  # Type definitions
├── dist/                         # Compiled JavaScript output
├── versions-list.json            # Manual version database with checksums
├── package.json                  # Dependencies and scripts
├── tsconfig.json                 # TypeScript configuration
├── .gitignore                    # Git ignore rules
└── README.md                     # Documentation
```

## Architecture

The application is built with a modular architecture for better maintainability:

- **`main.ts`** - Application entry point and error handling
- **`cli.ts`** - Command-line interface setup and command routing
- **`scraper.ts`** - Web scraping logic using Puppeteer
- **`downloader.ts`** - File download and hash verification
- **`version-manager.ts`** - Version data persistence and management
- **`types.ts`** - TypeScript type definitions

## Technical Details

- **Language**: TypeScript with ES2017 target
- **Module System**: ES Modules
- **Browser Automation**: Puppeteer for headless Chrome
- **CLI Framework**: Commander.js for command-line interface
- **HTTP Client**: Node.js built-in https/http modules
- **Compression**: Support for gzip, deflate, and brotli
- **Checksum**: SHA256 hash verification using Node.js crypto module
- **Headers**: Browser-like User-Agent and accept headers for reliable downloads
- **Version Storage**: Manual JSON-based version database with checksums
- **Error Handling**: Proper error throwing for hash verification failures
- **Architecture**: Modular design with separation of concerns

## Version Management Workflow

### Initial Setup
1. **List available versions**: `npm start -- --list`
2. **Get hashes for specific versions**: `npm start -- --get-version 1.18`

### Regular Usage
1. **Download with stored checksum**: `npm start -- --d 1.18`
2. **Update checksums manually**: Edit `versions-list.json` file



## Test
```bash
📋 Found 19 versions to test


[1/19] Testing version v1.18...
✅ SUCCESS: v1.18 (82.77 MB, 18572ms)

[2/19] Testing version v1.17...
✅ SUCCESS: v1.17 (89.8 MB, 17512ms)

[3/19] Testing version v1.16...
✅ SUCCESS: v1.16 (86.1 MB, 15806ms)

[4/19] Testing version v1.15...
✅ SUCCESS: v1.15 (78.27 MB, 16854ms)

[5/19] Testing version v1.14...
✅ SUCCESS: v1.14 (71.91 MB, 17891ms)

[6/19] Testing version v1.13...
✅ SUCCESS: v1.13 (54.46 MB, 15898ms)

[7/19] Testing version v1.12...
✅ SUCCESS: v1.12 (32.56 MB, 18585ms)

[8/19] Testing version v1.11...
✅ SUCCESS: v1.11 (29.17 MB, 19180ms)

[9/19] Testing version v1.10...
✅ SUCCESS: v1.10 (28.38 MB, 18317ms)

[10/19] Testing version v1.9...
✅ SUCCESS: v1.9 (24.15 MB, 16489ms)

[11/19] Testing version v1.8...
✅ SUCCESS: v1.8 (22.41 MB, 18355ms)

[12/19] Testing version v1.7...
✅ SUCCESS: v1.7 (20.1 MB, 18249ms)

[13/19] Testing version v1.6...
✅ SUCCESS: v1.6 (18.26 MB, 14919ms)

[14/19] Testing version v1.5...
✅ SUCCESS: v1.5 (15.35 MB, 15378ms)

[15/19] Testing version v1.4...
✅ SUCCESS: v1.4 (15.19 MB, 15342ms)

[16/19] Testing version v1.3...
$ ✅ SUCCESS: v1.3 (13.25 MB, 15520ms)

[17/19] Testing version v1.2...
✅ SUCCESS: v1.2 (13.17 MB, 15023ms)

[18/19] Testing version v1.1...
✅ SUCCESS: v1.1 (82.77 MB, 17749ms)

[19/19] Testing version v1.00...
✅ SUCCESS: v1.00 (8.17 MB, 15961ms)

============================================================
📊 TEST SUMMARY
============================================================
Total Versions: 19
✅ Successful: 19
❌ Failed: 0
📈 Success Rate: 100.0%
⏱️  Total Time: 5m 21s

📄 Reports saved:
  - test-results-summary.json (complete results)
```
### Version Database
The tool uses `versions-list.json` with:
- Version numbers and their SHA256 checksums
- Release dates for each version
- Manual maintenance for accuracy

## Development

The project uses modern TypeScript features with ES modules. The configuration supports:

- ES module imports/exports
- Node.js >= 16.13.1 compatibility
- Type-safe HTTP requests and HTML parsing
- Comprehensive error handling
- Manual version management with JSON storage

## Contributing

Feel free to submit issues and enhancement requests!

## License

MIT
