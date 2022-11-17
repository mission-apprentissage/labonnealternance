import fs from "fs"
import FormData from "form-data"
import axios from "axios"
import path from "path"
import { oleoduc, readLineByLine, transformData, writeData } from "oleoduc"
import initPredictionMap from "./initPredictionMap.js"
import { GeoLocation } from "../../common/model/index.js"
import _ from "lodash-es"
import fsExtra from "fs-extra"
import { logMessage } from "../../common/utils/logMessage.js"
import __dirname from "../../common/dirname.js"
const currentDirname = __dirname(import.meta.url)

const tempDir = "./assets/geoLocations/"
const etablissementFilePath = path.join(currentDirname, "./assets/etablissements.csv")

let predictionMap = {}

const parseAdressesEtablissements = (line) => {
  const terms = line.split(";")

  if (terms[4] !== "numerorue") {
    return {
      siret: terms[0],
      numerorue: terms[4].toUpperCase(),
      libellerue: terms[5].toUpperCase(),
      citycode: terms[6],
    }
  } else {
    return null
  }
}

// traite un fichier de retour geoloc de la ban
const parseGeoLoc = (line) => {
  //rue;postcode;latitude;longitude;result_label;result_score;result_type;result_id;result_housenumber;result_name;result_street;result_postcode;result_city;result_context;result_citycode;result_oldcitycode;result_oldcity;result_district
  const terms = line.split(";")

  const result = {
    address: `${terms[0].trim()} ${terms[1]}`.toUpperCase(),
    city: terms[12],
    postcode: terms[11],
    geoLocation: `${terms[2]},${terms[3]}`,
  }

  return result
}

// enregistre un fichier d'adresses à géolocaliser
const createToGeolocateFile = (addressesToGeolocate, sourceFileCount) => {
  fs.writeFileSync(path.join(currentDirname, `${tempDir}geolocatesource-${sourceFileCount}.csv`), addressesToGeolocate)
}

const saveGeoData = async (geoData) => {
  let geoLocation = new GeoLocation(geoData)
  if ((await GeoLocation.countDocuments({ address: geoLocation.address })) === 0) {
    await geoLocation.save()
  }
}

const clearingFiles = () => {
  fsExtra.emptyDirSync(path.join(currentDirname, tempDir))
}

const geolocateCsvHeader = "rue;citycode"

export default async function () {
  let step = 0

  try {
    logMessage("info", " -- Start bulk geolocations -- ")

    predictionMap = await initPredictionMap()

    clearingFiles()

    let sourceFileCount = 0

    logMessage("info", `Construction fichiers d'adresses à géolocaliser`)

    let adressesToGeolocate = `${geolocateCsvHeader}\r\n`
    let adressesToGeolocateCount = 0

    const saveSourceGeolocateFile = () => {
      createToGeolocateFile(adressesToGeolocate, sourceFileCount)
      sourceFileCount++
      adressesToGeolocate = `${geolocateCsvHeader}\r\n`
    }

    // extraction depuis les établissements des adresses à géolocaliser
    await oleoduc(
      fs.createReadStream(etablissementFilePath),
      readLineByLine(),
      transformData((line) => parseAdressesEtablissements(line), { parallel: 10 }),
      writeData((line) => {
        if (predictionMap[line.siret]) {
          adressesToGeolocate += `${line.numerorue} ${line.libellerue};${line.citycode}\r\n`
          adressesToGeolocateCount++

          if (adressesToGeolocateCount % 1000 === 0) {
            // création de fichier d'adresses qui doivent être géolocalisées
            saveSourceGeolocateFile()
          }

          if (adressesToGeolocateCount % 50000 === 0) {
            logMessage("info", `${adressesToGeolocateCount} adresses à géolocaliser`)
          }
        }
      })
    )

    if (adressesToGeolocateCount % 1000 > 0) {
      // création de fichier avec reliquat des adresses qui doivent être géolocalisées
      saveSourceGeolocateFile()
      logMessage("info", `${adressesToGeolocateCount} adresses à géolocaliser`)
    }

    logMessage("info", `Traitement géolocalisation`)
    for (let i = 0; i < sourceFileCount; ++i) {
      logMessage("info", `Géolocalisation fichier d'adressses (${i + 1}/${sourceFileCount})`)

      const sourceFilePath = path.join(currentDirname, `${tempDir}geolocatesource-${i}.csv`)
      const form = new FormData()
      const stream = fs.createReadStream(sourceFilePath)
      form.append("data", stream, `geolocatesource-${i}.csv`)

      const res = await axios.post("https://api-adresse.data.gouv.fr/search/csv/", form, {
        headers: {
          ...form.getHeaders(),
        },
      })

      const destFilePath = path.join(currentDirname, `${tempDir}geolocated-${i}.csv`)
      fs.writeFileSync(destFilePath, res.data)

      await oleoduc(
        fs.createReadStream(destFilePath),
        readLineByLine(),
        transformData((line) => parseGeoLoc(line), { parallel: 8 }),
        writeData(
          (geoData) => {
            saveGeoData(geoData)
          },
          { parallel: 8 }
        )
      )
    }

    logMessage("info", `End bulk geolocation`)

    clearingFiles()
    predictionMap = null

    logMessage("info", `Temporary files removed`)

    return {
      result: "Table mise à jour",
    }
  } catch (err) {
    console.log("error step ", step, err)
    logMessage("error", err)
    let error_msg = _.get(err, "meta.body") ?? err.message
    return { error: error_msg }
  }
}
