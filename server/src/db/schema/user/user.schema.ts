import { mongoosePagination, Pagination } from "mongoose-paginate-ts"
import { model, Schema } from "../../../common/mongodb.js"
import { IUser } from "./user.types.js"

export const userSchema = new Schema<IUser>({
  username: {
    type: String,
    default: null,
    description: "Le nom de l'utilisateur",
    unique: true,
  },
  password: {
    type: String,
    default: null,
    description: "Le mot de passe hashé",
  },
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
  is_anonymized: {
    type: Boolean,
    default: false,
    description: "Si l'enregistrement est anonymisé",
  },
})

userSchema.plugin(mongoosePagination)

export default model<IUser, Pagination<IUser>>("user", userSchema)
