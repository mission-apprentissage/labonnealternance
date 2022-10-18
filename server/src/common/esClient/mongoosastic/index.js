/* eslint-disable no-unused-vars */
/* eslint-disable eqeqeq */
/* eslint-disable consistent-return */
/* eslint-disable no-empty */
/* eslint-disable no-continue */
/* eslint-disable no-await-in-loop */
/* eslint-disable no-async-promise-executor */
/* eslint-disable no-plusplus */
/* eslint-disable no-underscore-dangle */
/* eslint-disable no-param-reassign */
"use strict";

const serialize = require("./serialize");
const { oleoduc, writeData } = require("oleoduc");
const { logMessage } = require("../../utils/logMessage");

// https://www.elastic.co/guide/en/elasticsearch/client/javascript-api/current/bulk_examples.html

let isMappingNeedingGeoPoint = false;
const exclude = ["id", "__v", "_id"];

function timeout(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getProperties(type, instance = null, requireAsciiFolding = false) {
  // paramètre optionnel indiquant que la recherche sur le champ est insensible à la casse et aux accents
  const asciiFoldingParameters = requireAsciiFolding
    ? {
        analyzer: "folding",
        search_analyzer: "folding",
      }
    : {};

  if (type === "ObjectID" || type === "String")
    return {
      type: "text",
      fields: { keyword: { type: "keyword", ignore_above: 256 } },
      ...asciiFoldingParameters,
    };

  if (type === "Date") return { type: "date" };
  if (type === "Number") return { type: "long" };
  if (type === "Boolean") return { type: "boolean" };
  if (type === "Mixed") return { type: "nested" };

  if (type === "Array") {
    if (instance === "String") {
      return {
        type: "text",
        fields: { keyword: { type: "keyword", ignore_above: 256 } },
        ...asciiFoldingParameters,
      };
    }

    if (instance === "Mixed") {
      return { type: "nested" };
    }
  }
}

function getMapping(schema, requireAsciiFolding = false) {
  const properties = {};

  for (let i = 0; i < Object.keys(schema.paths).length; i++) {
    const key = Object.keys(schema.paths)[i];

    if (exclude.includes(key)) {
      continue;
    }
    const mongooseType = schema.paths[key].instance;
    const isSubDocument = typeof schema.paths[key].caster === "function";

    if (schema.paths[key].options.es_mapping) {
      properties[key] = schema.paths[key].options.es_mapping;
      continue;
    }

    if (/geo_/.test(key)) {
      properties[key] = { type: "geo_point" };
      isMappingNeedingGeoPoint = true;
    } else {
      if (isSubDocument) {
        properties[key] = { type: "nested", properties: {} };
        for (let i = 0; i < Object.keys(schema.paths[key].caster.schema.paths).length; i++) {
          const subDocumentKey = Object.keys(schema.paths[key].caster.schema.paths)[i];
          let { instance, caster } = schema.paths[key].caster.schema.paths[subDocumentKey];

          properties[key].properties[subDocumentKey] = getProperties(instance, caster?.instance, requireAsciiFolding);
        }
      } else {
        properties[key] = getProperties(mongooseType, schema.paths[key].caster?.instance, requireAsciiFolding);
      }
    }
  }

  return { properties };
}

/*
function getMapping(schema, requireAsciiFolding = false) {
  const properties = {};

  // paramètre optionnel indiquant que la recherche sur le champ est insensible à la casse et aux accents
  const asciiFoldingParameters = requireAsciiFolding
    ? {
        analyzer: "folding",
        search_analyzer: "folding",
      }
    : {};

  for (let i = 0; i < Object.keys(schema.paths).length; i++) {
    const key = Object.keys(schema.paths)[i];

    const exclude = ["id", "__v", "_id"];
    if (exclude.includes(key)) {
      continue;
    }
    const mongooseType = schema.paths[key].instance;

    if (schema.paths[key].options.es_mapping) {
      properties[key] = schema.paths[key].options.es_mapping;
      continue;
    }

    if (/geo_/.test(key)) {
      properties[key] = { type: "geo_point" };
      isMappingNeedingGeoPoint = true;
    } else {
      switch (mongooseType) {
        case "ObjectID":
        case "String": {
          properties[key] = {
            type: "text",
            fields: { keyword: { type: "keyword", ignore_above: 256 } },
            ...asciiFoldingParameters,
          };
          break;
        }
        case "Date":
          properties[key] = { type: "date" };
          break;
        case "Number":
          properties[key] = { type: "long" };
          break;
        case "Boolean":
          properties[key] = { type: "boolean" };
          break;

        case "Array":
          if (schema.paths[key].caster.instance === "String") {
            properties[key] = {
              type: "text",
              fields: { keyword: { type: "keyword", ignore_above: 256 } },
              ...asciiFoldingParameters,
            };
          }

          break;
        default:
          break;
      }
    }
  }

  return { properties };
}*/

function Mongoosastic(schema, options) {
  const { esClient } = options;

  const mapping = getMapping(schema);
  const indexName = options.index;
  const typeName = "_doc";

  // ElasticSearch Client
  schema.statics.esClient = esClient;

  schema.statics.createMapping = async function createMapping(requireAsciiFolding = false) {
    try {
      const exists = await esClient.indices.exists({ index: indexName });

      let includeTypeNameParameters =
        isMappingNeedingGeoPoint || requireAsciiFolding ? { include_type_name: true } : {};

      let asciiFoldingParameters = requireAsciiFolding
        ? {
            body: {
              settings: {
                analysis: {
                  analyzer: {
                    folding: {
                      tokenizer: "standard",
                      filter: ["lowercase", "asciifolding"],
                    },
                  },
                },
              },
            },
          }
        : {};

      if (!exists.body) {
        await esClient.indices.create({ index: indexName, ...includeTypeNameParameters, ...asciiFoldingParameters });
      }
      const completeMapping = {};
      completeMapping[typeName] = getMapping(schema, requireAsciiFolding);

      await esClient.indices.putMapping({
        index: indexName,
        type: typeName,
        body: completeMapping,
        ...includeTypeNameParameters,
      });
    } catch (e) {
      let errorMsg = e.message;
      if (e.meta && e.meta.body) errorMsg = e.meta.body.error;
      console.error("Error update mapping", errorMsg || e);
    }
  };

  schema.methods.index = function schemaIndex(refresh = true) {
    return new Promise(async (resolve, reject) => {
      try {
        const _opts = { index: indexName, type: typeName, refresh };
        _opts.body = serialize(this, mapping);
        _opts.id = this._id.toString();
        await esClient.index(_opts);
      } catch (e) {
        console.error(`Error index ${this._id.toString()}`, e.message || e, this);
        return reject();
      }
      resolve();
    });
  };

  schema.methods.unIndex = function schemaUnIndex() {
    return new Promise(async (resolve, reject) => {
      try {
        const _opts = { index: indexName, type: typeName, refresh: true };
        _opts.id = this._id.toString();

        let tries = 3;
        while (tries > 0) {
          try {
            await esClient.delete(_opts);
            return resolve();
          } catch (e) {
            console.error(e);
            await timeout(500);
            --tries;
          }
        }
      } catch (e) {
        console.error(`Error delete ${this._id.toString()}`, e.message || e);
        return reject();
      }
      resolve();
    });
  };

  schema.statics.synchronize = async function synchronize(filter = {}, refresh = false) {
    let count = 0;
    await oleoduc(
      this.find({}).cursor(),
      writeData(
        async (doc) => {
          await doc.index(refresh);
          if (++count % 1000 === 0) {
            logMessage("info", `${count} indexed`);
          }
        },
        { parallel: 8 }
      )
    );
  };

  schema.statics.unsynchronize = function unsynchronize() {
    return new Promise(async (resolve, reject) => {
      const exists = await esClient.indices.exists({ index: indexName });
      if (exists) {
        await esClient.indices.delete({ index: this.modelName });
      }
      resolve();
    });
  };

  function postRemove(doc) {
    if (doc) {
      const _doc = new doc.constructor(doc);
      return _doc.unIndex();
    }
  }

  function postSave(doc) {
    if (doc) {
      const _doc = new doc.constructor(doc);
      return _doc.index();
    }
  }

  /**
   * Use standard Mongoose Middleware hooks
   * to persist to Elasticsearch
   */
  function setUpMiddlewareHooks(inSchema) {
    inSchema.post("remove", postRemove);
    inSchema.post("findOneAndRemove", postRemove);

    inSchema.post("save", postSave);
    inSchema.post("findOneAndUpdate", postSave);

    inSchema.post("insertMany", (docs) => {
      return new Promise(async (resolve, reject) => {
        for (let i = 0; i < docs.length; i++) {
          try {
            await postSave(docs[i]);
          } catch (e) {}
        }
        resolve();
      });
    });
  }
  setUpMiddlewareHooks(schema);
}

module.exports = Mongoosastic;
