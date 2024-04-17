import { ZDiplomesMetiersNew } from "shared/models"

import { initializeCacheDiplomas } from "@/services/metiers.service"

import { logger } from "../../common/logger"
import { DiplomesMetiers, FormationCatalogue } from "../../common/model/index"

const motsIgnores = ["a", "au", "aux", "l", "le", "la", "les", "d", "de", "du", "des", "et", "en"]
const diplomesMetiers = {}

const buildAcronyms = (intitule) => {
  let acronymeLong = ""
  let acronymeCourt = ""
  let intitule_sans_parenthese = intitule

  if (intitule.indexOf(" (") >= 0) {
    intitule_sans_parenthese = intitule.substring(0, intitule.indexOf(" ("))
  }

  const tokens = intitule_sans_parenthese.toLowerCase().split(/[\s-';:,)]+/)

  tokens.map((token) => {
    if (token) {
      acronymeLong += token[0]

      if (motsIgnores.indexOf(token) < 0) {
        acronymeCourt += token[0]
      }
    }
  })

  return acronymeCourt + " " + acronymeLong
}

const updateDiplomeMetier = ({ initial, toAdd }) => {
  if (toAdd.codes_romes) {
    toAdd.codes_romes.map((rome_code) => {
      if (initial.codes_romes.indexOf(rome_code) < 0) {
        initial.codes_romes.push(rome_code)
      }
    })
  }

  if (initial.codes_rncps.indexOf(toAdd.rncp_code) < 0) {
    initial.codes_rncps.push(toAdd.rncp_code)
  }

  return initial
}

/**
 * retire les codes romes qui se terminent par 00 ou font moins de 5 caractères
 */
const filterWrongRomes = (formation) => {
  formation.rome_codes = formation.rome_codes.filter((rome_code) => rome_code.length === 5 && !rome_code.endsWith("00"))
}

const getIntitulesFormations = async () => {
  const intitulesFormations = await FormationCatalogue.find({}, { _id: 0, intitule_long: 1, rome_codes: 1, rncp_code: 1 }).lean()

  for (const formation of intitulesFormations) {
    filterWrongRomes(formation)
    if (formation.intitule_long && formation.rome_codes && formation.rome_codes.length) {
      if (!diplomesMetiers[formation.intitule_long]) {
        diplomesMetiers[formation.intitule_long] = {
          intitule_long: formation.intitule_long,
          codes_romes: formation.rome_codes,
          codes_rncps: [formation.rncp_code],
        }
      } else {
        diplomesMetiers[formation.intitule_long] = updateDiplomeMetier({
          initial: diplomesMetiers[formation.intitule_long],
          toAdd: formation,
        })
      }
    }
  }
}

export default async function () {
  logger.info(" -- Start of DiplomesMetiers initializer -- ")

  logger.info(`Clearing diplomesmetiers...`)
  await DiplomesMetiers.deleteMany({})

  logger.info(`Début traitement`)

  await getIntitulesFormations()

  for (const k in diplomesMetiers) {
    diplomesMetiers[k].acronymes_intitule = buildAcronyms(diplomesMetiers[k].intitule_long)

    if (diplomesMetiers[k]?.codes_romes?.length) {
      const parsedDiplomeMetier = ZDiplomesMetiersNew.safeParse(diplomesMetiers[k])
      if (parsedDiplomeMetier.success) {
        await new DiplomesMetiers(parsedDiplomeMetier.data).save()
      } else {
        logger.error(`Mauvais format diplomesmetier pour le diplôme ${diplomesMetiers[k].intitule_long}`)
      }
    }
  }

  logger.info("Reloading diplomesMetiers cache")
  await initializeCacheDiplomas()

  logger.info(`Fin traitement`)
}
