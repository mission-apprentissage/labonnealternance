import fs from "fs"
import path from "path"
import { pipeline } from "stream/promises"

import { ObjectId } from "mongodb"
import { IDomainesMetiers, ZDomainesMetiers } from "shared/models/index"
import { removeAccents } from "shared/utils/index"
import XLSX from "xlsx"

import { initializeCacheMetiers } from "@/services/metiers.service"

import __dirname from "../../common/dirname"
import { logger } from "../../common/logger"
import { s3ReadAsStream } from "../../common/utils/awsUtils"
import { readXLSXFile } from "../../common/utils/fileUtils"
import { getDbCollection } from "../../common/utils/mongodbUtils"
import { sentryCaptureException } from "../../common/utils/sentryUtils"
import { createAssetsFolder } from "../offrePartenaire/recruteur-lba/importRecruteursLbaRaw"

const currentDirname = __dirname(import.meta.url)
const FILEPATH = path.join(currentDirname, "./assets/domainesMetiers_S3.xlsx")

const downloadAndSaveFile = async (from = "currentDomainesMetiers.xlsx") => {
  logger.info(`Downloading and save file ${from} from S3 Bucket...`)

  await createAssetsFolder()
  await pipeline(await s3ReadAsStream("storage", from), fs.createWriteStream(FILEPATH))
}

export default async function (optionalFileName?: string) {
  let step = 0

  logger.info(" -- Start of DomainesMetiers initializer -- ")

  await downloadAndSaveFile(optionalFileName)

  logger.info(`Clearing domainesmetiers...`)
  await getDbCollection("domainesmetiers").deleteMany({})

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
    codesFAPs: string[] = [],
    libellesFAPs: string[] = [],
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

  const avertissements: any[] = []

  logger.info(`Début traitement`)

  const onglet = XLSX.utils.sheet_to_json(workbookDomainesMetiers.workbook.Sheets["Liste"])

  reset()

  try {
    for (let i = 0; i < onglet.length; i++) {
      const row: any = onglet[i]

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

        const now = new Date()
        const paramsDomaineMetier: IDomainesMetiers = {
          _id: new ObjectId(),
          domaine: domaine,
          domaine_sans_accent_computed: removeAccents(domaine),
          sous_domaine: metier,
          sous_domaine_sans_accent_computed: removeAccents(metier),
          mots_clefs_specifiques: [...new Set(motsClefsSpecifiques)].join(", "),
          mots_clefs_specifiques_sans_accent_computed: [...new Set(motsClefsSpecifiques.map(removeAccents))].join(", "),
          mots_clefs: [...new Set(motsClefsDomaine)].join(", "),
          mots_clefs_sans_accent_computed: [...new Set(motsClefsDomaine.map(removeAccents))].join(", "),
          appellations_romes: [...new Set(appellationsROMEs)].join(", "),
          appellations_romes_sans_accent_computed: [...new Set(appellationsROMEs.map(removeAccents))].join(", "),
          couples_appellations_rome_metier: coupleAppellationsRomeIntitules,
          codes_romes: codesROMEs,
          intitules_romes: intitulesROMEs,
          intitules_romes_sans_accent_computed: intitulesROMEs.map((v) => removeAccents(v)),
          codes_rncps: codesRNCPs,
          intitules_rncps: intitulesRNCPs,
          intitules_rncps_sans_accent_computed: intitulesRNCPs.map((v) => removeAccents(v)),
          couples_romes_metiers: couplesROMEsIntitules,
          codes_fap: [...new Set(codesFAPs)],
          intitules_fap: [...new Set(libellesFAPs)],
          intitules_fap_sans_accent_computed: [...new Set(libellesFAPs)].map(removeAccents),
          sous_domaine_onisep: sousDomainesOnisep,
          sous_domaine_onisep_sans_accent_computed: sousDomainesOnisep.map(removeAccents),
          created_at: now,
          last_update_at: now,
        }

        if (codesROMEs.length > 15) {
          avertissements.push({ domaine: metier, romes: codesROMEs.length })
        }

        const parsedDomaineMetier = ZDomainesMetiers.safeParse(paramsDomaineMetier)

        if (parsedDomaineMetier.success) {
          await getDbCollection("domainesmetiers").insertOne(paramsDomaineMetier)
        } else {
          logger.error(`Erreur non bloquante : mauvais format de domaines metiers domaine=${paramsDomaineMetier.domaine} - sous_domaine=${paramsDomaineMetier.sous_domaine}`)
        }

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

    logger.info("Reloading domainesMetiers cache")
    await initializeCacheMetiers()

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
