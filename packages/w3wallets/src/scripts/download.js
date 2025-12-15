#!/usr/bin/env node

/**
 * Downloads and extracts Chrome extensions from the Chrome Web Store.
 *
 * Usage:
 *    npx w3wallets metamask backpack      # Download by alias
 *    npx w3wallets mm bp pjs              # Short aliases
 *    npx w3wallets <extension-id>         # Download by extension ID
 *    npx w3wallets --help                 # Show help
 */

const fs = require("fs");
const https = require("https");
const path = require("path");
const zlib = require("zlib");

// ---------------------------------------------------------------------
// 1. Known aliases -> extension IDs (case-insensitive lookup)
// ---------------------------------------------------------------------
const EXTENSION_REGISTRY = {
  // Backpack wallet
  backpack: "aflkmfhebedbjioipglgcbcmnbpgliof",
  bp: "aflkmfhebedbjioipglgcbcmnbpgliof",

  // MetaMask wallet
  metamask: "nkbihfbeogaeaoehlefnkodbefgpgknn",
  mm: "nkbihfbeogaeaoehlefnkodbefgpgknn",

  // Polkadot.js wallet
  polkadotjs: "mopnmbcafieddcagagdcbnhejhlodfdd",
  pjs: "mopnmbcafieddcagagdcbnhejhlodfdd",
};

// Human-readable names for display
const EXTENSION_NAMES = {
  aflkmfhebedbjioipglgcbcmnbpgliof: "Backpack",
  nkbihfbeogaeaoehlefnkodbefgpgknn: "MetaMask",
  mopnmbcafieddcagagdcbnhejhlodfdd: "Polkadot.js",
};

// Canonical aliases for listing
const CANONICAL_ALIASES = [
  { name: "backpack", short: "bp", id: "aflkmfhebedbjioipglgcbcmnbpgliof" },
  { name: "metamask", short: "mm", id: "nkbihfbeogaeaoehlefnkodbefgpgknn" },
  { name: "polkadotjs", short: "pjs", id: "mopnmbcafieddcagagdcbnhejhlodfdd" },
];

// ---------------------------------------------------------------------
// ZIP format constants (per PKWARE APPNOTE.TXT specification)
// ---------------------------------------------------------------------
const ZIP_SIGNATURES = {
  EOCD: 0x06054b50, // End of Central Directory
  CENTRAL_DIR: 0x02014b50, // Central Directory file header
  LOCAL_FILE: 0x04034b50, // Local file header
};

const ZIP_FLAGS = {
  ENCRYPTED: 0x0001, // File is encrypted
  DATA_DESCRIPTOR: 0x0008, // Sizes in data descriptor after file data
  UTF8_FILENAME: 0x0800, // Filename is UTF-8 encoded
};

const ZIP_METHODS = {
  STORE: 0, // No compression
  DEFLATE: 8, // Deflate compression
};

// Marker value indicating ZIP64 format is required
const ZIP64_MARKER = 0xffffffff;

// Maximum size of EOCD record (22 bytes + max 65535 comment)
const MAX_EOCD_SEARCH = 65557;

// HTTP request timeout in milliseconds
const REQUEST_TIMEOUT_MS = 30000;

// ---------------------------------------------------------------------
// 2. CLI Argument Parser
// ---------------------------------------------------------------------
const CLI_OPTIONS = {
  help: false,
  list: false,
  output: ".w3wallets",
  force: false,
  debug: false,
  targets: [], // aliases or extension IDs
};

function printHelp() {
  console.log(`
w3wallets - Download Chrome extensions from the Chrome Web Store

USAGE:
  npx w3wallets [OPTIONS] <targets...>

TARGETS:
  Alias name      Known wallet alias (e.g., metamask, backpack)
  Short alias     Short form (e.g., mm, bp, pjs)
  Extension ID    32-character Chrome extension ID
  URL             Chrome Web Store URL

OPTIONS:
  -h, --help      Show this help message
  -l, --list      List available wallet aliases
  -o, --output    Output directory (default: .w3wallets)
  -f, --force     Force re-download even if already exists
  --debug         Save raw .crx file for debugging

EXAMPLES:
  npx w3wallets metamask                    # Download MetaMask
  npx w3wallets mm bp                       # Download using short aliases
  npx w3wallets --list                      # List available aliases
  npx w3wallets -o ./extensions metamask    # Custom output directory
  npx w3wallets --force mm                  # Force re-download
  npx w3wallets nkbihfbeogaeaoehlefnkodbefgpgknn  # Download by extension ID
  npx w3wallets "https://chromewebstore.google.com/detail/metamask/nkbihfbeogaeaoehlefnkodbefgpgknn"
`);
}

