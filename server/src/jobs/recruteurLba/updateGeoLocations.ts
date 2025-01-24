import fs from "fs"
import path from "path"

import FormData from "form-data"
import fsExtra from "fs-extra"
import { ObjectId } from "mongodb"
import { oleoduc, readLineByLine, transformData, writeData } from "oleoduc"
import { ZGeoLocation } from "shared/models"

import { getDbCollection } from "@/common/utils/mongodbUtils"
import { getBulkGeoLocation } from "@/services/geolocation.service"

import __dirname from "../../common/dirname"
import { logMessage } from "../../common/utils/logMessage"
import { notifyToSlack } from "../../common/utils/slackUtils"

import { checkIfAlgoFileIsNew, getRecruteursLbaFileFromS3, readCompaniesFromJson, removePredictionFile } from "./recruteurLbaUtil"

const currentDirname = __dirname(import.meta.url)

const tempDir = "./assets/geoLocations/"

let errorCount = 0

// traite un fichier de retour geoloc de la ban
const parseGeoLoc = (line) => {
  //rue;citycode;latitude;longitude;result_label;result_score;result_score_next;result_type;result_id;result_housenumber;result_name;result_street;result_postcode;result_city;result_context;result_citycode;result_oldcitycode;result_oldcity;result_district;result_status
  //140 RUE EXEMPLE;00100;51.110199;1.960737;140 Rue Exemple 00100 Uneville;0.9706772727272726;;housenumber;80001_0430_00140;140;140 Rue du Exemple;Rue Exemple;00100;Uneville;00, Dept, Region;00001;;;;ok

  const terms = line.split(";")

  if (terms[19] === "result_status") {
    // ligne en-tête
    return null
  }

  const result =
    terms[19] === "ok"
      ? {
          address: `${terms[0].trim()} ${terms[1]}`.toUpperCase(),
          city: terms[13],
          zip_code: terms[12],
          geo_coordinates: `${terms[2]},${terms[3]}`,
        }
      : null

  if (result === null) {
    errorCount++
  }

  return result
}

// enregistre un fichier d'adresses à géolocaliser
const createToGeolocateFile = (addressesToGeolocate, sourceFileCount) => {
  fs.writeFileSync(path.join(currentDirname, `${tempDir}geolocatesource-${sourceFileCount}.csv`), addressesToGeolocate)
}

const saveGeoData = async (geoData) => {
  if (ZGeoLocation.safeParse(geoData).success) {
    await getDbCollection("geolocations").findOneAndUpdate({ address: geoData.address }, { $set: geoData, $setOnInsert: { _id: new ObjectId() } }, { upsert: true })
  }
}

const clearingFiles = async () => {
  fsExtra.emptyDirSync(path.join(currentDirname, tempDir))
  await removePredictionFile()
}

const geolocateCsvHeader = "rue;citycode"

export default async function updateGeoLocations({ ForceRecreate = false, SourceFile = null }: { ForceRecreate?: boolean; SourceFile?: string | null }) {
  try {
    logMessage("info", " -- Start bulk geolocations -- ")

    if (!ForceRecreate) {
      await checkIfAlgoFileIsNew("geo locations")
    }

    await clearingFiles()

    let sourceFileCount = 0

    logMessage("info", `Construction fichiers d'adresses à géolocaliser`)

    let adressesToGeolocate = `${geolocateCsvHeader}\r\n`
    let adressesToGeolocateCount = 0

    const saveSourceGeolocateFile = () => {
      createToGeolocateFile(adressesToGeolocate, sourceFileCount)
      sourceFileCount++
      adressesToGeolocate = `${geolocateCsvHeader}\r\n`
    }

    await getRecruteursLbaFileFromS3(SourceFile)

    // extraction depuis les établissements des adresses à géolocaliser
    await oleoduc(
      await readCompaniesFromJson(),
      writeData((company) => {
        if (company.zip_code) {
          adressesToGeolocate += `${company.street_number ? company.street_number.toUpperCase() : ""} ${company.street_name ? company.street_name.toUpperCase() : ""};${
            company.zip_code
          }\r\n`
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

      try {
        const sourceFilePath = path.join(currentDirname, `${tempDir}geolocatesource-${i}.csv`)
        const form = new FormData()
        const stream = fs.createReadStream(sourceFilePath)
        form.append("data", stream, `geolocatesource-${i}.csv`)

        const res = await getBulkGeoLocation(form)

        const destFilePath = path.join(currentDirname, `${tempDir}geolocated-${i}.csv`)
        fs.writeFileSync(destFilePath, res.data)

        await oleoduc(
          fs.createReadStream(destFilePath),
          readLineByLine(),
          transformData((line) => parseGeoLoc(line), { parallel: 8 }),
          writeData(
            async (geoData) => {
              await saveGeoData(geoData)
            },
            { parallel: 8 }
          )
        )
      } catch (err) {
        logMessage("error", `Error processing file ${i}. error=${err}`)
      }
    }

    logMessage("info", `Erreurs de geolocalisatio ${errorCount}`)

    logMessage("info", `End bulk geolocation`)

    await notifyToSlack({
      subject: "GEOLOCALISATION DE MASSE",
      message: `Géolocalisation de masse terminée. ${adressesToGeolocateCount} adresses à géolocaliser. ${errorCount} erreurs`,
      error: false,
    })

    await clearingFiles()

    logMessage("info", `Temporary files removed`)
  } catch (err) {
    logMessage("error", err)
    logMessage("error", "Bulk geolocation interrupted")
  }
}
