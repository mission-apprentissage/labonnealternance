import Sentry from "@sentry/node"
import { oleoduc, writeData } from "oleoduc"
import { countFormations, fetchFormations } from "../../common/components/catalogue.js"
import { getCurrentFormationsSourceIndex, updateFormationsIndexAlias, updateFormationsSourceIndex } from "../../common/components/indexSourceFormations.js"
import { getElasticInstance } from "../../common/esClient/index.js"
import { logger } from "../../common/logger.js"
import { ConvertedFormation_0, ConvertedFormation_1 } from "../../common/model/index.js"
import { mongooseInstance } from "../../common/mongodb.js"
import { rebuildIndex } from "../../common/utils/esUtils.js"

const resetIndexAndDb = async (index, model) => {
  let client = getElasticInstance()
  let requireAsciiFolding = true

  try {
    logger.info(`Clearing formations db...`)
    await model.deleteMany({})

    logger.info(`Removing formations index ${index} ...`)
    await client.indices.delete({ index })

    logger.info(`Creating formations index ...`)
    await model.createMapping(requireAsciiFolding)
  } catch (error) {
    logger.error(error)
  }
}

const importFormations = async ({ workIndex, workMongo, formationCount }) => {
  logger.info(`Début import`)

  const stats = {
    total: 0,
    created: 0,
    failed: 0,
  }

  try {
    const db = mongooseInstance.connection

    await oleoduc(
      await fetchFormations({ formationCount }),
      writeData(async (formation) => {
        stats.total++
        try {
          await db.collections[workIndex].insertOne(formation)
          stats.created++
        } catch (e) {
          stats.failed++
        }
      }),
      { parallel: 500 }
    )

    await rebuildIndex(workMongo)

    return stats
  } catch (e) {
    // stop here if not able to get trainings (keep existing ones)
    logger.error(`Error fetching formations from Catalogue ${workIndex}`, e)
    throw new Error("Error fetching formations from Catalogue")
  }
}

export default async function (onlyChangeMasterIndex = false) {
  let workIndex, workMongo

  logger.info(" -- Import formations catalogue -- ")

  try {
    const formationCount = await countFormations()

    logger.info(`${formationCount} à importer`)

    let stats = {
      total: 0,
      created: 0,
      failed: 0,
    }

    if (formationCount > 0) {
      const currentIndex = await getCurrentFormationsSourceIndex()

      logger.info(`Index courant : ${currentIndex}`)

      if (currentIndex === "convertedformation_0") {
        workIndex = "convertedformation_1"
        workMongo = ConvertedFormation_1
      } else {
        workIndex = "convertedformation_0"
        workMongo = ConvertedFormation_0
      }

      logger.info(`Début process sur : ${workIndex}`)

      if (!onlyChangeMasterIndex) {
        await resetIndexAndDb(workIndex, workMongo)

        stats = await importFormations({ workIndex, workMongo, formationCount })
      } else {
        logger.info(`Permutation d'index seule`)
      }

      const savedSource = await updateFormationsSourceIndex(workIndex)

      logger.info("Source mise à jour en base ", savedSource.currentIndex)

      const savedIndexAliasResult = await updateFormationsIndexAlias({
        masterIndex: workIndex,
        indexToUnAlias: currentIndex,
      })

      if (savedIndexAliasResult === "ok") {
        logger.info("Alias mis à jour dans l'ES ", workIndex)
      } else {
        logger.error("Alias pas mis à jour dans l'ES ", workIndex)
      }
    }
    logger.info(`Fin traitement`)

    return {
      result: "Import formations catalogue terminé",
      index_maitre: workIndex,
      nb_formations: stats.created,
      erreurs: stats.failed,
    }
  } catch (error) {
    Sentry.captureException(error)
    logger.error(error)
  }
}
