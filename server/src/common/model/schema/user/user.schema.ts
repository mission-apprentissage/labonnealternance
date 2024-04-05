import { IUser } from "shared"

import { model, Schema } from "../../../mongodb"
import { mongoosePagination, Pagination } from "../_shared/mongoose-paginate"

export const userSchema = new Schema<IUser>(
  {
    firstname: {
      type: String,
      default: null,
      description: "Le prénom du candidat",
    },
    lastname: {
      type: String,
      default: null,
      description: "Le nom du candidat",
    },
    phone: {
      type: String,
      default: null,
      description: "Le téléphone du candidat",
    },
    email: {
      type: String,
      default: null,
      description: "L'email du candidat",
      index: true,
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
      description: "Date de dernière candidature",
    },
  },
  {
    versionKey: false,
  }
)

userSchema.plugin(mongoosePagination)

export default model<IUser, Pagination<IUser>>("user", userSchema)
