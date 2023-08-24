import path from "path"
import fs from "fs"
import { oleoduc, readLineByLine, transformData, writeData } from "oleoduc"
import { logMessage } from "../../common/utils/logMessage.js"
import __dirname from "../../common/dirname.js"
import { downloadFile } from "./lbaCompaniesUtils.js"
import { logger } from "../../common/logger.js"

const hiringFileName = "contrats_30j.csv"
const currentDirname = __dirname(import.meta.url)
const hiringFilePath = path.join(currentDirname, `../../assets/${hiringFileName}`)
const nafRomeHiringMap = {}

let count = 0

const parseLine = async (line) => {
  const terms = line.split('"')

  if (count % 15000 === 0) {
    logMessage("info", ` -- update init rome naf hirings ${count}`)
  }
  count++

  if (count > 1) {
    return {
      rome: terms[0].slice(0, -1),
      naf: terms[2].slice(1, -1),
      hirings: parseInt(terms[4].slice(1)),
    }
  } else {
    return null
  }
}

const computeLine = async ({ rome, naf, hirings }) => {
  let nafHirings = nafRomeHiringMap[naf]

  if (nafHirings) {
    nafHirings.hirings = nafHirings.hirings + hirings
    nafHirings.romes.push(rome)
  } else {
    nafHirings = { hirings, romes: [rome] }
  }
  nafHirings[rome] = hirings

  nafRomeHiringMap[naf] = nafHirings
}

const downloadNafHiringFile = async () => {
  logger.info(`Downloading Naf Hirings file from S3 Bucket...`)
  await downloadFile({ from: hiringFileName, to: hiringFilePath })
}

export default async function () {
  try {
    try {
      await downloadNafHiringFile()

      await oleoduc(
        fs.createReadStream(hiringFilePath),
        readLineByLine(),
        transformData((line) => parseLine(line)),
        writeData(async (line) => computeLine(line))
      )
    } catch (err2) {
      logMessage("error", err2)
    }
    logMessage("info", `End init rome naf hirings`)
  } catch (err) {
    logMessage("error", err)
  }

  count = 0

  return nafRomeHiringMap
}
