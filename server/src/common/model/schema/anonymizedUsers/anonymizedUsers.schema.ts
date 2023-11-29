import { IAnonymizedUser } from "shared/models/anonymizedUsers.model"

import { model, Schema } from "../../../mongodb"

export const anonymizedUsersSchema = new Schema<IAnonymizedUser>(
  {
    userId: {
      type: String,
      default: null,
      description: "L'identifiant de l'utilisateur provenant de la collection Users",
    },
    type: {
      type: String,
      enum: ["parent", "etudiant"],
      description: "Type d'utilisateur (parent, etudiant)",
    },
    role: {
      type: String,
      default: null,
      description: "candidat | cfa | administrator",
    },
    last_action_date: {
      type: Date,
      default: Date.now(),
      description: "Date de dernière action effectuée par l'utilisateur",
    },
  },
  {
    versionKey: false,
  }
)

export default model<IAnonymizedUser>("anonymized_user", anonymizedUsersSchema)
