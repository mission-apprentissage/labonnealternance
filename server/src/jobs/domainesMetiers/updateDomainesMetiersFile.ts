import path from "path"

import __dirname from "../../common/dirname"
import { logger } from "../../common/logger"
import { uploadFileToS3 } from "../../common/utils/awsUtils"

const currentDirname = __dirname(import.meta.url)

export default async function ({ filename, key = "currentDomainesMetiers.xlsx" }: { filename: string; key: string }) {
  logger.info(` -- Start of DomainesMetiers file upload : ${filename} to ${key}`)

  await uploadFileToS3({ filePath: path.join(currentDirname, `../../assets/${filename}`), key })
  logger.info(`Fin traitement`)
}
