import { IJob, JOB_STATUS } from "shared"

import { model, Schema } from "../../../mongodb"

export const jobsSchema = new Schema<IJob>(
  {
    rome_label: { type: String, default: null, description: "Libellé du métier concerné" },
    rome_appellation_label: { type: String, default: null, description: "Libellé de l'appelation ROME" },
    job_level_label: {
      type: String,
      default: null,
      description: "Niveau de formation visé en fin de stage",
    },
    job_start_date: {
      type: Date,
      default: null,
      description: "Date de début de l'alternance",
    },
    job_description: {
      type: String,
      default: null,
      description: "Description de l'offre d'alternance",
    },
    job_employer_description: {
      type: String,
      default: null,
      description: "Description de l'employer proposant l'offre d'alternance",
    },
    rome_code: {
      type: [String],
      default: [],
      description: "Liste des romes liés au métier",
    },
    rome_detail: {
      type: Object,
      default: null,
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
      default: null,
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
      default: JOB_STATUS.ACTIVE,
      enum: Object.values(JOB_STATUS),
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
    job_delegation_count: {
      type: Number,
      default: 0,
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
            require: true,
            description: "SIRET de l'établissement",
          },
          email: {
            type: String,
            require: true,
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
    stats_detail_view: {
      type: Number,
      description: "Nombre de vues de la page de détail",
    },
    stats_search_view: {
      type: Number,
      description: "Nombre de vues sur une page de recherche",
    },
  },
  {
    versionKey: false,
  }
)

export default model<IJob>("job", jobsSchema)
