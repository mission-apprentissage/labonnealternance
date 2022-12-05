import { getElasticInstance } from "../esClient/index.js"
import { logger } from "../logger.js"

export const rebuildIndex = async (model, { skipNotFound } = { skipNotFound: false }) => {
  const client = getElasticInstance()
  const index = model.collection.collectionName // Assume model name = index name

  logger.info(`Removing '${index}' index...`)
  try {
    await client.indices.delete({ index })
  } catch (err) {
    if (!skipNotFound) {
      throw err
    }
  }

  logger.info(`Re-creating '${index}' index with mapping...`)
  let requireAsciiFolding = true
  await model.createMapping(requireAsciiFolding) // this explicit call of createMapping insures that the geo points fields will be treated accordingly during indexing

  logger.info(`Syncing '${index}' index ...`)
  await model.synchronize()

  await client.indices.refresh({
    index,
  })
}

export const getNestedQueryFilter = (nested) => {
  const filters = nested.query.bool.must[0].bool.must

  let filt = filters
    .map((item) => {
      if (item.nested) {
        return item.nested.query.bool.should[0].terms
      }
    })
    .filter((x) => x !== undefined)
    .reduce((a, b) => Object.assign(a, b), {})

  return filt
}

export const resetIndexAndDb = async (index, model, { requireAsciiFolding = false }) => {
  const client = getElasticInstance()

  try {
    logger.info(`Clearing ${model} db...`)
    await model.deleteMany({})

    const { body: hasIndex } = await client.indices.exists({ index })
    if (hasIndex) {
      logger.info(`Removing ${index} index...`)
      await client.indices.delete({ index })
    }

    logger.info(`Creating ${index} with mapping ...`)
    await model.createMapping(requireAsciiFolding)
  } catch (error) {
    logger.error(error)
  }
}
