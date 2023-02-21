import { Client } from "@elastic/elasticsearch"
import config from "../../config.js"
import mongoosastic from "./mongoosastic/index.js"

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

export { getElasticInstance, mongoosastic }
