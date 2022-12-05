import Sentry from "@sentry/node"
import fs from "fs"
import { oleoduc } from "oleoduc"
import path from "path"
import XLSX from "xlsx"
import __dirname from "../../common/dirname.js"
import { logger } from "../../common/logger.js"
import { DomainesMetiers } from "../../common/model/index.js"
import { getFileFromS3 } from "../../common/utils/awsUtils.js"
import { resetIndexAndDb } from "../../common/utils/esUtils.js"
import { readXLSXFile } from "../../common/utils/fileUtils.js"

const currentDirname = __dirname(import.meta.url)
const FILEPATH = path.join(currentDirname, "../../assets/domainesMetiers_S3.xlsx")

const downloadAndSaveFile = (optionalFileName) => {
  logger.info(`Downloading and save file ${optionalFileName ? optionalFileName : "currentDomainesMetiers.xlsx"} from S3 Bucket...`)
  return oleoduc(getFileFromS3(`mna-services/features/domainesMetiers/${optionalFileName ? optionalFileName : "currentDomainesMetiers.xlsx"}`), fs.createWriteStream(FILEPATH))
}

export default async function (optionalFileName) {
  let step = 0

  logger.info(" -- Start of DomainesMetiers initializer -- ")

  await resetIndexAndDb("domainesmetiers", DomainesMetiers, { requireAsciiFolding: true })

  await downloadAndSaveFile(optionalFileName)

  const workbookDomainesMetiers = readXLSXFile(FILEPATH)

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
        // cas de la ligne sur laquelle se trouve le nom du métier qui va marquer l'insertion d'une ligne dans la db
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

        if (codesROMEs.length > 15) {
          avertissements.push({ domaine: metier, romes: codesROMEs.length })
        }

        await domainesMetier.save()

        reset()
      } else {
        step = 2

        // Couple intitule - rome
        if (code_rome && libelle_rome) {
          if (codesROMEs.indexOf(code_rome.trim()) < 0 || intitulesROMEs.indexOf(libelle_rome.trim()) < 0) {
            couplesROMEsIntitules.push({
              codeRome: code_rome.trim(),
              intitule: libelle_rome.trim(),
            })
            // Couple appelation - code rome - intitule
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

    logger.info("Deleting downloaded file frome assets")
    await fs.unlinkSync(FILEPATH)

    logger.info(`Fin traitement`)

    return {
      result: "Table mise à jour",
      fileName: optionalFileName ? optionalFileName : "currentDomainesMetiers.xlsx",
      avertissements,
    }
  } catch (error) {
    Sentry.captureException(error)
    logger.error(`error step ${step}`)
    logger.error(error)
    return { error, fileName: optionalFileName ? optionalFileName : "currentDomainesMetiers.xlsx" }
  }
}
