import { readFileSync } from "node:fs"
import { readdir, writeFile, mkdir } from "node:fs/promises"

// eslint-disable-next-line import/no-extraneous-dependencies
import { cypressStringifyChromeRecording } from "@cypress/chrome-recorder"

const convertRecords = async (dir_path) => {
  try {
    const generatedFilesDir = "cypress/e2e/generated"
    try {
      console.info("creating", generatedFilesDir)
      await mkdir(generatedFilesDir)
    } catch (_) {
      console.info(generatedFilesDir, "directory already exists")
    }
    const files = await readdir(`cypress/records/${dir_path}`)
    for (const filename of files) {
      if (filename.match(".json$", "i")) {
        const inputFilePath = `cypress/records/${dir_path}/${filename}`
        const outputFilePath = `${generatedFilesDir}/${dir_path}/${filename.replace(/\.json$/, ".cy.ts")}`
        console.info("converting", inputFilePath, "=>", outputFilePath)
        const recordingContent = readFileSync(inputFilePath)
        let stringifiedContent = await cypressStringifyChromeRecording(recordingContent)
        stringifiedContent = stringifiedContent.replace(/\.type\(">(.*)"\)/, '.should("contain", "$1")')
        await writeFile(outputFilePath, stringifiedContent)
      }
    }
  } catch (err) {
    console.error(err)
  }
}

await convertRecords(".")
