import path from "path"
import fs from "fs"
import _ from "lodash-es"
import XLSX from "xlsx"
import { DomainesMetiers } from "../../common/model/index.js"
import { getElasticInstance } from "../../common/esClient/index.js"
import { getFileFromS3 } from "../../common/utils/awsUtils.js"
import { oleoduc } from "oleoduc"
import { logMessage } from "../../common/utils/logMessage.js"
import __dirname from "../../common/dirname.js"
const currentDirname = __dirname(import.meta.url)

const FILE_LOCAL_PATH = path.join(currentDirname, "./assets/domainesMetiers_S3.xlsx")

const emptyMongo = async () => {
  logMessage("info", `Clearing domainesmetiers db...`)
  await DomainesMetiers.deleteMany({})
}

const clearIndex = async () => {
  try {
    let client = getElasticInstance()
    logMessage("info", `Removing domainesmetiers index...`)
    await client.indices.delete({ index: "domainesmetiers" })
  } catch (err) {
    logMessage("error", `Error emptying es index : ${err.message}`)
  }
}

const createIndex = async () => {
  let requireAsciiFolding = true
  logMessage("info", `Creating domainesmetiers index...`)
  await DomainesMetiers.createMapping(requireAsciiFolding)
}

const downloadAndSaveFile = (optionalFileName) => {
  logMessage("info", `Downloading and save file ${optionalFileName ? optionalFileName : "currentDomainesMetiers.xlsx"} from S3 Bucket...`)
  return oleoduc(
    getFileFromS3(`mna-services/features/domainesMetiers/${optionalFileName ? optionalFileName : "currentDomainesMetiers.xlsx"}`),
    fs.createWriteStream(FILE_LOCAL_PATH)
  )
}

const readXLSXFile = (filePath) => {
  const workbook = XLSX.readFile(filePath, { codepage: 65001 })
  return { sheet_name_list: workbook.SheetNames, workbook }
}

