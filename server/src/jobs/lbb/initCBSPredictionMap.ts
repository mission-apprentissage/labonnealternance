import { logMessage } from "../../common/utils/logMessage.js"
import { oleoduc, readLineByLine, transformData, writeData } from "oleoduc"
import fs from "fs"
import path from "path"
import __dirname from "../../common/dirname.js"
const currentDirname = __dirname(import.meta.url)

const filePath = path.join(currentDirname, "./assets/tirage_LBA_170621.csv")

let predictionMap = {}
let count = 0

const parseLine = (line) => {
  const terms = line.split(",")

  if (count % 50000 === 0) {
    logMessage("info", ` -- update init predictions ${count}`)
  }
  count++

  if (count > 1) {
    return {
      siret: terms[1].replace(/"/g, "").padStart(14, "0"),
      score: terms[0],
    }
  } else {
    return null
  }
}

const computeLine = async ({ siret, score }) => {
  if (score === "100") {
    predictionMap[siret] = 100
  }
}

export default async function () {
  try {
    logMessage("info", " -- Start init CBS predictionMap -- ")

    await oleoduc(
      fs.createReadStream(filePath),
      readLineByLine(),
      transformData((line) => parseLine(line)),
      writeData(async (line) => computeLine(line))
    )

    logMessage("info", `End init CBS predictionMap (${Object.keys(predictionMap).length})`)
  } catch (err) {
    logMessage("error", err)
  }

  count = 0

  return predictionMap
}
