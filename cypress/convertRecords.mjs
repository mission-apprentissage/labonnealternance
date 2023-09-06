import { cypressStringifyChromeRecording } from "@cypress/chrome-recorder";

import { readFileSync } from "node:fs";

import { readdir, writeFile } from "node:fs/promises";

const convertRecords = async (dir_path) => {
  try {
    const files = await readdir(`cypress/records/${dir_path}`);
    for (const filename of files) {
      if (filename.match(".json$", "i")) {
        const recordingContent = readFileSync(
          `cypress/records/${dir_path}/${filename}`
        );
        let stringifiedContent = await cypressStringifyChromeRecording(
          recordingContent
        );
        stringifiedContent = stringifiedContent.replace(
          /\.type\(">(.*)"\)/,
          '.should("contain", "$1")'
        );
        await writeFile(
          `cypress/e2e/${dir_path}/${filename.replace(/\.json$/, ".cy.js")}`,
          stringifiedContent
        );
      }
    }
  } catch (err) {
    console.error(err);
  }
};

await convertRecords("ui");