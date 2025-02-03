import fs from "fs"
import path from "path"

import __dirname from "../../common/dirname"
import { logger } from "../../common/logger"
import { s3WriteStream } from "../../common/utils/awsUtils"

const currentDirname = __dirname(import.meta.url)

export async function updateDomainesMetiersFile({ filename, key = "currentDomainesMetiers.xlsx" }: { filename: string; key: string }) {
  logger.info(` -- Start of DomainesMetiers file upload : ${filename} to ${key}`)
  const filePath = path.join(currentDirname, `./assets/${filename}`)
  const blob = fs.createReadStream(filePath)
  await s3WriteStream("storage", key, { Body: blob })
  logger.info(` -- End of DomainesMetiers file upload : ${filename} to ${key}`)
}
