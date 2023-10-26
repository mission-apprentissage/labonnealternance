import { Client, RequestParams } from "@elastic/elasticsearch"
import { Model } from "mongoose"

import { startSentryPerfRecording } from "@/http/sentry"

import config from "../../config"
import { mongooseInstance } from "../mongodb"

import mongoosastic from "./mongoosastic/index"

const createEsInstance = () => {
  const client = new Client({
    node: config.env === "local" ? "http://localhost:9200" : "http://elasticsearch:9200",
    maxRetries: 5,
    requestTimeout: 60000,
  })

  return client
}

const clientDefault = createEsInstance()
const getElasticInstance = () => clientDefault

async function closeElasticSearch() {
  await clientDefault?.close()
}

async function search<T>(options: RequestParams.Search, model: Model<T>): Promise<any[]> {
  const onEnd = startSentryPerfRecording("elasticsearch", "search", options)
  const searchResults = await clientDefault.search(options)
  let results = searchResults.body.hits.hits
  if (config.env === "preview") {
    // Some collection doesn't have _id as ObjectId but string
    const ids = results.flatMap((hit) => [mongooseInstance.Types.ObjectId(hit._id), hit._id])

    // Make sure we drop not found ids
    const foundIds = await model.collection.find({ _id: { $in: ids } }, { projection: { _id: 1 } }).toArray()
    const idSet = new Set(foundIds.map((f) => f._id.toString()))
    results = results.filter((h) => idSet.has(h._id))
  }
  onEnd()
  return results
}

export { getElasticInstance, mongoosastic, closeElasticSearch, search }
