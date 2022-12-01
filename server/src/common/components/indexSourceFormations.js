import Sentry from "@sentry/node"
import { get } from "lodash-es"
import { getElasticInstance } from "../esClient/index.js"
import { logger } from "../logger.js"
import { ConvertedFormation_0, ConvertedFormation_1, SourceFormations } from "../model/index.js"

const esClient = getElasticInstance()

const getCurrentFormationsSourceIndex = async () => {
  try {
    const sourceFormation = await SourceFormations.find({})
    return sourceFormation[0]?.currentIndex || "convertedformation_1"
  } catch (err) {
    return "convertedformation_1"
  }
}

const getCurrentFormationsSourceCollection = async () => {
  try {
    const sourceFormation = await SourceFormations.find({})
    return sourceFormation[0]?.currentIndex === "convertedformation_1" ? ConvertedFormation_1 : ConvertedFormation_0
  } catch (err) {
    return ConvertedFormation_1
  }
}

const updateFormationsSourceIndex = async (newSource) => {
  try {
    let currentSourceFormation = await SourceFormations.find({})

    let sourceFormation = null

    if (currentSourceFormation && currentSourceFormation[0]) {
      sourceFormation = currentSourceFormation[0]
      sourceFormation.currentIndex = newSource
      sourceFormation.last_update_at = new Date()
    } else {
      sourceFormation = new SourceFormations({
        currentIndex: newSource,
      })
    }
    return await sourceFormation.save()
  } catch (err) {
    console.log("error saving formationSource ", err)
    throw new Error("Error updating Formation source index")
  }
}

const updateFormationsIndexAlias = async ({ masterIndex, indexToUnAlias }) => {
  try {
    await esClient.indices.putAlias({
      index: masterIndex,
      name: "convertedformations",
    })
    await esClient.indices.deleteAlias({
      index: indexToUnAlias,
      name: "convertedformations",
    })

    return "ok"
  } catch (err) {
    Sentry.captureException(err)
    let error_msg = get(err, "meta.body") ?? err.message

    if (typeof error_msg === "object") {
      error_msg = JSON.stringify(error_msg, null, 2)
    }

    if (get(err, "meta.meta.connection.status") === "dead") {
      logger.error(`Error updating formations Alias. Elastic search is down or unreachable. error_message=${error_msg}`)
    } else {
      logger.error(`Error updating formations Alias. error_message=${error_msg}`)
    }

    return error_msg
  }
}

export { getCurrentFormationsSourceIndex, getCurrentFormationsSourceCollection, updateFormationsSourceIndex, updateFormationsIndexAlias }
