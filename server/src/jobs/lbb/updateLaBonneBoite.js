import path from "path"
import fs from "fs"
import { oleoduc, readLineByLine, transformData, writeData } from "oleoduc"
import _ from "lodash-es"
import geoData from "../../common/utils/geoData.js"
import { GeoLocation, BonnesBoites, Opco } from "../../common/model/index.js"
import { rebuildIndex } from "../../common/utils/esUtils.js"
import initNafScoreMap from "./initNafScoreMap.js"
import initNafMap from "./initNafMap.js"
import initPredictionMap from "./initPredictionMap.js"
import initCBSPredictionMap from "./initCBSPredictionMap.js"
import { logMessage } from "../../common/utils/logMessage.js"
import { mongooseInstance } from "../../common/mongodb.js"
import { initSAVERemoveMap, initSAVEUpdateMap, initSAVEAddMap } from "./initSAVEMaps.js"
import { updateSAVECompanies } from "./updateSAVECompanies.js"
import __dirname from "../../common/dirname.js"
const currentDirname = __dirname(import.meta.url)

const defaultPredictionByROMEThreshold = 0.2 // 0.2 arbitraire
const CBSPredictionByROMEThreshold = 3.84 // 3.84 arbitraire
let predictionByROMEThreshold = defaultPredictionByROMEThreshold

let nafScoreMap = {}
let predictionMap = {}
let nafMap = {}

let removeMap = {}
let updateMap = {}
let addMap = {}

let count = 0

let findRomesForNafCount = 0
let findRomesForNafTime = 0

let getScoreForCompanyCount = 0
let getScoreForCompanyTime = 0
let getGeoCount = 0
let getGeoTime = 0
let findBBCount = 0
let findBBTime = 0
let running = false

const filePath = path.join(currentDirname, "./assets/etablissements.csv")

/*
path point de montage
const testFilePath = path.join(__dirname, "./datalakepe/extractmailing_lba_CCI.bz2");
let stats = fs.statSync(testFilePath);
var fileSizeInBytes = stats.size;
logMessage("info test montage", fileSizeInBytes);*/

const findRomesForNaf = async (bonneBoite) => {
  let sTime = new Date().getTime()
  let romes = await filterRomesFromNafHirings(bonneBoite)
  let eTime = new Date().getTime()

  findRomesForNafTime += eTime - sTime
  findRomesForNafCount++

  return romes
}

const isCompanyRemoved = (siret) => {
  return removeMap[siret]
}

const resetHashmaps = () => {
  nafScoreMap = {}
  predictionMap = {}
  nafMap = {}

  removeMap = {}
  updateMap = {}
  addMap = {}
}

const resetContext = () => {
  running = false
  // clearing memory and reseting params
  resetHashmaps()
  count = 0
  predictionByROMEThreshold = defaultPredictionByROMEThreshold
}

const emptyMongo = async () => {
  logMessage("info", `Clearing bonnesboites db...`)
  await BonnesBoites.deleteMany({})
}

const getScoreForCompany = async (siret) => {
  let sTime = new Date().getTime()
  let companyScore = predictionMap[siret]

  let eTime = new Date().getTime()

  getScoreForCompanyCount++
  getScoreForCompanyTime += eTime - sTime

  return companyScore
}

const filterRomesFromNafHirings = (bonneBoite /*, romes*/) => {
  const nafRomeHirings = nafScoreMap[bonneBoite.code_naf]

  let filteredRomes = []
  if (nafRomeHirings) {
    filteredRomes = nafRomeHirings.romes.filter((rome) => {
      return (bonneBoite.score * nafRomeHirings[rome]) / nafRomeHirings.hirings >= predictionByROMEThreshold
    })
  }

  return filteredRomes
}

const getGeoLocationForCompany = async (bonneBoite) => {
  if (!bonneBoite.geo_coordonnees) {
    let sTime = new Date().getTime()

    let geoKey = `${bonneBoite.numero_rue} ${bonneBoite.libelle_rue} ${bonneBoite.code_commune}`.trim().toUpperCase()

    let result = await GeoLocation.findOne({ address: geoKey })

    if (!result) {
      result = await geoData.getFirstMatchUpdates(bonneBoite)

      if (result) {
        let geoLocation = new GeoLocation({
          address: geoKey,
          ...result,
        })
        try {
          await geoLocation.save()
        } catch (err) {
          //ignore duplicate error
        }
      } else {
        return null
      }
    }

    let eTime = new Date().getTime()
    getGeoCount++
    getGeoTime += eTime - sTime

    return result
  } else return null
}

const getOpcoForCompany = async (bonneBoite) => {
  if (!bonneBoite.opco) {
    const siren = bonneBoite.siret.substring(0, 9)

    const result = await Opco.findOne({ siren })

    if (result) {
      return result.opco.toLowerCase()
    } else {
      return null
    }
  }
}

const printProgress = () => {
  if (count % 50000 === 0) {
    logMessage(
      "info",
      ` -- update ${count} - findRomesForNaf : ${findRomesForNafCount} avg ${
        findRomesForNafTime / findRomesForNafCount
      }ms -- getScoreForCompanyTime ${getScoreForCompanyCount} avg ${getScoreForCompanyTime / getScoreForCompanyCount}ms -- getGeoCount ${getGeoCount} avg ${
        getGeoTime / getGeoCount
      }ms -- findBBCount ${findBBCount} avg ${findBBTime / findBBCount}ms `
    )
  }
}

