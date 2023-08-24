import { mongoosePagination, Pagination } from "mongoose-paginate-ts"
import { model, Schema } from "../../../mongodb.js"
import { IUserRecruteur, IUserStatusValidation } from "./userRecruteur.types.js"

const userValidationSchema = new Schema<IUserStatusValidation>(
  {
    validation_type: {
      type: String,
      enum: ["AUTOMATIQUE", "MANUELLE"],
      description: "Processus de validation lors de l'inscription de l'utilisateur",
    },
    status: {
      type: String,
      enum: ["EN ATTENTE DE VALIDATION", "VALIDÉ", "DESACTIVÉ"],
      description: "Statut de l'utilisateur",
    },
    reason: {
      type: String,
      description: "Raison du changement de statut",
    },
    user: {
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

const userRecruteurSchema = new Schema<IUserRecruteur>(
  {
    last_name: {
      type: String,
      description: "Nom de l'utilisateur",
    },
    first_name: {
      type: String,
      description: "Prénom de l'utilisateur",
    },
    opco: {
      type: String,
      description: "Information sur l'opco de l'entreprise",
    },
    idcc: {
      type: String,
      description: "Identifiant convention collective de l'entreprise",
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
    establishment_siret: {
      type: String,
      description: "Siret de l'établissement",
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
    phone: {
      type: String,
      description: "Téléphone de l'établissement",
    },
    email: {
      type: String,
      default: null,
      description: "L'email de l'utilisateur",
      unique: true,
    },
    scope: {
      type: String,
      default: null,
      description: "Scope accessible par l'utilisateur",
    },
    is_email_checked: {
      type: Boolean,
      default: false,
      description: "Indicateur de confirmation de l'adresse mail par l'utilisateur",
    },
    type: {
      type: String,
      enum: ["ENTREPRISE", "CFA", "OPCO", "ADMIN"],
      description: "Type d'utilisateur",
    },
    establishment_id: {
      type: String,
      description: "Si l'utilisateur est une entreprise, l'objet doit contenir un identifiant de formulaire unique",
    },
    last_connection: {
      type: Date,
      default: null,
      description: "Date de dernière connexion",
    },
    origin: {
      type: String,
      description: "Origine de la creation de l'utilisateur (ex: Campagne mail, lien web, etc...) pour suivi",
    },
    status: {
      type: [userValidationSchema],
      description: "Tableau des modifications de statut de l'utilisateur",
    },
    is_qualiopi: {
      type: Boolean,
      default: true,
      description: "Statut qualiopi du CFA (forcément true, sinon l'inscription n'est pas possibe)",
    },
  },
  {
    timestamps: true,
  }
)

userRecruteurSchema.plugin(mongoosePagination)

export default model<IUserRecruteur, Pagination<IUserRecruteur>>("userRecruteur", userRecruteurSchema)
