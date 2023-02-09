import { nanoid } from "nanoid"
import { mongooseInstance } from "../../mongodb.js"
import { offreSchema } from "./offre.js"

export const formulaireSchema = mongooseInstance.Schema(
  {
    id_form: {
      type: String,
      default: () => nanoid(),
      description: "Identifiant de formulaire unique",
      index: true,
    },
    raison_sociale: {
      type: String,
      default: null,
      description: "Raison social de l'entreprise",
    },
    enseigne: {
      type: String,
      default: null,
      description: "Enseigne de l'entreprise",
    },
    siret: {
      type: String,
      default: null,
      description: "Numéro SIRET de l'entreprise",
    },
    adresse: {
      type: String,
      default: null,
      description: "Adresse de l'entreprise",
    },
    geo_coordonnees: {
      type: String,
      default: null,
      description: "Latitude/Longitude (inversion lié à LBA) de l'adresse de l'entreprise",
    },
    mandataire: {
      type: Boolean,
      default: false,
      description: "le formulaire est-il géré par un mandataire ?",
    },
    gestionnaire: {
      type: String,
      description: "Siret de l'organisme de formation gestionnaire des offres de l'entreprise",
    },
    nom: {
      type: String,
      default: null,
      description: "Nom du contact",
    },
    prenom: {
      type: String,
      default: null,
      description: "Prénom du contact",
    },
    telephone: {
      type: String,
      default: null,
      description: "Téléphone du contact",
    },
    email: {
      type: String,
      default: null,
      description: "Email du contact",
    },
    offres: [{ type: offreSchema, default: {}, description: "Liste des offres d'apprentissage" }],
    origine: {
      type: String,
      default: null,
      description: "Origine/organisme lié au formulaire",
    },
    opco: {
      type: String,
      description: "Information sur l'opco de l'entreprise",
    },
    idcc: {
      type: String,
      description: "Identifiant convention collective de l'entreprise",
    },
    statut: {
      type: String,
      enum: ["Actif", "Archivé", "En attente de validation"],
      default: "Actif",
      description: "Statut du formulaire",
    },
    code_naf: {
      type: String,
      description: "code NAF de l'entreprise",
    },
    libelle_naf: {
      type: String,
      description: "Libelle du code NAF de l'entreprise",
    },
    tranche_effectif: {
      type: String,
      description: "Tranche d'effectif salariale de l'entreprise",
    },
    date_creation_etablissement: {
      type: Date,
      description: "Date de creation de l'entreprise",
    },
  },
  {
    timestamps: true,
  }
)
