import { Options as CsvParseOptions, parse } from "csv-parse"
import { isEmpty, pickBy } from "lodash-es"
import XLSX from "xlsx"

import { FTPClient } from "./ftpUtils"

export const readXLSXFile = (localPath) => {
  const workbook = XLSX.readFile(localPath, { codepage: 65001 })
  return { sheet_name_list: workbook.SheetNames, workbook }
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
