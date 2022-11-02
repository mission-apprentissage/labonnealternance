import { logger } from "../logger.js";
import { getElasticInstance } from "../esClient/index.js";

const rebuildIndex = async (model, { skipNotFound } = { skipNotFound: false }) => {
  let client = getElasticInstance();
  let index = model.collection.collectionName; // Assume model name = index name

  logger.info(`Removing '${index}' index...`);
  try {
    await client.indices.delete({ index });
  } catch (err) {
    if (!skipNotFound) {
      throw err;
    }
  }

  logger.info(`Re-creating '${index}' index with mapping...`);
  let requireAsciiFolding = true;
  await model.createMapping(requireAsciiFolding); // this explicit call of createMapping insures that the geo points fields will be treated accordingly during indexing

  logger.info(`Syncing '${index}' index ...`);
  await model.synchronize();

  await client.indices.refresh({
    index,
  });
};

export { rebuildIndex };