const initCompanyFromLine = (line) => {
  const terms = line.split(";")
  return {
    siret: terms[0].padStart(14, "0"),
    enseigne: terms[1],
    nom: terms[2],
    code_naf: terms[3],
    numero_rue: terms[4],
    libelle_rue: terms[5],
    code_commune: terms[6],
    code_postal: terms[7],
    email: terms[8].toUpperCase() !== "NULL" ? terms[8] : "",
    telephone: terms[9] !== "NULL" ? terms[9] : "",
    tranche_effectif: terms[10] !== "NULL" ? terms[10] : "",
    website: terms[11] !== "NULL" ? terms[11] : "",
    type: "lba",
  }
}

const parseLine = async (line) => {
  count++

  printProgress()

  let company = initCompanyFromLine(line)

  if (!company.enseigne) {
    logMessage("error", `Error processing company. Company ${company.siret} has no name`)
    return null
  }

  if (isCompanyRemoved(company.siret)) {
    await BonnesBoites.remove({ siret: company.siret })
    return null
  }

  let bonneBoite = await buildAndFilterBonneBoiteFromData(company)

  return bonneBoite
}

const insertSAVECompanies = async () => {
  logMessage("info", "Starting insertSAVECompanies")
  for (const key in addMap) {
    let company = addMap[key]

    let bonneBoite = await buildAndFilterBonneBoiteFromData(company)

    if (bonneBoite) {
      await bonneBoite.save()
    }
  }
  logMessage("info", "Ended insertSAVECompanies")
}

const removeSAVECompanies = async () => {
  logMessage("info", "Starting removeSAVECompanies")
  for (const key in removeMap) {
    await BonnesBoites.remove({ siret: key })
  }
  logMessage("info", "Ended removeSAVECompanies")
}

/*
  Initialize bonneBoite from data, add missing data from maps, 
*/
const buildAndFilterBonneBoiteFromData = async (company) => {
  let score = company.score || (await getScoreForCompany(company.siret))

  if (!score) {
    return null
  }

  let sTime = new Date().getTime()
  let bonneBoite = await BonnesBoites.findOne({ siret: company.siret })
  let eTime = new Date().getTime()
  findBBCount++
  findBBTime += eTime - sTime

  if (!bonneBoite) {
    company.intitule_naf = nafMap[company.code_naf]
    bonneBoite = new BonnesBoites(company)
  }

  bonneBoite.score = score

  // TODO checker si suppression via support PE

  let romes = await findRomesForNaf(bonneBoite)

  // filtrage des éléments inexploitables
  if (romes.length === 0) {
    return null
  } else {
    bonneBoite.romes = romes
  }

  let geo = await getGeoLocationForCompany(bonneBoite)

  if (!bonneBoite.geo_coordonnees) {
    if (!geo) {
      return null
    } else {
      bonneBoite.ville = geo.city
      bonneBoite.code_postal = geo.postcode
      bonneBoite.geo_coordonnees = geo.geoLocation
    }
  }

  bonneBoite.opco = await getOpcoForCompany(bonneBoite)

  return bonneBoite
}

const processBonnesBoitesFile = async () => {
  try {
    const db = mongooseInstance.connection

    await oleoduc(
      fs.createReadStream(filePath),
      readLineByLine(),
      transformData((line) => parseLine(line), { parallel: 8 }),
      writeData(async (bonneBoite) => {
        try {
          await db.collections["bonnesboites"].save(bonneBoite)
        } catch (err) {
          logMessage("error", err)
        }
      })
    )
  } catch (err2) {
    logMessage("error", err2)
    throw new Error("Error while parsing establishment file")
  }
}

const initPredictions = async ({ useCBSPrediction }) => {
  if (useCBSPrediction) {
    predictionByROMEThreshold = CBSPredictionByROMEThreshold
    predictionMap = await initCBSPredictionMap()
  } else {
    predictionMap = await initPredictionMap()
  }
}

const initMaps = async ({ shouldInitSAVEMaps }) => {
  if (shouldInitSAVEMaps) {
    removeMap = await initSAVERemoveMap()
    addMap = await initSAVEAddMap()
    updateMap = await initSAVEUpdateMap()
  }

  nafScoreMap = await initNafScoreMap()
  nafMap = await initNafMap()
}

export default async function ({ shouldClearMongo, shouldBuildIndex, shouldParseFiles, shouldInitSAVEMaps, useCBSPrediction }) {
  if (!running) {
    running = true
    try {
      logMessage("info", " -- Start updating lbb db -- ")

      await initMaps({ shouldInitSAVEMaps })

      if (shouldParseFiles) {
        await initPredictions({ useCBSPrediction })

        // TODO: supprimer ce reset
        if (shouldClearMongo) {
          await emptyMongo()
        }

        await processBonnesBoitesFile()
      } else if (shouldInitSAVEMaps) {
        await removeSAVECompanies()
      }

      await insertSAVECompanies()
      await updateSAVECompanies({ updateMap })

      if (shouldBuildIndex) {
        await rebuildIndex(BonnesBoites, { skipNotFound: true })
      }

      logMessage("info", `End updating lbb db`)

      resetContext()

      return {
        result: "Table mise à jour",
      }
    } catch (err) {
      logMessage("error", err)
      let error_msg = _.get(err, "meta.body") ?? err.message

      resetContext()

      return { error: error_msg }
    }
  } else {
    return { error: "process_already_running" }
  }
}