function printList() {
  console.log("\nAvailable wallet aliases:\n");
  console.log("  ALIAS        SHORT   EXTENSION ID");
  console.log("  " + "-".repeat(50));
  for (const { name, short, id } of CANONICAL_ALIASES) {
    console.log(`  ${name.padEnd(12)} ${short.padEnd(7)} ${id}`);
  }
  console.log("\nYou can also download any extension by ID or Chrome Web Store URL.\n");
}

/**
 * Parse extension ID from various input formats:
 * - Known alias (case-insensitive): "metamask", "MetaMask", "MM"
 * - Direct extension ID: "nkbihfbeogaeaoehlefnkodbefgpgknn"
 * - Chrome Web Store URL: "https://chromewebstore.google.com/detail/metamask/nkbihfbeogaeaoehlefnkodbefgpgknn"
 */
function parseExtensionTarget(input) {
  // Check for known alias (case-insensitive)
  const normalizedInput = input.toLowerCase();
  if (EXTENSION_REGISTRY[normalizedInput]) {
    const id = EXTENSION_REGISTRY[normalizedInput];
    // Find canonical alias name for directory
    const alias = CANONICAL_ALIASES.find((a) => a.id === id);
    return {
      id,
      name: EXTENSION_NAMES[id] || normalizedInput,
      dirName: alias ? alias.name : id,
    };
  }

  // Check if it's a Chrome Web Store URL
  const urlPatterns = [
    /chromewebstore\.google\.com\/detail\/[^/]+\/([a-z]{32})/i,
    /chrome\.google\.com\/webstore\/detail\/[^/]+\/([a-z]{32})/i,
  ];
  for (const pattern of urlPatterns) {
    const match = input.match(pattern);
    if (match) {
      const id = match[1].toLowerCase();
      const alias = CANONICAL_ALIASES.find((a) => a.id === id);
      return {
        id,
        name: EXTENSION_NAMES[id] || id,
        dirName: alias ? alias.name : id,
      };
    }
  }

  // Check if it's a direct extension ID (32 lowercase letters)
  if (/^[a-z]{32}$/i.test(input)) {
    const id = input.toLowerCase();
    const alias = CANONICAL_ALIASES.find((a) => a.id === id);
    return {
      id,
      name: EXTENSION_NAMES[id] || id,
      dirName: alias ? alias.name : id,
    };
  }

  return null;
}

function parseArgs(args) {
  let i = 0;
  while (i < args.length) {
    const arg = args[i];

    if (arg === "-h" || arg === "--help") {
      CLI_OPTIONS.help = true;
    } else if (arg === "-l" || arg === "--list") {
      CLI_OPTIONS.list = true;
    } else if (arg === "-o" || arg === "--output") {
      i++;
      if (i >= args.length) {
        console.error("Error: --output requires a directory path");
        process.exit(1);
      }
      CLI_OPTIONS.output = args[i];
    } else if (arg === "-f" || arg === "--force") {
      CLI_OPTIONS.force = true;
    } else if (arg === "--debug") {
      CLI_OPTIONS.debug = true;
    } else if (arg.startsWith("-")) {
      console.error(`Error: Unknown option "${arg}"`);
      console.error('Use --help for usage information');
      process.exit(1);
    } else {
      // It's a target (alias, ID, or URL)
      const parsed = parseExtensionTarget(arg);
      if (!parsed) {
        console.error(`Error: "${arg}" is not a valid alias, extension ID, or URL`);
        console.error("Use --list to see available aliases, or provide a 32-character extension ID");
        process.exit(1);
      }
      CLI_OPTIONS.targets.push(parsed);
    }
    i++;
  }
}

// Parse command line arguments
parseArgs(process.argv.slice(2));

