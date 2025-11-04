import { ObjectId } from "mongodb"
import type { IDiplomesMetiers } from "shared/models/index"
import { ZDiplomesMetiers } from "shared/models/index"

import { logger } from "@/common/logger"
import { getDbCollection } from "@/common/utils/mongodbUtils"
import { notifyToSlack } from "@/common/utils/slackUtils"
import { filterWrongRomes } from "@/services/formation.service"

const MOTS_IGNORES = ["a", "au", "aux", "l", "le", "la", "les", "d", "de", "du", "des", "et", "en"]

interface FormationData {
  intitule_long?: string | null
  rome_codes?: string[] | null
  rncp_code?: string | null
}

interface DiplomeMetierTemp {
  intitule_long: string
  codes_romes: string[]
  codes_rncps: string[]
}

const buildAcronyms = (intitule: string): string => {
  // Remove content in parentheses
  const intitule_sans_parenthese = intitule.replace(/\s\(.*$/, "")

  const tokens = intitule_sans_parenthese.toLowerCase().split(/[\s-';:,)]+/)

  let acronymeLong = ""
  let acronymeCourt = ""

  tokens.forEach((token) => {
    if (token) {
      const firstChar = token[0]
      acronymeLong += firstChar

      if (!MOTS_IGNORES.includes(token)) {
        acronymeCourt += firstChar
      }
    }
  })

  return `${acronymeCourt} ${acronymeLong}`
}

const updateDiplomeMetierList = (initial: DiplomeMetierTemp, toAdd: FormationData): DiplomeMetierTemp => {
  // Use Set for efficient deduplication
  const romesSet = new Set(initial.codes_romes)
  const rncpsSet = new Set(initial.codes_rncps)

  if (toAdd.rome_codes && Array.isArray(toAdd.rome_codes)) {
    toAdd.rome_codes.forEach((rome_code) => {
      if (rome_code) {
        romesSet.add(rome_code)
      }
    })
  }

  if (toAdd.rncp_code) {
    rncpsSet.add(toAdd.rncp_code)
  }

  return {
    ...initial,
    codes_romes: Array.from(romesSet),
    codes_rncps: Array.from(rncpsSet),
  }
}

const getIntitulesFormations = async (): Promise<Map<string, DiplomeMetierTemp>> => {
  const intitulesFormations = await getDbCollection("formationcatalogues")
    .find({}, { projection: { _id: 0, intitule_long: 1, rome_codes: 1, rncp_code: 1 } })
    .toArray()

  const diplomesMetiers = new Map<string, DiplomeMetierTemp>()

  for (const formation of intitulesFormations) {
    filterWrongRomes(formation)
    if (formation.intitule_long && formation.rome_codes && formation.rome_codes.length) {
      const existingDiplome = diplomesMetiers.get(formation.intitule_long)

      if (!existingDiplome) {
        diplomesMetiers.set(formation.intitule_long, {
          intitule_long: formation.intitule_long,
          codes_romes: formation.rome_codes,
          codes_rncps: formation.rncp_code ? [formation.rncp_code] : [],
        })
      } else {
        diplomesMetiers.set(formation.intitule_long, updateDiplomeMetierList(existingDiplome, formation))
      }
    }
  }

  return diplomesMetiers
}

export const updateDiplomeMetier = async (): Promise<void> => {
  logger.info(" -- Start updateDiplomesMetiers job -- ")

  try {
    logger.info(`Clearing diplomesmetiers...`)
    await getDbCollection("diplomesmetiers").deleteMany({})

    logger.info(`Début traitement`)

    const diplomesMetiers = await getIntitulesFormations()
    const now = new Date()

    // Prepare all documents for bulk insert
    const diplomesToInsert: IDiplomesMetiers[] = []
    const invalidDiplomes: string[] = []

    for (const [, diplome] of diplomesMetiers) {
      if (!diplome.codes_romes?.length) {
        continue
      }

      const diplomeWithMetadata = {
        _id: new ObjectId(),
        ...diplome,
        acronymes_intitule: buildAcronyms(diplome.intitule_long),
        created_at: now,
        last_update_at: now,
      }

      const parsedDiplomeMetier = ZDiplomesMetiers.safeParse(diplomeWithMetadata)
      if (parsedDiplomeMetier.success) {
        diplomesToInsert.push(parsedDiplomeMetier.data)
      } else {
        invalidDiplomes.push(diplome.intitule_long)
        logger.error(`Mauvais format diplomesmetier pour le diplôme ${diplome.intitule_long}`, {
          errors: parsedDiplomeMetier.error.errors,
        })
      }
    }

    // Bulk insert all valid diplomes in a single operation
    if (diplomesToInsert.length > 0) {
      logger.info(`Inserting ${diplomesToInsert.length} diplomes...`)
      await getDbCollection("diplomesmetiers").insertMany(diplomesToInsert, { ordered: false })
      logger.info(`Successfully inserted ${diplomesToInsert.length} diplomes`)
    }

    if (invalidDiplomes.length > 0) {
      logger.warn(`${invalidDiplomes.length} diplomes were invalid and skipped`)
    }

    await notifyToSlack({
      subject: "Mise à jour Diplome Metier",
      message: `${diplomesToInsert.length} diplomes ont été insérés. ${invalidDiplomes.length} diplomes ont été ignorés`,
    })

    logger.info(`Fin traitement`)
  } catch (error) {
    logger.error("Error during updateDiplomeMetier", { error })
    await notifyToSlack({
      subject: "Erreur Mise à jour Diplome Metier",
      message: `Erreur lors de la mise à jour des diplomes metiers : ${error}`,
      error: true,
    })
    throw error
  }
}
