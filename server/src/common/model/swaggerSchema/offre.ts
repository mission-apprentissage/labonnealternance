import { TRAINING_CONTRACT_TYPE, TRAINING_RYTHM } from "shared/constants/recruteur"
import { JOB_STATUS } from "shared/models"

export default {
  offre: {
    type: "array",
    default: [],
    items: {
      type: "object",
      properties: {
        libelle: {
          type: "string",
          description: "Libellé du métier concerné selon le référentiel La bonne alternance",
          required: true,
        },
        niveau: {
          type: "string",
          description: "Niveau de formation requis",
        },
        date_debut_apprentissage: {
          type: "string",
          description: "Date de début de l'alternance",
          required: true,
        },
        description: {
          type: "string",
          description: "Description de l'offre d'alternance",
        },
        romes: {
          type: "array",
          items: {
            type: "string",
          },
          description: "Liste des romes liés au métier",
          required: true,
        },
        rome_detail: {
          type: "object",
          description: "Détail du code ROME selon la nomenclature Pole emploi",
        },
        date_creation: {
          type: "string",
          default: "system",
          description: "Date de creation de l'offre",
        },
        date_expiration: {
          type: "string",
          default: "system",
          description: "Date d'expiration de l'offre",
        },
        relance_mail_sent: {
          type: "boolean",
          default: "system",
          description: "Statut de l'envoi du mail de relance avant expiration",
        },
        statut: {
          type: "string",
          default: JOB_STATUS.ACTIVE,
          enum: [Object.values(JOB_STATUS)],
          description: "Statut de l'offre",
        },
        type: {
          type: "array",
          items: {
            type: "string",
          },
          default: TRAINING_CONTRACT_TYPE.APPRENTISSAGE,
          enum: Object.values(TRAINING_CONTRACT_TYPE),
          description: "Type de contrat",
        },
        multi_diffuser: {
          type: "boolean",
          default: null,
          description: "Definit si l'offre est diffusée sur d'autres jobboard que La bonne alternance",
        },
        delegate: {
          type: "boolean",
          description: "Definit si l'entreprise souhaite déléguer l'offre à un CFA",
        },
        elligible_handicap: {
          type: "boolean",
          description: "Poste ouvert aux personnes en situation de handicap",
        },
        quantite: {
          type: "number",
          description: "Nombre de poste(s) ouvert(s) pour cette offre",
        },
        duree_contrat: {
          type: "number",
          description: "Durée du contrat en année",
        },
        rythme_alternance: {
          type: "string",
          enum: [...Object.values(TRAINING_RYTHM), null],
          description: "Répartition de la présence de l'alternant en formation/entreprise",
        },
      },
    },
  },
}
