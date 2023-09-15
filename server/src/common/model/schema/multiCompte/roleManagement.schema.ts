import { Schema } from "../../../../common/mongodb.js"
import { VALIDATION_UTILISATEUR } from "../../../../services/constant.service.js"
import { buildMongooseModel } from "./buildMongooseModel.js"
import { AccessEntityType, AccessStatus, RoleManagement, RoleManagementEvent } from "./roleManagement.types.js"

const roleManagementEventSchema = new Schema<RoleManagementEvent>(
  {
    validation_type: {
      type: String,
      enum: Object.values(VALIDATION_UTILISATEUR),
      description: "Indique si l'action est ordonnée par un utilisateur ou le serveur",
    },
    status: {
      type: String,
      enum: Object.values(AccessStatus),
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

const roleManagementSchema = new Schema<RoleManagement>(
  {
    accessor_id: {
      type: String,
      description: "ID de l'entité ayant accès",
    },
    accessor_type: {
      type: String,
      enum: Object.values(AccessEntityType),
      description: "Type de l'entité ayant accès",
    },
    accessed_id: {
      type: String,
      description: "ID de l'entité sur laquelle l'accès est exercé",
    },
    accessed_type: {
      type: String,
      enum: Object.values(AccessEntityType),
      description: "Type de l'entité sur laquelle l'accès est exercé",
    },
    history: {
      type: [roleManagementEventSchema],
      description: "Evénements liés au cycle de vie de l'accès",
    },
    origin: {
      type: String,
      description: "Origine de la creation",
    },
  },
  {
    timestamps: true,
  }
)

export const roleManagementRepository = buildMongooseModel(roleManagementSchema, "roleManagement")
