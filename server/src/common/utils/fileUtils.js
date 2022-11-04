import XLSX from "xlsx";
import csvToJson from "convert-csv-to-json";
import path from "path";
import __dirname from "../../common/dirname.js";

const readJsonFromCsvFile = (localPath) => {
  return csvToJson.getJsonFromCsv(localPath);
};

const readXLSXFile = (localPath) => {
  const workbook = XLSX.readFile(localPath, { codepage: 65001 });
  return { sheet_name_list: workbook.SheetNames, workbook };
};

const createXlsx = async (worksheets = []) => {
  if (worksheets.length === 0) return;

  const workbook = XLSX.utils.book_new(); // Create a new blank workbook

  for (let i = 0; i < worksheets.length; i++) {
    const { name, content } = worksheets[i];
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(content), name); // Add the worksheet to the workbook
  }
  return workbook;
};

const convertIntoBuffer = (workbook) => {
  return XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
};

const writeXlsxFile = async (workbook, filePath, fileName) => {
  const execWrite = () =>
    new Promise((resolve) => {
      XLSX.writeFileAsync(path.join(__dirname(import.meta.url), `${filePath}/${fileName}`), workbook, (e) => {
        if (e) {
          console.log(e);
          throw new Error("La génération du fichier excel à échoué : ", e);
        }
        resolve();
      });
    });

  await execWrite();
};

const removeLine = (data, regex) => {
  return data
    .split("\n")
    .filter((val) => !regex.test(val))
    .join("\n");
};

const prepareMessageForMail = (data) => {
  let result = data ? data.replace(/(<([^>]+)>)/gi, "") : data;
  return result ? result.replace(/\r\n|\r|\n/gi, "<br />") : result;
};

export {
  readJsonFromCsvFile,
  readXLSXFile,
  createXlsx,
  convertIntoBuffer,
  writeXlsxFile,
  removeLine,
  prepareMessageForMail,
};
