const fs = require("fs");
const fetch = require("node-fetch");
const config = require("config");
const axios = require("axios");
const path = require("path");
const { oleoduc, readLineByLine, transformData, writeData } = require("oleoduc");
const { Opco } = require("../../common/model");
const _ = require("lodash");
const { logMessage } = require("../../common/utils/logMessage");
//const opcoAktoSirenFilePath = path.join(__dirname, "./assets/20220301-Akto_SIREN.csv");
const { notifyToSlack } = require("../../common/utils/slackUtils");

const opcoSirenFile = path.join(__dirname, "./assets/opco_sirens.csv");

const aadTokenUrl = "https://login.microsoftonline.com/0285c9cb-dd17-4c1e-9621-c83e9204ad68/oauth2/v2.0/token";
const grantType = "client_credentials";
const clientId = "c6a6b396-82b9-4ab1-acc0-21b1c0ad8ae3";
const scope = "api://ef286853-e767-4dd1-8de3-67116195eaad/.default";
const clientSecret = config.private.secretAkto;
const opcoDumpUrl = "https://api.akto.fr/referentiel/api/v1/Dump/Adherents";

let i = 0;
let running = false;

const saveOpco = async (opcoData) => {
  let opco = new Opco(opcoData);

  try {
    await opco.save();
  } catch (err) {
    //do nothing
  }

  i++;
  if (i % 10000 === 0) {
    logMessage("info", `${i} sirens inserted`);
  }
};

const resetContext = () => {
  running = false;
  i = 0;
};

const parseOpco = (line) => {
  return {
    siren: line,
    opco: "akto",
  };
};

const getAADToken = async () => {
  const params = new URLSearchParams();
  params.append("grant_type", grantType);
  params.append("client_id", clientId);
  params.append("client_secret", clientSecret);
  params.append("scope", scope);

  const config = {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
  };

  let res = await axios.post(aadTokenUrl, params, config);

  return res.data.access_token;
};

const fetchOpcoFile = async () => {
  const token = await getAADToken();

  const headers = { Authorization: `Bearer ${token}` };

  await fetch(opcoDumpUrl, { headers }).then(
    (res) =>
      new Promise((resolve, reject) => {
        logMessage("info", " Receiving SIREN file ");
        const dest = fs.createWriteStream(opcoSirenFile);
        res.body.pipe(dest);
        dest.on("close", () => resolve());
        dest.on("error", reject);
      })
  );
};

const removeOpcoFile = async () => {
  logMessage("info", " Removing SIREN file ");
  try {
    await fs.unlinkSync(opcoSirenFile);
  } catch (err) {
    console.log(err);
  }
};

module.exports = async () => {
  if (!running) {
    running = true;
    try {
      logMessage("info", " -- Start inserting opco sirens -- ");

      await removeOpcoFile();

      await fetchOpcoFile();

      await Opco.deleteMany({});

      // extraction de la liste des sirens de l'opco Akto
      await oleoduc(
        fs.createReadStream(opcoSirenFile),
        readLineByLine(),
        transformData((line) => parseOpco(line)),
        writeData(async (opco) => {
          await saveOpco(opco);
        })
      );

      logMessage("info", `End inserting opco sirens (${i})`);

      notifyToSlack(`Fin d'insertion des SIRENs akto (${i})`);

      resetContext();

      return {
        result: "Table mise à jour",
      };
    } catch (err) {
      logMessage("error", err);
      let error_msg = _.get(err, "meta.body") ?? err.message;
      resetContext();
      return { error: error_msg };
    }
  } else {
    logMessage("Opco job already running");
  }
};
