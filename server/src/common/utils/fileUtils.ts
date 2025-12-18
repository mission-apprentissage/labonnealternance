import { existsSync, mkdirSync } from "node:fs"
import path from "node:path"

import type { Options as CsvParseOptions } from "csv-parse"
import { parse } from "csv-parse"
import { isEmpty, pickBy } from "lodash-es"

import { FTPClient } from "./ftpUtils"
import { __dirname } from "./dirname"

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
      }) as any
    },
    ...options,
  })
}

export async function parseCsvContent(content: string): Promise<Record<string, string>[]> {
  return new Promise((resolve, reject) => {
    const records: Record<string, string>[] = []

    // Initialize the parser
    const parser = parse({
      trim: true,
      delimiter: ",",
      columns: true,
    })
    // Use the readable stream api to consume records
    parser.on("readable", function () {
      let record
      while ((record = parser.read()) !== null) {
        records.push(record)
      }
    })

    const errors: Error[] = []
    // Catch any error
    parser.on("error", function (err) {
      errors.push(err)
    })

    // Test that the parsed records matched the expected records
    parser.on("end", function () {
      if (errors.length) {
        reject(errors)
      } else {
        resolve(records)
      }
    })

    parser.write(content)
    parser.end()
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
