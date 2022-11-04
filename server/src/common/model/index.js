import mongoosePaginate from "mongoose-paginate";
import { getElasticInstance, mongoosastic } from "../esClient/index.js";
import schema from "../model/schema/index.js";
import { mongooseInstance } from "../mongodb.js";

const createModel = (modelName, descriptor, options = {}) => {
  const schema = new mongooseInstance.Schema(descriptor);

  if (options.esIndexName) {
    schema.plugin(mongoosastic, { esClient: getElasticInstance(), index: options.esIndexName });
  }

  if (options.esIndexName || options.paginate) {
    schema.plugin(mongoosePaginate);
  }

  if (options.createMongoDBIndexes) {
    options.createMongoDBIndexes(schema);
  }

  return mongooseInstance.model(modelName, schema);
};

const DomainesMetiers = createModel("domainesmetiers", schema.domainesMetiersSchema, {
  esIndexName: "domainesmetiers",
});
const ConvertedFormation_0 = createModel("convertedformation_0", schema.mnaFormationSchema, {
  esIndexName: "convertedformation_0",
});
const ConvertedFormation_1 = createModel("convertedformation_1", schema.mnaFormationSchema, {
  esIndexName: "convertedformation_1",
});
const DiplomesMetiers = createModel("diplomesmetiers", schema.diplomesMetiersSchema, {
  esIndexName: "diplomesmetiers",
});
const ApiCalls = createModel("apicalls", schema.apiCallSchema);
const Application = createModel("applications", schema.applicationSchema, {
  paginate: true,
});
const SourceFormations = createModel("sourceformations", schema.sourceFormationsSchema);
const GeoLocation = createModel("geolocation", schema.geoLocationSchema);
const EmailBlacklist = createModel("emailblacklist", schema.emailBlacklist);
const Opco = createModel("opco", schema.opco);
const BonnesBoites = createModel("bonnesboites", schema.bonneBoiteSchema, {
  esIndexName: "bonnesboites",
});
const User = createModel("user", schema.userSchema, { paginate: true });
const UserEvent = createModel("userEvents", schema.userSchema, { paginate: true });
const Appointment = createModel("appointment", schema.appointmentSchema, { paginate: true });
const WidgetParameter = createModel("widgetParameter", schema.widgetParameterSchema, { paginate: true });
const Etablissement = createModel("etablissement", schema.etablissementSchema, { paginate: true });
const ParcoursupEtablissementStat = createModel(
  "parcoursupEtablissementStat",
  schema.parcoursupEtablissementStatSchema,
  { paginate: true }
);
const Formulaire = createModel("formulaire", schema.formulaireSchema, { esIndexName: "formulaires", paginate: true });
const Credential = createModel("credentials", schema.credentialsSchema);
const Offre = createModel("offre", schema.offresSchema);
const Optout = createModel("optout", schema.OptoutSchema, { paginate: true });
const ReferentielOpco = createModel("referentielOpco", schema.ReferentielOpco);
const UserRecruteur = createModel("userRecruteur", schema.userRecruteur, { paginate: true });

export {
  DomainesMetiers,
  ConvertedFormation_0,
  ConvertedFormation_1,
  DiplomesMetiers,
  ApiCalls,
  Application,
  SourceFormations,
  GeoLocation,
  EmailBlacklist,
  Opco,
  BonnesBoites,
  User,
  UserEvent,
  Appointment,
  WidgetParameter,
  Etablissement,
  ParcoursupEtablissementStat,
  Formulaire,
  Credential,
  Offre,
  Optout,
  ReferentielOpco,
  UserRecruteur,
};
