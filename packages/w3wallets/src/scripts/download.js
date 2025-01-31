#!/usr/bin/env node

/**
 *
 * Downloads and extracts Chrome extensions by alias ("backpack" and "metamask")
 *
 * Usage:
 *    npx w3wallets backpack
 *    npx w3wallets metamask
 *    npx w3wallets backpack metamask
 */

const fs = require("fs");
const https = require("https");
const path = require("path");
const url = require("url");
const zlib = require("zlib");

// ---------------------------------------------------------------------
// 1. Known aliases -> extension IDs
// ---------------------------------------------------------------------
const ALIASES = {
  backpack: "aflkmfhebedbjioipglgcbcmnbpgliof",
  metamask: "nkbihfbeogaeaoehlefnkodbefgpgknn",
  polkadotJS: "mopnmbcafieddcagagdcbnhejhlodfdd",
};

// ---------------------------------------------------------------------
// 2. Read aliases from CLI
// ---------------------------------------------------------------------
const inputAliases = process.argv.slice(2);

if (!inputAliases.length) {
  console.error("Usage: npx w3wallets <aliases...>");
  console.error("Available aliases:", Object.keys(ALIASES).join(", "));
  process.exit(1);
}

for (const alias of inputAliases) {
  if (!ALIASES[alias]) {
    console.error(
      `Unknown alias "${alias}". Must be one of: ${Object.keys(ALIASES).join(", ")}`,
    );
    process.exit(1);
  }
}

// ---------------------------------------------------------------------
// 3. Main: download and extract each requested alias
// ---------------------------------------------------------------------
(async function main() {
  for (const alias of inputAliases) {
    const extensionId = ALIASES[alias];
    console.log(`\n=== Processing alias: "${alias}" (ID: ${extensionId}) ===`);

    try {
      // 1) Download CRX
      const crxBuffer = await downloadCrx(extensionId);
      console.log(`Got CRX data for "${alias}"! ${crxBuffer.length} bytes`);

      // 2) Save raw CRX to disk
      const outDir = path.join("wallets", alias);
      fs.mkdirSync(outDir, { recursive: true });

      const debugPath = path.join(outDir, `debug-${alias}.crx`);
      fs.writeFileSync(debugPath, crxBuffer);
      console.log(`Saved ${debugPath}`);

      // 3) Extract CRX into "wallets/<alias>"
      extractCrxToFolder(crxBuffer, outDir);
      console.log(`Extraction complete! See folder: ${outDir}`);
    } catch (err) {
      console.error(`Failed to process "${alias}":`, err.message);
      process.exit(1);
    }
  }
})();

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
// fetchUrl: minimal GET + redirect handling
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

    const req = https.get(targetUrl, options, (res) => {
      const { statusCode, headers } = res;

      // Follow redirects
      if ([301, 302, 303, 307, 308].includes(statusCode) && headers.location) {
        const newUrl = url.resolve(targetUrl, headers.location);
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

      const dataChunks = [];
      res.on("data", (chunk) => dataChunks.push(chunk));
      res.on("end", () => resolve(Buffer.concat(dataChunks)));
    });

    req.on("error", (err) => reject(err));
  });
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
//   1) Finds End of Central Directory (EOCD) record (0x06054b50).
//   2) Reads central directory for file metadata
//   3) For each file, decompress into outFolder
// ---------------------------------------------------------------------
function parseZipCentralDirectory(zipBuffer, outFolder) {
  const eocdSig = 0x06054b50;
  let eocdPos = -1;
  const minPos = Math.max(0, zipBuffer.length - 65557);
  for (let i = zipBuffer.length - 4; i >= minPos; i--) {
    if (zipBuffer.readUInt32LE(i) === eocdSig) {
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

  if (cdOffset + cdSize > zipBuffer.length) {
    throw new Error("Central directory offset/size out of range.");
  }

  let ptr = cdOffset;
  const files = [];
  for (let i = 0; i < totalCD; i++) {
    const sig = zipBuffer.readUInt32LE(ptr);
    if (sig !== 0x02014b50) {
      throw new Error(`Central directory signature mismatch at ${ptr}`);
    }
    ptr += 4;

    /* const verMade   = */ zipBuffer.readUInt16LE(ptr);
    ptr += 2;
    const verNeed = zipBuffer.readUInt16LE(ptr);
    ptr += 2;
    const flags = zipBuffer.readUInt16LE(ptr);
    ptr += 2;
    const method = zipBuffer.readUInt16LE(ptr);
    ptr += 2;
    /* const modTime   = */ zipBuffer.readUInt16LE(ptr);
    ptr += 2;
    /* const modDate   = */ zipBuffer.readUInt16LE(ptr);
    ptr += 2;
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
    /* const diskNo    = */ zipBuffer.readUInt16LE(ptr);
    ptr += 2;
    /* const intAttr   = */ zipBuffer.readUInt16LE(ptr);
    ptr += 2;
    /* const extAttr   = */ zipBuffer.readUInt32LE(ptr);
    ptr += 4;
    const localHeaderOffset = zipBuffer.readUInt32LE(ptr);
    ptr += 4;

    const filename = zipBuffer.toString("utf8", ptr, ptr + fLen);
    ptr += fLen + xLen + cLen; // skip the extra + comment

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

  fs.mkdirSync(outFolder, { recursive: true });

  for (const file of files) {
    const { filename, method, compSize, localHeaderOffset } = file;

    if (filename.endsWith("/")) {
      fs.mkdirSync(path.join(outFolder, filename), { recursive: true });
      continue;
    }

    let lhPtr = localHeaderOffset;
    const localSig = zipBuffer.readUInt32LE(lhPtr);
    if (localSig !== 0x04034b50) {
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

    const outPath = path.join(outFolder, filename);
    fs.mkdirSync(path.dirname(outPath), { recursive: true });

    if (method === 0) {
      fs.writeFileSync(outPath, fileData);
    } else if (method === 8) {
      const unzipped = zlib.inflateRawSync(fileData);
      fs.writeFileSync(outPath, unzipped);
    } else {
      throw new Error(
        `Unsupported compression method (${method}) for file ${filename}`,
      );
    }
  }
}
