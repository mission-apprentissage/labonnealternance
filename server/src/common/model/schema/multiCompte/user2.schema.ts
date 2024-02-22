import { VALIDATION_UTILISATEUR } from "shared/constants/recruteur.js"
import { IUser2, IUserStatusEvent, UserEventType } from "shared/models/user2.model.js"

import { Schema } from "../../../mongodb.js"

import { buildMongooseModel } from "./buildMongooseModel.js"

const userStatusEventSchema = new Schema<IUserStatusEvent>(
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
    granted_by: {
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

const User2Schema = new Schema<IUser2>(
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
    last_connection: {
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
    origin: {
      type: String,
      description: "Origine de la creation de l'utilisateur (ex: Campagne mail, lien web, etc...) pour suivi",
    },
  },
  {
    timestamps: true,
  }
)

export const user2Repository = buildMongooseModel(User2Schema, "user2")
