import mongoosePaginate from "mongoose-paginate"
import { getElasticInstance, mongoosastic } from "../esClient/index.js"
import schema from "../model/schema/index.js"
import { mongooseInstance } from "../mongodb.js"

const createModel = (modelName, descriptor, options = {}) => {
  const schema = new mongooseInstance.Schema(descriptor)

  if (options.esIndexName) {
    schema.plugin(mongoosastic, { esClient: getElasticInstance(), index: options.esIndexName })
  }

  if (options.esIndexName || options.paginate) {
    schema.plugin(mongoosePaginate)
  }

  if (options.createMongoDBIndexes) {
    options.createMongoDBIndexes(schema)
  }

  return mongooseInstance.model(modelName, schema)
}

const DomainesMetiers = createModel("domainesmetiers", schema.domainesMetiersSchema, {
  esIndexName: "domainesmetiers",
})
const FormationCatalogue = createModel("formationcatalogues", schema.mnaFormationSchema, {
  esIndexName: "formationcatalogues",
})
const DiplomesMetiers = createModel("diplomesmetiers", schema.diplomesMetiersSchema, {
  esIndexName: "diplomesmetiers",
})
const ApiCalls = createModel("apicalls", schema.apiCallSchema)
const Application = createModel("applications", schema.applicationSchema, {
  paginate: true,
})
const SourceFormations = createModel("sourceformations", schema.sourceFormationsSchema)
const GeoLocation = createModel("geolocation", schema.geoLocationSchema)
const EmailBlacklist = createModel("emailblacklist", schema.emailBlacklist)
const Opco = createModel("opco", schema.opco)
const BonnesBoites = createModel("bonnesboites", schema.bonneBoiteSchema, {
  esIndexName: "bonnesboites",
})
const User = createModel("user", schema.userSchema, { paginate: true })
const Appointment = createModel("appointment", schema.appointmentSchema, { paginate: true })
const WidgetParameter = createModel("widgetParameter", schema.widgetParameterSchema, { paginate: true })
const Etablissement = createModel("etablissement", schema.etablissementSchema, { paginate: true })
const ParcoursupEtablissementStat = createModel("parcoursupEtablissementStat", schema.parcoursupEtablissementStatSchema, { paginate: true })
const Formulaire = createModel("formulaire", schema.formulaireSchema, { esIndexName: "formulaires", paginate: true })
const Credential = createModel("credentials", schema.credentialSchema)
const Offre = createModel("offre", schema.offresSchema)
const Optout = createModel("optout", schema.optoutSchema, { paginate: true })
const ReferentielOpco = createModel("referentielOpco", schema.referentielOpcoSchema)
const UserRecruteur = createModel("userRecruteur", schema.userRecruteurSchema, { paginate: true })
const AppointmentDetailed = createModel("appointmentDetailed", schema.appointmentSchema)

export {
  DomainesMetiers,
  FormationCatalogue,
  DiplomesMetiers,
  ApiCalls,
  Application,
  SourceFormations,
  GeoLocation,
  EmailBlacklist,
  Opco,
  BonnesBoites,
  User,
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
  AppointmentDetailed,
}
