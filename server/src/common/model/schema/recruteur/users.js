import { mongooseInstance } from "../../../mongodb.js";

const userValidationSchema = new mongooseInstance.Schema(
  {
    validation_type: {
      type: String,
      enum: ["AUTOMATIQUE", "MANUELLE"],
      description: "Processus de validation lors de l'inscription de l'utilisateur",
    },
    statut: {
      type: String,
      enum: ["EN ATTENTE DE VALIDATION", "VALIDÉ", "DESACTIVÉ"],
      description: "Statut de l'utilisateur",
    },
    motif: {
      type: String,
      description: "Raison du changement de statut",
    },
    user: {
      type: String,
      description: "Utilisateur ayant effectué la modification | SERVEUR si le compte a été validé automatiquement",
    },
    date: {
      type: Date,
      default: new Date(),
      description: "Date de l'évènement",
    },
  },
  { _id: false }
);

export const userRecruteur = mongooseInstance.Schema(
  {
    nom: {
      type: String,
      description: "Nom de l'utilisateur",
    },
    prenom: { type: String, description: "Prénom de l'utilisateur" },
    opco: {
      type: String,
      description: "Information sur l'opco de l'entreprise",
    },
    idcc: {
      type: String,
      description: "Identifiant convention collective de l'entreprise",
    },
    raison_sociale: {
      type: String,
      description: "Raison social de l'établissement",
    },
    enseigne: {
      type: String,
      default: null,
      description: "Enseigne de l'établissement",
    },
    siret: {
      type: String,
      description: "Siret de l'établissement",
    },
    adresse: {
      type: String,
      description: "Adresse de l'établissement",
    },
    geo_coordonnees: {
      type: String,
      default: null,
      description: "Latitude/Longitude de l'adresse de l'entreprise",
    },
    telephone: {
      type: String,
      description: "Téléphone de l'établissement",
    },
    email: {
      type: String,
      default: null,
      description: "L'email de l'utilisateur",
      unique: true,
    },
    isAdmin: {
      type: Boolean,
      default: false,
      description: "true si l'utilisateur est administrateur",
    },
    scope: {
      type: String,
      default: null,
      description: "Scope accessible par l'utilisateur",
    },
    email_valide: {
      type: Boolean,
      default: false,
      description: "Indicateur de confirmation de l'adresse mail par l'utilisateur",
    },
    type: {
      type: String,
      enum: ["ENTREPRISE", "CFA", "OPCO"],
      description: "Type d'utilisateur",
    },
    id_form: {
      type: String,
      description: "Si l'utilisateur est une entreprise, l'objet doit contenir un identifiant de formulaire unique",
    },
    last_connection: {
      type: Date,
      default: null,
      description: "Date de dernière connexion",
    },
    origine: {
      type: String,
      description: "Origine de la creation de l'utilisateur (ex: Campagne mail, lien web, etc...) pour suivi",
    },
    etat_utilisateur: {
      type: [userValidationSchema],
      description: "Tableau des modifications de statut de l'utilisateur",
    },
    qualiopi: {
      type: Boolean,
      default: true,
      description: "Statut qualiopi du CFA (forcément true, sinon l'inscription n'est pas possibe)",
    },
  },
  {
    timestamps: true,
  }
);
