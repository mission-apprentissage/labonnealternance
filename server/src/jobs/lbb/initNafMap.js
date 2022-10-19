const { logMessage } = require("../../common/utils/logMessage");
const miniget = require("miniget");
const { oleoduc, readLineByLine, transformData, writeData } = require("oleoduc");

let nafMap = {};
let count = 0;

const parseLine = (line) => {
  const terms = line.split(",");

  let intitule_naf = terms[3];
  if (terms.length > 5) {
    // cas où l'intitulé contient des virgules
    for (let i = 4; i < terms.length - 1; ++i) {
      intitule_naf += "," + terms[i];
    }
    intitule_naf = intitule_naf.slice(1, -1);
  }

  if (count % 1000 === 0) {
    logMessage("info", ` -- update init naf map ${count}`);
  }
  count++;

  if (count > 1) {
    return {
      //code_rome: terms[0],
      //intitule_rome: terms[1],
      code_naf: terms[2],
      intitule_naf,
      //hirings: terms[terms.length - 1],
    };
  } else {
    return null;
  }
};

const computeLine = async ({ code_naf, intitule_naf }) => {
  if (!nafMap[code_naf]) {
    nafMap[code_naf] = intitule_naf;
  }
};

module.exports = async () => {
  try {
    logMessage("info", " -- Start updating rome naf -- ");

    await oleoduc(
      miniget(
        "https://raw.githubusercontent.com/StartupsPoleEmploi/labonneboite/master/labonneboite/common/data/rome_naf_mapping.csv"
      ),
      readLineByLine(),
      transformData((line) => parseLine(line)),
      writeData(async (line) => computeLine(line))
    );

    logMessage("info", `End updating rome naf`);
  } catch (err) {
    logMessage("error", err);
  }

  count = 0;

  return nafMap;
};
