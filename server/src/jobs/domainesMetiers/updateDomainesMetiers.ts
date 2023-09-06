// @ts-nocheck
import fs from "fs"
import path from "path"

import { oleoduc } from "oleoduc"
import XLSX from "xlsx"

import __dirname from "../../common/dirname"
import { logger } from "../../common/logger"
import { DomainesMetiers } from "../../common/model/index"
import { getFileFromS3Bucket } from "../../common/utils/awsUtils"
import { resetIndexAndDb } from "../../common/utils/esUtils"
import { readXLSXFile } from "../../common/utils/fileUtils"
import { sentryCaptureException } from "../../common/utils/sentryUtils"

const currentDirname = __dirname(import.meta.url)
const FILEPATH = path.join(currentDirname, "../../assets/domainesMetiers_S3.xlsx")

const downloadAndSaveFile = async (from = "currentDomainesMetiers.xlsx") => {
  logger.info(`Downloading and save file ${from} from S3 Bucket...`)

  await oleoduc(getFileFromS3Bucket({ key: from }), fs.createWriteStream(FILEPATH))
}

export default async function (optionalFileName?: string) {
  let step = 0

  logger.info(" -- Start of DomainesMetiers initializer -- ")

  await downloadAndSaveFile(optionalFileName)

  await resetIndexAndDb("domainesmetiers", DomainesMetiers, { requireAsciiFolding: true })

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

  const avertissements = []

  logger.info(`Début traitement`)

  const onglet = XLSX.utils.sheet_to_json(workbookDomainesMetiers.workbook.Sheets["Liste"])

  reset()

  try {
    for (let i = 0; i < onglet.length; i++) {
      const row = onglet[i]

      const {
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

        const domainesMetier = new DomainesMetiers({
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
    sentryCaptureException(error)
    logger.error(`error step ${step}`)
    logger.error(error)
    return { error, fileName: optionalFileName ? optionalFileName : "currentDomainesMetiers.xlsx" }
  }
}