// Handle --help
if (CLI_OPTIONS.help) {
  printHelp();
  process.exit(0);
}

// Handle --list
if (CLI_OPTIONS.list) {
  printList();
  process.exit(0);
}

// Validate we have targets
if (CLI_OPTIONS.targets.length === 0) {
  console.error("Error: No extension targets specified");
  console.error('Use --help for usage information or --list to see available aliases');
  process.exit(1);
}

// ---------------------------------------------------------------------
// 3. Main: download and extract each requested extension
// ---------------------------------------------------------------------
(async function main() {
  for (const target of CLI_OPTIONS.targets) {
    const { id, name, dirName } = target;
    const outDir = path.join(CLI_OPTIONS.output, dirName);

    console.log(`\n=== ${name} (${id}) ===`);

    // Check if already exists (skip unless --force)
    const manifestPath = path.join(outDir, "manifest.json");
    if (!CLI_OPTIONS.force && fs.existsSync(manifestPath)) {
      console.log(`Already exists: ${outDir}`);
      console.log("Use --force to re-download");
      continue;
    }

    try {
      // 1) Download CRX with progress
      console.log("Downloading...");
      const crxBuffer = await downloadCrx(id);
      console.log(`Downloaded ${formatBytes(crxBuffer.length)}`);

      // 2) Optionally save raw CRX for debugging
      if (CLI_OPTIONS.debug) {
        fs.mkdirSync(outDir, { recursive: true });
        const debugPath = path.join(outDir, `debug-${dirName}.crx`);
        fs.writeFileSync(debugPath, crxBuffer);
        console.log(`Debug CRX saved: ${debugPath}`);
      }

      // 3) Extract CRX
      console.log("Extracting...");
      extractCrxToFolder(crxBuffer, outDir);
      console.log(`Done: ${outDir}`);
    } catch (err) {
      console.error(`Failed: ${err.message}`);
      process.exit(1);
    }
  }

  console.log("\nAll extensions downloaded successfully!");
})();

// ---------------------------------------------------------------------
// Utility: format bytes for human display
// ---------------------------------------------------------------------
function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ---------------------------------------------------------------------
// downloadCrx: Build CRX URL and fetch it
// ---------------------------------------------------------------------
async function downloadCrx(extensionId) {
  const downloadUrl =
    "https://clients2.google.com/service/update2/crx" +
    "?response=redirect" +
    "&prod=chrome" +
    "&prodversion=9999" +
    "&acceptformat=crx2,crx3" +
    `&x=id%3D${extensionId}%26uc`;

  console.log("Requesting:", downloadUrl);

  const crxBuffer = await fetchUrl(downloadUrl);
  return crxBuffer;
}

// ---------------------------------------------------------------------
// fetchUrl: minimal GET + redirect handling with timeout and progress
// ---------------------------------------------------------------------
function fetchUrl(
  targetUrl,
  options = {},
  redirectCount = 0,
  maxRedirects = 10,
) {
  return new Promise((resolve, reject) => {
    if (redirectCount > maxRedirects) {
      return reject(new Error("Too many redirects"));
    }

    const reqOptions = { ...options, timeout: REQUEST_TIMEOUT_MS };
    const req = https.get(targetUrl, reqOptions, (res) => {
      const { statusCode, headers } = res;

      // Follow redirects
      if ([301, 302, 303, 307, 308].includes(statusCode) && headers.location) {
        const newUrl = new URL(headers.location, targetUrl).href;
        res.resume(); // discard body
        return resolve(
          fetchUrl(newUrl, options, redirectCount + 1, maxRedirects),
        );
      }

      if (statusCode !== 200) {
        res.resume();
        return reject(
          new Error(`Request failed with status code ${statusCode}`),
        );
      }

      const contentLength = parseInt(headers["content-length"], 10) || 0;
      const dataChunks = [];
      let downloadedBytes = 0;
      let lastProgressUpdate = 0;

      res.on("data", (chunk) => {
        dataChunks.push(chunk);
        downloadedBytes += chunk.length;

        // Update progress at most every 100ms to avoid flickering
        const now = Date.now();
        if (contentLength > 0 && now - lastProgressUpdate > 100) {
          lastProgressUpdate = now;
          const percent = Math.round((downloadedBytes / contentLength) * 100);
          const progressBar = createProgressBar(percent);
          process.stdout.write(`\r  ${progressBar} ${percent}% (${formatBytes(downloadedBytes)})`);
        }
      });

      res.on("end", () => {
        // Clear the progress line
        if (contentLength > 0) {
          process.stdout.write("\r" + " ".repeat(60) + "\r");
        }
        resolve(Buffer.concat(dataChunks));
      });
    });

    req.on("timeout", () => {
      req.destroy();
      reject(new Error(`Request timed out after ${REQUEST_TIMEOUT_MS}ms: ${targetUrl}`));
    });

    req.on("error", (err) => {
      reject(new Error(`Failed to fetch ${targetUrl}: ${err.message}`));
    });
  });
}

