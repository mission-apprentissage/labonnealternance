import { model, Schema } from "../../../mongodb.js"
import { IJobs } from "./jobs.types.js"

const MAPPING_TOBEREMOVED = {
  libelle: "rome_label",
  niveau: "job_level_label",
  date_debut_apprentissage: "job_start_date",
  description: "job_description",
  romes: "rome_code",
  rome_detail: "",
  date_creation: "job_creation_date",
  date_expiration: "job_expiration_date",
  date_mise_a_jour: "job_update_date",
  date_derniere_prolongation: "job_last_prolongation_date",
  nombre_prolongation: "job_prolongation_count",
  statut: "job_status",
  raison_statut: "job_status_comment",
  type: "job_type",
  multi_diffuser: "is_multi_published",
  delegate: "is_delegated",
  number_of_delegations: "job_delegation_count",
  elligible_handicap: "is_disabled_elligible",
  quantite: "job_count",
  duree_contrat: "job_duration",
  rythme_alternance: "job_rythm",
  custom_adress: "custom_address",
  custom_gps_coordinates: "custom_geo_coordinates",

  rome_appellation_label: "", // already renamed
  relance_mail_sent: "", // to delete

  delegations: "",
  items: "",
  properties: "",
  siret: "siret_code",
  email: "",
  cfa_read_company_detail_at: "",
}

export const jobsSchema = new Schema<IJobs>({
  rome_label: { type: String, default: null, description: "Libellé du métier concerné" },
  rome_appellation_label: { type: String, default: null, description: "Libellé de l'appelation ROME" },
  job_level_label: {
    type: String,
    default: null,
    description: "Niveau de formation requis",
  },
  job_start_date: {
    type: Date,
    default: null,
    description: "Date de début de l'alternance",
  },
  job_description: {
    type: String,
    description: "Description de l'offre d'alternance",
  },
  rome_code: {
    type: [String],
    default: [],
    description: "Liste des romes liés au métier",
  },
  rome_detail: {
    type: Object,
    description: "Détail du code ROME selon la nomenclature Pole emploi",
  },
  job_creation_date: {
    type: Date,
    default: null,
    description: "Date de creation de l'offre",
  },
  job_expiration_date: {
    type: Date,
    default: null,
    description: "Date d'expiration de l'offre",
  },
  job_update_date: {
    type: Date,
    default: Date.now,
    description: "Date de dernière mise à jour de l'offre",
  },
  job_last_prolongation_date: {
    type: Date,
    description: "Date de dernière prolongation de l'offre",
  },
  job_prolongation_count: {
    type: Number,
    default: 0,
    description: "Nombre de fois où l'offre a été prolongée",
  },
  relance_mail_sent: {
    type: Boolean,
    default: false,
    description: "Statut de l'envoi du mail de relance avant expiration",
  },
  job_status: {
    type: String,
    default: "Active",
    enum: ["Active", "Annulée", "Pourvue", "En attente"],
    description: "Statut de l'offre",
  },
  job_status_comment: {
    type: String,
    description: "Raison de la suppression de l'offre",
  },
  job_type: {
    type: [String],
    default: "Apprentissage",
    enum: ["Apprentissage", "Professionnalisation"],
    description: "Type de contrat",
  },
  is_multi_published: {
    type: Boolean,
    default: null,
    description: "Definit si l'offre est diffusée sur d'autres jobboard que La bonne alternance",
  },
  is_delegated: {
    type: Boolean,
    description: "Definit si l'entreprise souhaite déléguer l'offre à un CFA",
  },
  job_delegation_count: {
    type: Number,
    description: "Nombre de délégations",
  },
  delegations: {
    type: Array,
    description: "Liste des délégations",
    required: false,
    items: {
      type: Object,
      required: false,
      properties: {
        siret_code: {
          type: String,
          default: null,
          description: "SIRET de l'établissement",
        },
        email: {
          type: String,
          default: null,
          description: "Email gestionnaire de l'établissement",
        },
        cfa_read_company_detail_at: {
          type: Date,
          default: null,
          description: "Date de consultation de l'offre",
        },
      },
    },
  },
  is_disabled_elligible: {
    type: Boolean,
    description: "Poste ouvert aux personnes en situation de handicap",
  },
  job_count: {
    type: Number,
    description: "Nombre de poste(s) ouvert(s) pour cette offre",
  },
  job_duration: {
    type: Number,
    description: "Durée du contrat en année",
  },
  job_rythm: {
    type: String,
    description: "Répartition de la présence de l'alternant en formation/entreprise",
  },
  custom_address: {
    type: String,
    default: null,
    description: "Adresse personnalisée de l'entreprise",
  },
  custom_geo_coordinates: {
    type: String,
    default: null,
    description: "Latitude/Longitude de l'adresse personnalisée de l'entreprise",
  },
})

export default model<IJobs>("job", jobsSchema)
