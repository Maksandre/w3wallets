#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { https } = require("follow-redirects");
const AdmZip = require("adm-zip");

const args = process.argv.slice(2);

// Default configurations
const DEFAULT_WALLET = "backpack";
const DEFAULT_DOWNLOAD_LINK =
  "https://github.com/coral-xyz/backpack/releases/download/0.10.1-latest-4/build-beta-4.zip";

// Parse arguments
const walletArg = args.find((arg) => arg.startsWith("--wallet="));
const downloadArg = args.find((arg) => arg.startsWith("--version="));

const wallet = walletArg ? walletArg.split("=")[1] : DEFAULT_WALLET;
const downloadLink = downloadArg
  ? downloadArg.split("=")[1]
  : DEFAULT_DOWNLOAD_LINK;
const outputDir = path.resolve(`extensions/${wallet}`);
const zipPath = path.resolve(outputDir, `${wallet}.zip`);

console.log(`Fetching ${wallet}...`);

// Ensure the output directory exists
fs.mkdirSync(outputDir, { recursive: true });

// Download the zip file
https
  .get(downloadLink, (response) => {
    if (response.statusCode !== 200) {
      console.error(
        `Failed to download file. Status Code: ${response.statusCode}`,
      );
      return;
    }

    const fileStream = fs.createWriteStream(zipPath);
    response.pipe(fileStream);

    fileStream.on("finish", () => {
      fileStream.close();
      console.log(`Downloaded to ${zipPath}`);

      // Unzip the file
      console.log("Unzipping...");
      const zip = new AdmZip(zipPath);
      zip.extractAllTo(outputDir, true);
      console.log(`Extracted to ${outputDir}`);

      fs.unlinkSync(zipPath);

      // Check if the result is a single directory with manifest.json inside
      const files = fs.readdirSync(outputDir);
      if (files.length === 1) {
        const singleDirPath = path.join(outputDir, files[0]);
        if (
          fs.lstatSync(singleDirPath).isDirectory() &&
          fs.existsSync(path.join(singleDirPath, "manifest.json"))
        ) {
          // Move all files from the directory to the outputDir
          const nestedFiles = fs.readdirSync(singleDirPath);
          nestedFiles.forEach((file) => {
            const srcPath = path.join(singleDirPath, file);
            const destPath = path.join(outputDir, file);
            fs.renameSync(srcPath, destPath);
          });
        } else {
          throw Error("Cannot find the manifest.json file");
        }
      }
    });
  })
  .on("error", (err) => {
    console.error(`Error downloading the file: ${err.message}`);
  });
