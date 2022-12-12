import Sentry from "@sentry/node"
import fs from "fs"
import { get } from "lodash-es"
import { oleoduc } from "oleoduc"
import path from "path"
import XLSX from "xlsx"
import __dirname from "../../common/dirname.js"
import { getElasticInstance } from "../../common/esClient/index.js"
import { logger } from "../../common/logger.js"
import { DomainesMetiers } from "../../common/model/index.js"
import { getFileFromS3 } from "../../common/utils/awsUtils.js"
import { readXLSXFile } from "../../common/utils/fileUtils.js"
import config from "../../config.js"

const currentDirname = __dirname(import.meta.url)
const esClient = getElasticInstance()

const FILEPATH_DOMAINES_METIERS = path.join(currentDirname, "./assets/domainesMetiers_S3.xlsx")
const FILEPATH_MISSING_RNCP = path.join(currentDirname, "./assets/RNCPs_manquants.xlsx")

const saveResultToFile = (json) => {
  logger.info(" -- Saving missing rncps to local file -- ")

  try {
    fs.unlinkSync(FILEPATH_MISSING_RNCP)
  } catch (err) {
    console.log("error removing file : ", err.message)
  }

  let wsResult = [["Domaine", "Total_formations", "Total_formations_perdues", "Code_rncp", "Lbelle_rncp", "Rncp_dans_autres_metiers"]]

  json.map(({ metier, missingRNCPs }) => {
    if (metier) {
      wsResult.push([metier, missingRNCPs.totalFormations, missingRNCPs.totalFormationsPerdues, "", "", ""])

      missingRNCPs.RNCPsManquants.map((rncp) => {
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

  XLSX.writeFile(wb, FILEPATH_MISSING_RNCP)
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
      index: "convertedformations",
      _source_includes: ["rncp_code", "rncp_intitule"],
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
    let error_msg = get(err, "meta.body") ?? err.message

    if (get(err, "meta.meta.connection.status") === "dead") {
      logger.error(`Elastic search is down or unreachable. error_message=${error_msg}`)
    } else {
      logger.error(`Error analyzing rncps. error_message=${error_msg}`)
    }

    return { error: error_msg }
  }
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

const downloadAndSaveFile = (optionalFileName) => {
  logger.info(`Downloading and save file ${optionalFileName ? optionalFileName : "currentDomainesMetiers.xlsx"} from S3 Bucket...`)
  return oleoduc(
    getFileFromS3(`mna-services/features/domainesMetiers/${optionalFileName ? optionalFileName : "currentDomainesMetiers.xlsx"}`),
    fs.createWriteStream(FILEPATH_DOMAINES_METIERS)
  )
}

export default async (optionalFileName) => {
  let step = 0

  logger.info(" -- Start of DomainesMetiers analyzer -- ")

  await downloadAndSaveFile(optionalFileName)

  const workbookDomainesMetiers = readXLSXFile(FILEPATH_DOMAINES_METIERS)

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

  logger.info(`Début traitement`)

  let onglet = XLSX.utils.sheet_to_json(workbookDomainesMetiers.workbook.Sheets["Liste"])

  reset()

  try {
    for (let i = 0; i < onglet.length; i++) {
      let row = onglet[i]
      let {
        metier,
        domaine,
        appellations_rome,
        code_rome,
        libelle_rome,
        code_rncp,
        intitule_rncp,
        sous_domaine_onisep_1,
        sous_domaine_onisep_2,
        mots_clefs_domaine,
        mots_clefs_ligne,
        codes_fap,
        libelles_fap,
      } = row

      if (metier) {
        // cas de la ligne sur laquelle se trouve len nom du métier qui va marquer l'insertion d'une ligne dans la db

        step = 1

        let domainesMetier = new DomainesMetiers({
          domaine: domaine,
          sous_domaine: metier,
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

        let missingRNCPsOfDomain = await getMissingRNCPsOfDomain(domainesMetier)

        missingRNCPs.push({
          metier: domainesMetier.sous_domaine,
          missingRNCPs: missingRNCPsOfDomain ? missingRNCPsOfDomain : "aucun RNCP manquant",
        })

        logger.info(`Analyzed ${domainesMetier.sous_domaine}`)

        reset()
      } else {
        step = 2

        //couplesROMEsIntitules
        if (code_rome && libelle_rome) {
          if (codesROMEs.indexOf(code_rome.trim()) < 0 || intitulesROMEs.indexOf(libelle_rome.trim()) < 0) {
            couplesROMEsIntitules.push({
              codeRome: code_rome.trim(),
              intitule: libelle_rome.trim(),
            })
          }

          if (appellations_rome) {
            appellations_rome.split(", ").map((appellation) => {
              coupleAppellationsRomeIntitules.push({
                codeRome: code_rome.trim(),
                intitule: libelle_rome.trim(),
                appellation: appellation,
              })
            })
          }
        }

        step = 3

        if (code_rome && codesROMEs.indexOf(code_rome.trim()) < 0) {
          codesROMEs.push(code_rome.trim())
        }

        step = 4

        if (libelle_rome && intitulesROMEs.indexOf(libelle_rome.trim()) < 0) {
          intitulesROMEs.push(libelle_rome.trim())
        }

        step = 5

        if (code_rncp && codesRNCPs.indexOf(code_rncp.trim()) < 0) {
          codesRNCPs.push(code_rncp.trim())
        }

        step = 6

        if (intitule_rncp && intitulesRNCPs.indexOf(intitule_rncp.trim()) < 0) {
          intitulesRNCPs.push(intitule_rncp.trim())
        }

        step = 7

        if (sous_domaine_onisep_1 && sousDomainesOnisep.indexOf(sous_domaine_onisep_1.trim()) < 0) {
          sousDomainesOnisep.push(sous_domaine_onisep_1.trim())
        }

        if (sous_domaine_onisep_2 && sousDomainesOnisep.indexOf(sous_domaine_onisep_2.trim()) < 0) {
          sousDomainesOnisep.push(sous_domaine_onisep_2.trim())
        }

        step = 8

        if (mots_clefs_domaine) {
          motsClefsDomaine = motsClefsDomaine.concat(mots_clefs_domaine.split(/[\s,;]+/))
        }

        step = 9

        if (mots_clefs_ligne) {
          motsClefsSpecifiques = motsClefsSpecifiques.concat(mots_clefs_ligne.split(/[\s,;]+/))
        }

        step = 10

        if (codes_fap) {
          codesFAPs = codesFAPs.concat(codes_fap.split(/[\s,;]+/))
        }

        step = 11

        if (libelles_fap) {
          libellesFAPs = libellesFAPs.concat(libelles_fap.split("; "))
        }

        step = 12

        if (appellations_rome) {
          appellationsROMEs = appellationsROMEs.concat(appellations_rome.toLowerCase().split(/[\s,/;]+/))
        }
      }
    }

    searchForMissingRNCPsInOtherDomains(missingRNCPs)
    saveResultToFile(missingRNCPs)

    return {
      result: "Fichier analysé",
      fileName: optionalFileName ? optionalFileName : "currentDomainesMetiers.xlsx",
      fichierXlsx: `${config.publicUrl}/api/updateRomesMetiers/missingRNCPs/RNCP_manquants.xlsx`,
      missingRNCPs,
    }
  } catch (error) {
    console.log(`script failed on step ${step}`)
    Sentry.captureException(error)
    logger.error(error)
  }
}
