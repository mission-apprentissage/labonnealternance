import { model, Schema } from "../../../mongodb"

import { IAccessLog } from "./accessLog.types"

export const accessLogSchema = new Schema<IAccessLog>(
  {
    status: {
      type: String,
      default: null,
      description: "Statut de l'access log",
    },
    user_id: {
      type: String,
      default: null,
      description: "L'identifiant de l'utilisateur",
    },
    user_email: {
      type: String,
      default: null,
      description: "l'adresse email de l'utilisateur",
    },
    user_type: {
      type: String,
      default: null,
      description: "le type d'utilisateur",
    },
    auth_type: {
      type: String,
      default: null,
      description: "Type d'auth",
    },
    role: {
      type: String,
      default: null,
      description: "Rôle",
    },
    parameters: {
      type: Object,
      default: null,
      description: "paramètres",
    },
    http_method: {
      type: String,
      default: null,
      description: "HTTP method",
    },
    path: {
      type: String,
      default: null,
      description: "",
    },
    ressurces: {
      type: Object,
      default: null,
      description: "Ressources autorisées",
    },
    ip: {
      type: String,
      default: null,
      description: "",
    },
    created_at: {
      type: Date,
      default: Date.now,
      description: "Date d'ajout en base de données",
    },
  },
  {
    versionKey: false,
  }
)

export default model<IAccessLog>("accesslogs", accessLogSchema)
