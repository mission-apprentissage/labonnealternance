import { existsSync, mkdirSync } from "node:fs"
import path from "node:path"

import { Options as CsvParseOptions, parse } from "csv-parse"
import { isEmpty, pickBy } from "lodash-es"

import __dirname from "@/common/dirname"

import { FTPClient } from "./ftpUtils"

export const CURRENT_DIR_PATH = __dirname(import.meta.url)

export const createAssetsFolder = async () => {
  const assetsPath = path.join(CURRENT_DIR_PATH, "./assets")
  if (!(await existsSync(assetsPath))) {
    await mkdirSync(assetsPath)
  }
}

export const parseCsv = (options: CsvParseOptions = {}) => {
  return parse({
    trim: true,
    delimiter: ";",
    columns: true,
    on_record: (record) => {
      return pickBy(record, (v) => {
        return !isEmpty(v) && v !== "NULL" && v.trim().length
      })
    },
    ...options,
  })
}

export const fileDownloader = async (filePath: string, remoteFileName: string, ftp: { user: string; password: string }) => {
  const opt = {
    host: "",
    user: ftp.user,
    password: ftp.password,
    port: 21,
  }

  const client = new FTPClient()

  await client.connect(opt)
  await client.downloadFile(remoteFileName, filePath)
  await client.disconnect()
}
