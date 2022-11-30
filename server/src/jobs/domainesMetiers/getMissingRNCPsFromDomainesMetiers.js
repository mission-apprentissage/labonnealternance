import fs from "fs"
import _ from "lodash-es"
import { oleoduc } from "oleoduc"
import path from "path"
import XLSX from "xlsx"
import __dirname from "../../common/dirname.js"
import { getElasticInstance } from "../../common/esClient/index.js"
import { logger } from "../../common/logger.js"
import { DomainesMetiers } from "../../common/model/index.js"
import { getFileFromS3 } from "../../common/utils/awsUtils.js"
import { logMessage } from "../../common/utils/logMessage.js"
import config from "../../config.js"
const currentDirname = __dirname(import.meta.url)

const esClient = getElasticInstance()

const FILE_LOCAL_PATH = path.join(currentDirname, "./assets/domainesMetiers_S3.xlsx")

const getFormationEsQueryIndexFragment = (limit) => {
  return {
    index: "convertedformations",
    size: limit,
    _source_includes: ["rncp_code", "rncp_intitule"],
  }
}

const resultFilePath = path.join(currentDirname, "./assets/RNCPs_manquants.xlsx")

const saveResultToFile = (json) => {
  logMessage("info", " -- Saving missing rncps to local file -- ")

  try {
    fs.unlinkSync(resultFilePath)
  } catch (err) {
    console.log("error removing file : ", err.message)
  }

  let wsResult = [["Domaine", "Total_formations", "Total_formations_perdues", "Code_rncp", "Lbelle_rncp", "Rncp_dans_autres_metiers"]]

  json.map((domain) => {
    if (domain.metier) {
      //console.log(domain);
      wsResult.push([domain.metier, domain.missingRNCPs.totalFormations, domain.missingRNCPs.totalFormationsPerdues, "", "", ""])

      domain.missingRNCPs.RNCPsManquants.map((rncp) => {
        let metiers = ""
        if (rncp.autresMetiers !== "aucun") {
          metiers = rncp.autresMetiers.join("; ")
        }

        wsResult.push(["", "", "", rncp.code, rncp.libelle, metiers])
      })
    }
  })

  // Ecriture résultat
  let wb = XLSX.utils.book_new()

  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(wsResult), "Rncps_manquants")

  XLSX.writeFile(wb, resultFilePath)
}

let inDomainRNCPs = new Set()
let domainsOfRNCPs = {}

const getMissingRNCPsOfDomain = async (domain) => {
  try {
    const body = {
      query: {
        bool: {
          must: {
            match: {
              rome_codes: domain.codes_romes.join(" "),
            },
          },
        },
      },
    }

    const response = await esClient.search({
      ...getFormationEsQueryIndexFragment(10000),
      body,
    })

    let missingRNCPs = []
    let missingRNCPsWithLabel = []
    let missingTrainingCount = 0

    response.body.hits.hits.forEach((training) => {
      if (domain.codes_rncps.indexOf(training._source.rncp_code) < 0) {
        missingTrainingCount++
        if (missingRNCPs.indexOf(training._source.rncp_code) < 0) {
          missingRNCPs.push(training._source.rncp_code)
          let missinRNCPWithLabel = {
            libelle: training._source.rncp_intitule,
            code: training._source.rncp_code,
          }
          missingRNCPsWithLabel.push(missinRNCPWithLabel)
        }
      }
    })

    //console.log("total ", response.data.hits.hits.length, " miss : ", missingRNCPs.length,[...new Set(missingRNCPs)].length);

    return {
      totalFormations: response.body.hits.hits.length,
      totalFormationsPerdues: missingTrainingCount,
      RNCPsManquants: missingRNCPsWithLabel,
    }
  } catch (err) {
    let error_msg = _.get(err, "meta.body") ?? err.message

    if (_.get(err, "meta.meta.connection.status") === "dead") {
      logger.error(`Elastic search is down or unreachable. error_message=${error_msg}`)
    } else {
      logger.error(`Error analyzing rncps. error_message=${error_msg}`)
    }

    return { error: error_msg }
  }
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

const searchForMissingRNCPsInOtherDomains = (missingRNCPs) => {
  missingRNCPs.forEach((domainMissingRNCPs) => {
    domainMissingRNCPs.missingRNCPs.RNCPsManquants.forEach((rncp) => {
      if (rncp) {
        if (inDomainRNCPs.has(rncp.code)) {
          rncp.autresMetiers = domainsOfRNCPs[rncp.code]
        } else {
          rncp.autresMetiers = "aucun"
        }
      }
    })
  })
}

export default async (optionalFileName) => {
  let step = 0
  try {
    logMessage("info", " -- Start of DomainesMetiers analyzer -- ")

    await downloadAndSaveFile(optionalFileName)

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

    let missingRNCPs = []

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

        // enregistrement des rncps
        codesRNCPs.forEach((rncp) => {
          inDomainRNCPs.add(rncp)
          if (domainsOfRNCPs[rncp]) {
            domainsOfRNCPs[rncp].push(domainesMetier.sous_domaine)
          } else {
            domainsOfRNCPs[rncp] = [domainesMetier.sous_domaine]
          }
        })
        //console.log("ICIII : ", getMissingRNCPsOfDomain);

        let missingRNCPsOfDomain = await getMissingRNCPsOfDomain(domainesMetier)

        missingRNCPs.push({
          metier: domainesMetier.sous_domaine,
          //codesROMEs,
          //codesRNCPs,
          missingRNCPs: missingRNCPsOfDomain ? missingRNCPsOfDomain : "aucun RNCP manquant",
        })

        logMessage("info", `Analyzed ${domainesMetier.sous_domaine}`)

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
          }

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

    searchForMissingRNCPsInOtherDomains(missingRNCPs)

    saveResultToFile(missingRNCPs)

    return {
      result: "Fichier analysé",
      fileName: optionalFileName ? optionalFileName : "currentDomainesMetiers.xlsx",
      fichierXlsx: `${config.publicUrl}/api/updateRomesMetiers/missingRNCPs/RNCP_manquants.xlsx`,
      //inDomainRNCPs: [...inDomainRNCPs],
      missingRNCPs,
    }
  } catch (err) {
    logMessage("error", err)
    let error_msg = _.get(err, "meta.body") ?? err.message
    return { error: error_msg, fileName: optionalFileName ? optionalFileName : "currentDomainesMetiers.xlsx", step }
  }
}