// ---------------------------------------------------------------------
// createProgressBar: Generate ASCII progress bar
// ---------------------------------------------------------------------
function createProgressBar(percent, width = 20) {
  const filled = Math.round((percent / 100) * width);
  const empty = width - filled;
  return "[" + "=".repeat(filled) + " ".repeat(empty) + "]";
}

// ---------------------------------------------------------------------
// extractCrxToFolder
//   1) Checks "Cr24" magic
//   2) Reads version (2 or 3/4) to find the ZIP start
//   3) Uses parseZipCentralDirectory() to extract files properly
// ---------------------------------------------------------------------
function extractCrxToFolder(crxBuffer, outFolder) {
  if (crxBuffer.toString("utf8", 0, 4) !== "Cr24") {
    throw new Error("Not a valid CRX file (missing Cr24 magic).");
  }

  const version = crxBuffer.readUInt32LE(4);
  let zipStartOffset = 0;
  if (version === 2) {
    const pkLen = crxBuffer.readUInt32LE(8);
    const sigLen = crxBuffer.readUInt32LE(12);
    zipStartOffset = 16 + pkLen + sigLen;
  } else if (version === 3 || version === 4) {
    const headerSize = crxBuffer.readUInt32LE(8);
    zipStartOffset = 12 + headerSize;
  } else {
    throw new Error(
      `Unsupported CRX version (${version}). Only v2, v3, or v4 are supported.`,
    );
  }

  if (zipStartOffset >= crxBuffer.length) {
    throw new Error("Malformed CRX: header size exceeds file length.");
  }

  const zipBuffer = crxBuffer.slice(zipStartOffset);

  // Parse that ZIP via the central directory approach
  parseZipCentralDirectory(zipBuffer, outFolder);
}

