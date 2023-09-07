import { OPCOS, VALIDATION_UTILISATEUR } from "../../../../services/constant.service.js"
import { Schema } from "../../../../common/mongodb.js"
import { User2, UserEventType, UserStatusEvent } from "./user2.types.js"
import { buildMongooseModel } from "./buildMongooseModel.js"

const userStatusEventSchema = new Schema<UserStatusEvent>(
  {
    validation_type: {
      type: String,
      enum: Object.values(VALIDATION_UTILISATEUR),
      description: "Indique si l'action est ordonnée par un utilisateur ou le serveur",
    },
    status: {
      type: String,
      enum: Object.values(UserEventType),
      description: "Statut de l'utilisateur",
    },
    reason: {
      type: String,
      description: "Raison du changement de statut",
    },
    grantedBy: {
      type: String,
      default: null,
      description: "Utilisateur à l'origine du changement",
    },
    date: {
      type: Date,
      default: () => new Date(),
      description: "Date de l'évènement",
    },
  },
  { _id: false }
)

const User2Schema = new Schema<User2>(
  {
    firstname: {
      type: String,
      default: null,
      description: "Le prénom",
    },
    lastname: {
      type: String,
      default: null,
      description: "Le nom",
    },
    phone: {
      type: String,
      default: null,
      description: "Le numéro de téléphone",
    },
    email: {
      type: String,
      default: null,
      description: "L'email",
    },
    isAdmin: {
      type: Boolean,
      default: null,
      description: "Si true, l'utilisateur a les droits d'administration",
    },
    opco: {
      type: Boolean,
      enum: Object.values(OPCOS),
      default: null,
      description: "Si rempli, donne les droits d'un OPCO",
    },
    lastConnection: {
      type: Date,
      default: null,
      description: "Date de dernière connexion",
    },
    is_anonymized: {
      type: Boolean,
      default: false,
      description: "Si l'enregistrement est anonymisé",
    },
    history: {
      type: [userStatusEventSchema],
      description: "Evénements liés au cycle de vie de l'utilisateur",
    },
  },
  {
    timestamps: true,
  }
)

export const user2Repository = buildMongooseModel(User2Schema, "user2")