export default async function (optionalFileName) {
  let step = 0

  try {
    logMessage("info", " -- Start of DomainesMetiers initializer -- ")

    await downloadAndSaveFile(optionalFileName)

    await emptyMongo()
    await clearIndex()

    await createIndex()

    const workbookDomainesMetiers = readXLSXFile(FILE_LOCAL_PATH)

    let codesROMEs,
      intitulesROMEs,
      codesRNCPs,
      intitulesRNCPs,
      couplesROMEsIntitules,
      motsClefsDomaine,
      motsClefsSpecifiques,
      appellationsROMEs,
      coupleAppellationsRomeIntitules,
      codesFAPs,
      libellesFAPs,
      sousDomainesOnisep

    const reset = () => {
      codesROMEs = []
      intitulesROMEs = []
      codesRNCPs = []
      intitulesRNCPs = []
      couplesROMEsIntitules = []
      motsClefsDomaine = []
      motsClefsSpecifiques = []
      appellationsROMEs = []
      coupleAppellationsRomeIntitules = []
      codesFAPs = []
      libellesFAPs = []
      sousDomainesOnisep = []
    }

    let avertissements = []

    logMessage("info", `Début traitement`)

    let onglet = XLSX.utils.sheet_to_json(workbookDomainesMetiers.workbook.Sheets["Liste"])

    reset()

    for (let i = 0; i < onglet.length; i++) {
      let row = onglet[i]
      if (row.metier) {
        // cas de la ligne sur laquelle se trouve len nom du métier qui va marquer l'insertion d'une ligne dans la db

        step = 1

        let domainesMetier = new DomainesMetiers({
          domaine: row.domaine,
          sous_domaine: row.metier,
          mots_clefs_specifiques: [...new Set(motsClefsSpecifiques)].join(", "),
          mots_clefs: [...new Set(motsClefsDomaine)].join(", "),
          appellations_romes: [...new Set(appellationsROMEs)].join(", "),
          couples_appellations_rome_metier: coupleAppellationsRomeIntitules,
          codes_romes: codesROMEs,
          intitules_romes: intitulesROMEs,
          codes_rncps: codesRNCPs,
          intitules_rncps: intitulesRNCPs,
          couples_romes_metiers: couplesROMEsIntitules,
          codes_fap: [...new Set(codesFAPs)],
          intitules_fap: [...new Set(libellesFAPs)],
          sous_domaine_onisep: sousDomainesOnisep,
        })

        if (codesROMEs.length > 15) {
          avertissements.push({ domaine: row.metier, romes: codesROMEs.length })
        }

        await domainesMetier.save()
        //console.log("DomainesMetier à sauver : ", domainesMetier);

        logMessage("info", `Added ${domainesMetier.sous_domaine} ${domainesMetier._id} to collection `)

        reset()
      } else {
        step = 2

        let currentAppellationsROMEs = row.appellations_rome

        //couplesROMEsIntitules
        if (row.code_rome && row.libelle_rome) {
          if (codesROMEs.indexOf(row.code_rome.trim()) < 0 || intitulesROMEs.indexOf(row.libelle_rome.trim()) < 0) {
            couplesROMEsIntitules.push({
              codeRome: row.code_rome.trim(),
              intitule: row.libelle_rome.trim(),
            })

            if (currentAppellationsROMEs) {
              currentAppellationsROMEs.split(", ").map((appellation) => {
                coupleAppellationsRomeIntitules.push({
                  codeRome: row.code_rome.trim(),
                  intitule: row.libelle_rome.trim(),
                  appellation: appellation,
                })
              })
            }
          }
        }

        step = 3

        let currentROME = row.code_rome
        if (currentROME && codesROMEs.indexOf(currentROME.trim()) < 0) {
          codesROMEs.push(currentROME.trim())
        }

        step = 4

        let currentIntituleROME = row.libelle_rome
        if (currentIntituleROME && intitulesROMEs.indexOf(currentIntituleROME.trim()) < 0) {
          intitulesROMEs.push(currentIntituleROME.trim())
        }

        step = 5

        let currentRNCP = row.code_rncp
        if (currentRNCP && codesRNCPs.indexOf(currentRNCP.trim()) < 0) {
          codesRNCPs.push(currentRNCP.trim())
        }

        step = 6

        let currentLibelleRNCP = row.intitule_rncp
        if (currentLibelleRNCP && intitulesRNCPs.indexOf(currentLibelleRNCP.trim()) < 0) {
          intitulesRNCPs.push(currentLibelleRNCP.trim())
        }

        step = 7

        let currentSousDomaineOnisep = row.sous_domaine_onisep_1
        if (currentSousDomaineOnisep && sousDomainesOnisep.indexOf(currentSousDomaineOnisep.trim()) < 0) {
          sousDomainesOnisep.push(currentSousDomaineOnisep.trim())
        }
        currentSousDomaineOnisep = row.sous_domaine_onisep_2
        if (currentSousDomaineOnisep && sousDomainesOnisep.indexOf(currentSousDomaineOnisep.trim()) < 0) {
          sousDomainesOnisep.push(currentSousDomaineOnisep.trim())
        }

        step = 8

        let currentMotsClefsDomaine = row.mots_clefs_domaine
        if (currentMotsClefsDomaine) {
          motsClefsDomaine = motsClefsDomaine.concat(currentMotsClefsDomaine.split(/[\s,;]+/))
        }

        step = 9

        let currentMotsClefsSpecifiques = row.mots_clefs_ligne
        if (currentMotsClefsSpecifiques) {
          motsClefsSpecifiques = motsClefsSpecifiques.concat(currentMotsClefsSpecifiques.split(/[\s,;]+/))
        }

        step = 10

        let currentCodesFAP = row.codes_fap
        if (currentCodesFAP) {
          codesFAPs = codesFAPs.concat(currentCodesFAP.split(/[\s,;]+/))
        }

        step = 11

        let currentLibellesFAP = row.libelles_fap
        if (currentLibellesFAP) {
          libellesFAPs = libellesFAPs.concat(currentLibellesFAP.split("; "))
        }

        step = 12

        if (currentAppellationsROMEs) {
          appellationsROMEs = appellationsROMEs.concat(currentAppellationsROMEs.toLowerCase().split(/[\s,/;]+/))
        }
      }
    }

    logMessage("info", `Fin traitement`)

    return {
      result: "Table mise à jour",
      fileName: optionalFileName ? optionalFileName : "currentDomainesMetiers.xlsx",
      avertissements,
    }
  } catch (err) {
    console.log("error step ", step)
    logMessage("error", err)
    let error_msg = _.get(err, "meta.body") ?? err.message
    return { error: error_msg, fileName: optionalFileName ? optionalFileName : "currentDomainesMetiers.xlsx" }
  }
}
