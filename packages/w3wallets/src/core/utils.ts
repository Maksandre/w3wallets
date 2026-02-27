import path from "path";
import fs from "fs";
import crypto from "crypto";

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Derives the Chrome extension ID from a manifest key or absolute path.
 *
 * Chrome uses different sources depending on what's available:
 * 1. If manifest.json has a `key` field → ID derived from that key
 * 2. Otherwise → ID derived from the absolute path
 *
 * The algorithm is the same in both cases:
 * 1. SHA256 hash the input (public key bytes or path string)
 * 2. Take first 16 bytes of the hash
 * 3. Encode using a custom base32 alphabet (a-p)
 */
export function getExtensionId(extensionPath: string): string {
  const absolutePath = path.resolve(extensionPath);
  const manifestPath = path.join(absolutePath, "manifest.json");
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));

  let dataToHash: Buffer;

  if (manifest.key) {
    dataToHash = Buffer.from(manifest.key, "base64");
  } else {
    dataToHash = Buffer.from(absolutePath);
  }

  const hash = crypto.createHash("sha256").update(dataToHash).digest();

  const ALPHABET = "abcdefghijklmnop";
  let extensionId = "";

  for (let i = 0; i < 16; i++) {
    const byte = hash[i]!;
    extensionId += ALPHABET[(byte >> 4) & 0xf];
    extensionId += ALPHABET[byte & 0xf];
  }

  return extensionId;
}
