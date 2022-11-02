export default {
  utilisateur: {
    type: "object",
    properties: {
      nom: {
        type: "string",
        description: "Nom de l'utilisateur",
      },
      prenom: {
        type: "string",
        description: "Prénom de l'utilisateur",
      },
      organization: {
        type: "string",
        description: "Organisme de l'utilisateur",
      },
      raison_sociale: {
        type: "string",
        description: "Raison social de l'établissement, déduit du SIRET",
      },
      siret: {
        type: "string",
        description: "Siret de l'établissement",
      },
      adresse: {
        type: "string",
        description: "Adresse de l'établissement, déduit du SIRET",
      },
      geo_coordonnees: {
        type: "string",
        description: "Latitude/Longitude de l'adresse de l'entreprise, déduit du SIRET",
      },
      telephone: {
        type: "string",
        description: "Téléphone de l'établissement",
      },
      email: {
        type: "string",
        description: "L'email de l'utilisateur",
        unique: true,
      },
      scope: {
        type: "string",
        description: "Scope accessible par l'utilisateur, déduit par l'application",
      },
      email_valide: {
        type: "boolean",
        default: false,
        description: "Indicateur de confirmation de l'adresse mail par l'utilisateur",
      },
      type: {
        type: "string",
        default: "CFA",
        description: "Type d'utilisateur, déduit par l'application",
      },
      last_connection: {
        type: "date",
        description: "Date de dernière connexion, déduit par l'application",
      },
    },
  },
};
