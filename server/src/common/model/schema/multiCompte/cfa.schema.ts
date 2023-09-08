import { VALIDATION_UTILISATEUR } from "../../../../services/constant.service.js"
import { Schema } from "../../../mongodb.js"
import { buildMongooseModel } from "./buildMongooseModel.js"
import { CFA, CFAStatusEvent, CFAStatusEventType } from "./cfa.types.js"

const validationSchema = new Schema<CFAStatusEvent>(
  {
    validation_type: {
      type: String,
      enum: Object.values(VALIDATION_UTILISATEUR),
      description: "Indique si l'événement est déclenché de manière automatique ou par un utilisateur",
    },
    status: {
      type: String,
      enum: Object.values(CFAStatusEventType),
      description: "nouveau status",
    },
    reason: {
      type: String,
      description: "Raison du changement de statut",
    },
    granted_by: {
      type: String,
      description: "Utilisateur ayant effectué la modification | SERVEUR si le compte a été validé automatiquement",
    },
    date: {
      type: Date,
      default: () => new Date(),
      description: "Date de l'évènement",
    },
  },
  { _id: false }
)

const cfaSchema = new Schema<CFA>(
  {
    establishment_siret: {
      type: String,
      description: "Siret de l'établissement",
    },
    establishment_raison_sociale: {
      type: String,
      description: "Raison social de l'établissement",
    },
    establishment_enseigne: {
      type: String,
      default: null,
      description: "Enseigne de l'établissement",
    },
    address_detail: {
      type: Object,
      description: "Detail de l'adresse de l'établissement",
    },
    address: {
      type: String,
      description: "Adresse de l'établissement",
    },
    geo_coordinates: {
      type: String,
      default: null,
      description: "Latitude/Longitude de l'adresse de l'entreprise",
    },
    origin: {
      type: String,
      description: "Origine de la creation (ex: Campagne mail, lien web, etc...) pour suivi",
    },
    is_qualiopi: {
      type: Boolean,
      default: true,
      description: "Statut qualiopi du CFA (forcément true, sinon l'inscription n'est pas possibe)",
    },
    history: {
      type: [validationSchema],
      description: "Tableau des modifications de statut",
    },
  },
  {
    timestamps: true,
  }
)

export const cfaRepository = buildMongooseModel(cfaSchema, "cfa")
