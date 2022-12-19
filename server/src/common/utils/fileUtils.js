import csvToJson from "convert-csv-to-json"
import { parse } from "csv-parse"
import { isEmpty, pickBy } from "lodash-es"
import path from "path"
import XLSX from "xlsx"
import __dirname from "../../common/dirname.js"
import config from "../../config.js"
import { FTPClient } from "./ftpUtils.js"

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

export const writeXlsxFile = async (workbook, filePath, fileName) => {
  const execWrite = () =>
    new Promise((resolve) => {
      XLSX.writeFileAsync(path.join(__dirname(import.meta.url), `${filePath}/${fileName}`), workbook, (e) => {
        if (e) {
          console.log(e)
          throw new Error("La génération du fichier excel à échoué : ", e)
        }
        resolve()
      })
    })

  await execWrite()
}

export const removeLine = (data, regex) => {
  return data
    .split("\n")
    .filter((val) => !regex.test(val))
    .join("\n")
}

export const prepareMessageForMail = (data) => {
  let result = data ? data.replace(/(<([^>]+)>)/gi, "") : data
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

export const fileDownloader = async (filePath, remoteFileName, { ftp = {} }) => {
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
