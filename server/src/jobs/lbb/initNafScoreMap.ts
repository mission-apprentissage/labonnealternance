import path from "path"
import fs from "fs"
import { oleoduc, readLineByLine, transformData, writeData } from "oleoduc"
import { logMessage } from "../../common/utils/logMessage.js"
import __dirname from "../../common/dirname.js"
const currentDirname = __dirname(import.meta.url)

let nafRomeHiringMap = {}

const filePath = path.join(currentDirname, "./assets/contrats_30j.csv")

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

export default async function () {
  try {
    try {
      await oleoduc(
        fs.createReadStream(filePath),
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
