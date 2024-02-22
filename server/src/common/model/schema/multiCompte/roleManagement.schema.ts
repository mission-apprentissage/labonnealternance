import { VALIDATION_UTILISATEUR } from "shared/constants/recruteur.js"
import { AccessEntityType, AccessStatus, IRoleManagement, IRoleManagementEvent } from "shared/models/roleManagement.model.js"

import { Schema } from "../../../mongodb.js"

import { buildMongooseModel } from "./buildMongooseModel.js"

const roleManagementEventSchema = new Schema<IRoleManagementEvent>(
  {
    validation_type: {
      type: String,
      enum: Object.values(VALIDATION_UTILISATEUR),
      description: "Indique si l'action est ordonnée par un utilisateur ou le serveur",
    },
    status: {
      type: String,
      enum: Object.values(AccessStatus),
      description: "Statut de l'accès",
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

const roleManagementSchema = new Schema<IRoleManagement>(
  {
    origin: {
      type: String,
      description: "Origine de la creation",
    },
    status: {
      type: [roleManagementEventSchema],
      description: "Evénements liés au cycle de vie de l'accès",
    },
    authorized_id: {
      type: String,
      description: "ID de l'entité sur laquelle l'accès est exercé",
    },
    authorized_type: {
      type: String,
      enum: Object.values(AccessEntityType),
      description: "Type de l'entité sur laquelle l'accès est exercé",
    },
    user_id: {
      type: String,
      description: "ID de l'utilisateur ayant accès",
    },
  },
  {
    timestamps: true,
  }
)

export const RoleManagement = buildMongooseModel(roleManagementSchema, "roleManagement")
