export const appointmentSchema = {
  candidat_id: {
    type: String,
    default: null,
    description: "Id candidat",
  },
  numero_de_la_demande: {
    type: String,
    default: null,
    description: "Le numéro de la demande",
  },
  motivations: {
    type: String,
    default: null,
    required: false,
    description: "Les motivations du candidat",
  },
  etablissement_id: {
    type: String,
    default: null,
    description: "L'identifiant de l'établissement",
  },
  formation_id: {
    type: String,
    default: null,
    description: "L'identifiant de la formation",
  },
  referrer: {
    type: String,
    default: null,
    description: "Le nom du site parent",
  },
  referrer_link: {
    type: String,
    default: null,
    description: "L'url du site parent",
  },
  statut_general: {
    type: String,
    default: "ouverte",
    description: "Description plus générale sur l'état de la demande (ouverte, finie, probleme)",
  },
  champs_libre_status: {
    type: String,
    default: null,
    description: "Champs libre qui sert de notes sur le statut",
  },
  champs_libre_commentaire: {
    type: String,
    default: null,
    description: "Champs libre qui sert de notes supplémentaires",
  },
  cfa_pris_contact_candidat: {
    type: Boolean,
    default: false,
    description: "Le cfa a t'il pris contact avec le candidat ?",
  },
  cfa_pris_contact_candidat_date: {
    type: Date,
    default: null,
    description: "La date de la première prise de contact du cfa vers le candidat",
  },
  cfa_read_appointment_details_at: {
    type: Date,
    default: null,
    description: "Date à laquelle le CFA à consulté la page contenant les informations du rendez et du candidat",
  },
  candidat_contacted_at: {
    type: Date,
    default: null,
    description: "Date à laquelle le candidat à signalé qu'il a été contacté par le CFA",
  },
  candidat_mailing: {
    type: "array",
    description: "Liste des évènements MAIL récupéré par le serveur",
    required: false,
    items: {
      type: "object",
      required: false,
      properties: {
        campaign: {
          type: "string",
          default: null,
          description: "Identifiant de campagne",
        },
        message_id: {
          type: "string",
          default: null,
          description: "Identifiant Sendinblue",
        },
        status: {
          type: "string",
          default: null,
          description: "Code erreur Sendinblue",
        },
        webhook_status_at: {
          type: Date,
          default: null,
          description: "Date fournie par les webhooks Sendinblue lors de la réception d'un event",
        },
        email_sent_at: {
          type: Date,
          default: null,
          description: "Date de création de la collection",
        },
      },
    },
  },
  cfa_mailing: {
    type: "array",
    description: "Liste des évènements MAIL récupéré par le serveur",
    required: false,
    items: {
      type: "object",
      required: false,
      properties: {
        campaign: {
          type: "string",
          default: null,
          description: "Identifiant de campagne",
        },
        message_id: {
          type: "string",
          default: null,
          description: "Identifiant Sendinblue",
        },
        status: {
          type: "string",
          default: null,
          description: "Code erreur Sendinblue",
        },
        webhook_status_at: {
          type: Date,
          default: null,
          description: "Date fournie par les webhooks Sendinblue lors de la réception d'un event",
        },
        email_sent_at: {
          type: Date,
          default: null,
          description: "Date de création de la collection",
        },
      },
    },
  },
  email_premiere_demande_candidat_date: {
    type: Date,
    default: null,
    description: "Date d'envoi du premier email au candidat",
  },
  email_premiere_demande_candidat_message_id: {
    type: String,
    default: null,
    description: "Identifiant externe du mail envoyé au candidat",
  },
  email_premiere_demande_candidat_statut: {
    type: String,
    default: null,
    description: "Statut du mail envoyé au candidat",
  },
  email_premiere_demande_candidat_statut_date: {
    type: Date,
    default: null,
    description: "Date du dernier statut",
  },
  email_premiere_demande_cfa_date: {
    type: Date,
    default: null,
    description: "Date d'envoi du premier email au cfa",
  },
  email_premiere_demande_cfa_message_id: {
    type: String,
    default: null,
    description: "Identifiant externe du mail envoyé au CFA",
  },
  email_premiere_demande_cfa_statut: {
    type: String,
    default: null,
    description: "Statut du mail envoyé au CFA",
  },
  email_premiere_demande_cfa_statut_date: {
    type: Date,
    default: null,
    description: "Date du dernier statut",
  },
  id_rco_formation: {
    type: String,
    default: null,
    description: "Id RCO formation",
  },
  cle_ministere_educatif: {
    type: String,
    default: null,
    description: "Identifiant unique d'une formation",
  },
  created_at: {
    type: Date,
    default: Date.now,
    description: "La date création de la demande",
  },
  last_update_at: {
    type: Date,
    default: Date.now,
    description: "Date de dernières mise à jour",
  },
  email_cfa: {
    type: String,
    required: false,
    default: null,
    description: "Adresse email CFA",
  },
}
