import path from "path"
import { uploadFileToS3 } from "../../common/utils/awsUtils.js"
import __dirname from "../../common/dirname.js"
import { logger } from "../../common/logger.js"

const currentDirname = __dirname(import.meta.url)

export default async function ({ filename, key = "currentDomainesMetiers.xlsx" }: { filename: string; key: string }) {
  logger.info(` -- Start of DomainesMetiers file upload : ${filename} to ${key}`)

  await uploadFileToS3({ filePath: path.join(currentDirname, `../../assets/${filename}`), key })
  logger.info(`Fin traitement`)
}