// ---------------------------------------------------------------------
// parseZipCentralDirectory(buffer, outFolder)
//   1) Finds End of Central Directory (EOCD) record
//   2) Reads central directory for file metadata
//   3) For each file, decompress into outFolder
// ---------------------------------------------------------------------
function parseZipCentralDirectory(zipBuffer, outFolder) {
  // Find EOCD by scanning backwards from end of file
  let eocdPos = -1;
  const minPos = Math.max(0, zipBuffer.length - MAX_EOCD_SEARCH);
  for (let i = zipBuffer.length - 4; i >= minPos; i--) {
    if (zipBuffer.readUInt32LE(i) === ZIP_SIGNATURES.EOCD) {
      eocdPos = i;
      break;
    }
  }
  if (eocdPos < 0) {
    throw new Error("Could not find End of Central Directory (EOCD) in ZIP.");
  }

  const totalCD = zipBuffer.readUInt16LE(eocdPos + 10);
  const cdSize = zipBuffer.readUInt32LE(eocdPos + 12);
  const cdOffset = zipBuffer.readUInt32LE(eocdPos + 16);

  // ZIP64 check: marker values indicate ZIP64 format is required
  if (cdOffset === ZIP64_MARKER || cdSize === ZIP64_MARKER) {
    throw new Error("ZIP64 format is not supported.");
  }

  if (cdOffset + cdSize > zipBuffer.length) {
    throw new Error("Central directory offset/size out of range.");
  }

  let ptr = cdOffset;
  const files = [];
  for (let i = 0; i < totalCD; i++) {
    const sig = zipBuffer.readUInt32LE(ptr);
    if (sig !== ZIP_SIGNATURES.CENTRAL_DIR) {
      throw new Error(`Central directory signature mismatch at ${ptr}`);
    }
    ptr += 4;

    ptr += 2; // version made by (unused)
    const verNeed = zipBuffer.readUInt16LE(ptr);
    ptr += 2;
    const flags = zipBuffer.readUInt16LE(ptr);
    ptr += 2;
    const method = zipBuffer.readUInt16LE(ptr);
    ptr += 2;
    ptr += 2; // mod time (unused)
    ptr += 2; // mod date (unused)
    const crc32 = zipBuffer.readUInt32LE(ptr);
    ptr += 4;
    const compSize = zipBuffer.readUInt32LE(ptr);
    ptr += 4;
    const unCompSize = zipBuffer.readUInt32LE(ptr);
    ptr += 4;
    const fLen = zipBuffer.readUInt16LE(ptr);
    ptr += 2;
    const xLen = zipBuffer.readUInt16LE(ptr);
    ptr += 2;
    const cLen = zipBuffer.readUInt16LE(ptr);
    ptr += 2;
    ptr += 2; // disk number (unused)
    ptr += 2; // internal attributes (unused)
    ptr += 4; // external attributes (unused)
    const localHeaderOffset = zipBuffer.readUInt32LE(ptr);
    ptr += 4;

    const filename = zipBuffer.toString("utf8", ptr, ptr + fLen);
    ptr += fLen + xLen + cLen; // skip the extra + comment

    // Validate: encrypted files not supported
    if (flags & ZIP_FLAGS.ENCRYPTED) {
      throw new Error(`Encrypted files are not supported: ${filename}`);
    }

    // Validate: ZIP64 extended sizes not supported
    if (compSize === ZIP64_MARKER || unCompSize === ZIP64_MARKER || localHeaderOffset === ZIP64_MARKER) {
      throw new Error(`ZIP64 extended information not supported for file: ${filename}`);
    }

    files.push({
      filename,
      method,
      compSize,
      unCompSize,
      flags,
      localHeaderOffset,
      crc32,
      verNeed,
    });
  }

  const resolvedOutFolder = path.resolve(outFolder);
  fs.mkdirSync(resolvedOutFolder, { recursive: true });

  for (const file of files) {
    const { filename, method, compSize, localHeaderOffset } = file;

    // Security: validate path to prevent directory traversal attacks
    const outPath = path.join(resolvedOutFolder, filename);
    if (!outPath.startsWith(resolvedOutFolder + path.sep) && outPath !== resolvedOutFolder) {
      throw new Error(`Path traversal detected, refusing to extract: ${filename}`);
    }

    if (filename.endsWith("/")) {
      fs.mkdirSync(outPath, { recursive: true });
      continue;
    }

    let lhPtr = localHeaderOffset;
    const localSig = zipBuffer.readUInt32LE(lhPtr);
    if (localSig !== ZIP_SIGNATURES.LOCAL_FILE) {
      throw new Error(`Local file header mismatch at ${lhPtr} for ${filename}`);
    }
    lhPtr += 4;

    lhPtr += 2; // version needed
    lhPtr += 2; // flags
    lhPtr += 2; // method
    lhPtr += 2; // mod time
    lhPtr += 2; // mod date
    lhPtr += 4; // crc32
    lhPtr += 4; // comp size
    lhPtr += 4; // uncomp size
    const lhFNameLen = zipBuffer.readUInt16LE(lhPtr);
    lhPtr += 2;
    const lhXLen = zipBuffer.readUInt16LE(lhPtr);
    lhPtr += 2;

    lhPtr += lhFNameLen + lhXLen;
    const fileData = zipBuffer.slice(lhPtr, lhPtr + compSize);

    fs.mkdirSync(path.dirname(outPath), { recursive: true });

    if (method === ZIP_METHODS.STORE) {
      fs.writeFileSync(outPath, fileData);
    } else if (method === ZIP_METHODS.DEFLATE) {
      const unzipped = zlib.inflateRawSync(fileData);
      fs.writeFileSync(outPath, unzipped);
    } else {
      throw new Error(
        `Unsupported compression method (${method}) for file ${filename}`,
      );
    }
  }
}
