import axios from "axios";
import fs from "fs";
import _ from "lodash-es";
import fetch from "node-fetch";
import { oleoduc, readLineByLine, transformData, writeData } from "oleoduc";
import path from "path";
import { Opco } from "../../common/model/index.js";
import { logMessage } from "../../common/utils/logMessage.js";
import config from "../../config.js";
//const opcoAktoSirenFilePath = path.join(__dirname, "./assets/20220301-Akto_SIREN.csv");
import __dirname from "../../common/dirname.js";
import { notifyToSlack } from "../../common/utils/slackUtils.js";
const currentDirname = __dirname(import.meta.url);

const opcoSirenFile = path.join(currentDirname, "./assets/opco_sirens.csv");

const aadTokenUrl = "https://login.microsoftonline.com/0285c9cb-dd17-4c1e-9621-c83e9204ad68/oauth2/v2.0/token";
const grantType = "client_credentials";
const clientId = "c6a6b396-82b9-4ab1-acc0-21b1c0ad8ae3";
const scope = "api://ef286853-e767-4dd1-8de3-67116195eaad/.default";
const clientSecret = config.secretAkto;
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

export default async function () {
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
}
