const { Client } = require("@elastic/elasticsearch");
const ElasticsearchScrollStream = require("elasticsearch-scroll-stream");
const { transformObject, mergeStreams } = require("../utils/streamUtils");
const mongoosastic = require("./mongoosastic");
const config = require("config");

const getClientOptions = (envName) => {
  let node = { node: envName === "local" ? "http://localhost:9200" : "http://elasticsearch:9200" };

  return node;
};

const createEsInstance = () => {
  const options = getClientOptions(config.env);

  const client = new Client({
    ...options,
    maxRetries: 5,
    requestTimeout: 60000,
  });

  client.extend("searchDocumentsAsStream", () => {
    return (options) => {
      return mergeStreams(
        new ElasticsearchScrollStream(
          client,
          {
            scroll: "1m",
            size: "50",
            ...options,
          },
          ["_id"]
        ),
        transformObject((data) => {
          return JSON.parse(Buffer.from(data).toString());
        })
      );
    };
  });
  return client;
};
const clientDefault = createEsInstance();
const getElasticInstance = () => clientDefault;

let clientDomainesMetiers = createEsInstance("domainesmetiers");

const getDomainesMetiersES = () => {
  return clientDomainesMetiers;
};

module.exports = {
  getDomainesMetiersES,
  getElasticInstance,
  mongoosastic,
};
