import NodeClam from "clamscan"
import { Readable } from "stream"
import tcpPortUsed from "tcp-port-used"
import config from "../../config.js"
import { logger } from "../logger.js"
import { notifyToSlack } from "../utils/slackUtils.js"

let scanner = null

const setScanner = async () => {
  scanner = await initScanner()
  logger.info("Clamav scanner initialized")
}

const initScanner = async () => {
  const port = 3310
  const host = config.env === "local" ? "localhost" : "clamav"

  return new Promise((resolve, reject) => {
    tcpPortUsed
      .waitUntilUsedOnHost(parseInt(port), host, 500, 30000)
      .then(() => {
        //console.log("le port clamav est en écoute");
        const params = {
          //debugMode: config.env === "local" ? true : false, // This will put some debug info in your js console
          clamdscan: {
            host,
            port,
            bypassTest: false,
          },
        }

        const clamscan = new NodeClam().init(params)
        resolve(clamscan)
      })
      .catch(reject)
  })
}

const scanString = async (fileContent) => {
  /*
const eicarStr = "X5O!P%@AP[4\\PZX54(P^)7CC)7}$EICAR-STANDARD-ANTIVIRUS-TEST-FILE!$H+H*";
const utf8Encode = new TextEncoder();
const eicarByteArray = utf8Encode.encode(eicarStr);
const eicarBuffer = Buffer.from(eicarByteArray);
const rs = Readable.from(eicarBuffer);
let { isInfected, viruses } = await clamscan.scanStream(rs);
console.log("scan result EICAR String : ", isInfected, viruses);
*/

  // le fichier est encodé en base 64 à la suite d'un en-tête.
  const decodedAscii = Readable.from(Buffer.from(fileContent.substring(fileContent.indexOf(";base64,") + 8), "base64").toString("ascii"))
  const rs = Readable.from(decodedAscii)
  //console.log("avant scanstream ");
  const { isInfected, viruses } = await scanner.scanStream(rs)

  if (isInfected) {
    logger.error(`Virus detected ${viruses.toString()}`)
    await notifyToSlack({ subject: "CLAMAV", message: `Virus detected ${viruses.toString()}` })
  }

  //console.log("resultat ", isInfected, viruses);

  return isInfected
}

export default function (fileContent) {
  async function scan(fileContent) {
    if (scanner) {
      //console.log("clamav est dans la place");
      return scanString(fileContent)
    } else {
      //console.log("clamav pas encore là");
      try {
        logger.info("Initalizing clamav")
        await setScanner() //await new NodeClam().init(params);
        return scanString(fileContent)
      } catch (err) {
        logger.error("Error initializing clamav " + err)
        //console.log("boom clamav tant pis");
        return false
      }
    }
  }

  return scan(fileContent)
}
