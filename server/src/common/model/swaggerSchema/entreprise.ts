import offre from "./offre.js"

export default {
  entreprise: {
    type: "object",
    properties: {
      id_form: {
        type: "string",
        description: "Identifiant de formulaire unique, déduit par l'application",
      },
      raison_sociale: {
        type: "string",
        description: "Raison social de l'entreprise, déduit par l'application",
      },
      siret: {
        type: "string",
        required: true,
        description: "Numéro SIRET de l'entreprise",
      },
      adresse: {
        type: "string",
        description: "Adresse de l'entreprise, déduit par l'application",
      },
      geo_coordonnees: {
        type: "string",
        description: "Longitude/Latitude de l'adresse de l'entreprise, déduit par l'application",
      },
      nom: {
        type: "string",
        required: true,
        description: "Nom du contact",
      },
      prenom: {
        type: "string",
        required: true,
        description: "Prénom du contact",
      },
      telephone: {
        type: "string",
        required: true,
        description: "Téléphone du contact",
      },
      email: {
        type: "string",
        required: true,
        description: "Email du contact",
      },
      gestionnaire: {
        type: "string",
        description: "SIRET du CFA/OF gestionnaire de l'entreprise, déduit par l'application",
      },
      mandataire: {
        type: "boolean",
        description: "L'entreprise est géré ou non par un CFA, déduit par l'application",
      },
      mailing: {
        type: "array",
        description: "Liste des évènements MAIL récupéré par le serveur",
        items: {
          type: "object",
          required: false,
          properties: {
            campagne: {
              type: "string",
              default: "string",
              description: "Identifiant de campagne",
            },
            messageId: {
              type: "string",
              default: "string",
              description: "Identifiant sendinblue",
            },
            code: {
              type: "string",
              default: "string",
              description: "Code erreur sendinblue",
            },
            message: {
              type: "string",
              default: "string",
              description: "Message erreur sendinblue",
            },
          },
        },
      },
      events: {
        type: "array",
        description: "Liste des évènements sendinblue géré par le serveur",
      },
      origine: {
        type: "string",
        description: "Origine/organisme lié au formulaire, déduit par l'application",
      },
      offres: { ...offre, description: "Liste de(s) offre(s) rattachée(s)" },
      opco: {
        type: "string",
        description: "OPCO de rattachement de l'entreprise, déduit par l'application",
      },
      statut: {
        type: "string",
        enum: ["Actif", "Archivé", "En attente de validation"],
        default: "Actif",
        description: "Statut de l'entreprise",
      },
    },
  },
}
