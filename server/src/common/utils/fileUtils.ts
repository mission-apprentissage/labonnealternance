import path from "path"

import csvToJson from "convert-csv-to-json"
import { parse } from "csv-parse"
import { isEmpty, pickBy } from "lodash-es"
import XLSX from "xlsx"

import config from "../../config"
import __dirname from "../dirname"

import { FTPClient } from "./ftpUtils"

export const readJsonFromCsvFile = (localPath) => {
  return csvToJson.getJsonFromCsv(localPath)
}

export const readXLSXFile = (localPath) => {
  const workbook = XLSX.readFile(localPath, { codepage: 65001 })
  return { sheet_name_list: workbook.SheetNames, workbook }
}

export const createXLSXFile = (data, localPath) => {
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(data), "data")

  XLSX.writeFileAsync(path.join(localPath), workbook, (e) => {
    if (e) {
      console.log(e)
      throw new Error("La génération du fichier excel à échoué : ", e)
    }
  })
}

export const convertIntoBuffer = (workbook) => {
  return XLSX.write(workbook, { type: "buffer", bookType: "xlsx" })
}

export const removeLine = (data, regex) => {
  return data
    .split("\n")
    .filter((val) => !regex.test(val))
    .join("\n")
}

export const prepareMessageForMail = (data) => {
  const result = data ? data.replace(/(<([^>]+)>)/gi, "") : data
  return result ? result.replace(/\r\n|\r|\n/gi, "<br />") : result
}

export const parseCsv = (options = {}) => {
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
    host: config.ftp.host,
    user: ftp.user,
    password: ftp.password,
    port: 21,
  }

  const client = new FTPClient()

  await client.connect(opt)
  await client.downloadFile(remoteFileName, filePath)
  await client.disconnect()
}
