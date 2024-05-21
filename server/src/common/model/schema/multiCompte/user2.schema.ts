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
      index: true,
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
    origin: {
      type: String,
      description: "Origine de la creation de l'utilisateur (ex: Campagne mail, lien web, etc...) pour suivi",
    },
    status: {
      type: [userStatusEventSchema],
      description: "Evénements liés au cycle de vie de l'utilisateur",
    },
    first_name: {
      type: String,
      default: null,
      description: "Le prénom",
    },
    last_name: {
      type: String,
      default: null,
      description: "Le nom",
    },
    email: {
      type: String,
      default: null,
      description: "L'email",
      index: true,
      unique: true,
    },
    phone: {
      type: String,
      default: null,
      description: "Le numéro de téléphone",
    },
    last_action_date: {
      type: Date,
      default: null,
      description: "Date de dernière connexion",
      index: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
)

export const User2 = buildMongooseModel(User2Schema, "userswithaccount")
