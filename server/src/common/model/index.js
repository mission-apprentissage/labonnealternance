import { mongooseInstance } from "../mongodb.js";
import { mongoosastic, getElasticInstance } from "../esClient/index.js";
import schema from "../model/schema/index.js";

const createModel = (modelName, descriptor, options = {}) => {
  const schema = new mongooseInstance.Schema(descriptor);

  if (options.esIndexName) {
    schema.plugin(mongoosastic, { esClient: getElasticInstance(), index: options.esIndexName });
  }

  if (options.esIndexName || options.paginate) {
    schema.plugin(require("mongoose-paginate"));
  }

  if (options.createMongoDBIndexes) {
    options.createMongoDBIndexes(schema);
  }

  return mongooseInstance.model(modelName, schema);
};

export const DomainesMetiers = createModel("domainesmetiers", schema.domainesMetiersSchema, {
  esIndexName: "domainesmetiers",
});

export const ConvertedFormation_0 = createModel("convertedformation_0", schema.mnaFormationSchema, {
    esIndexName: "convertedformation_0",
  });

export const ConvertedFormation_1 = createModel("convertedformation_1", schema.mnaFormationSchema, {
    esIndexName: "convertedformation_1",
  });

export const DiplomesMetiers = createModel("diplomesmetiers", schema.diplomesMetiersSchema, {
  esIndexName: "diplomesmetiers",
});

export const ApiCalls = createModel("apicalls", schema.apiCallSchema);

export const Application = createModel("applications", schema.applicationSchema, {
    paginate: true,
});
  
export const SourceFormations = createModel("sourceformations", schema.sourceFormationsSchema);

export const GeoLocation = createModel("geolocation", schema.geoLocationSchema);
  
export const EmailBlacklist = createModel("emailblacklist", schema.emailBlacklist);
  
export const Opco = createModel("opco", schema.opco);

export const BonnesBoites = createModel("bonnesboites", schema.bonneBoiteSchema, {
    esIndexName: "bonnesboites",
  });