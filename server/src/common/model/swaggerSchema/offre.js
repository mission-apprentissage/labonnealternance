export default {
  offre: {
    type: "array",
    default: [],
    items: {
      type: "object",
      properties: {
        libelle: {
          type: "string",
          description: "Libellé du métier concerné selon le référentiel La Bonne Alternance",
          required: true,
        },
        niveau: {
          type: "string",
          description: "Niveau de formation requis",
        },
        date_debut_apprentissage: {
          type: "string",
          description: "Date de début de l'apprentissage",
          required: true,
        },
        description: {
          type: "string",
          description: "Description de l'offre d'apprentissage",
        },
        romes: {
          type: "array",
          items: {
            type: "string",
          },
          description: "Liste des romes lié au métier",
          required: true,
        },
        rome_detail: {
          type: "object",
          description: "Détail du code ROME selon la nomenclature Pole Emploi",
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
          description: "Statut de l'envoie du mail de relance avant expiration",
        },
        statut: {
          type: "string",
          default: "Active",
          enum: ["Active", "Annulée", "Pourvue"],
          description: "Statut de l'offre",
        },
        type: {
          type: "array",
          items: {
            type: "string",
          },
          default: "Apprentissage",
          enum: ["Apprentissage", "Professionnalisation"],
          description: "Type de contrat",
        },
        multi_diffuser: {
          type: "boolean",
          default: null,
          description: "Definit si l'offre est diffusé sur d'autre jobboard que Matcha",
        },
        delegate: {
          type: "boolean",
          description: "Definit si l'entreprise souhaite déléger l'offre à un CFA",
        },
        elligible_handicap: {
          type: "boolean",
          description: "Poste ouvert au personnes en situation de handicap",
        },
        quantite: {
          type: "number",
          description: "Nombre de poste ouvert pour cette offre",
        },
        duree_contrat: {
          type: "number",
          description: "Durée du contrat en année",
        },
        rythme_alternance: {
          type: "string",
          enum: ["2 jours / 3 jours", "1 semaine / 1 semaine", "2 semaines / 3 semaines", "6 semaines / 6 semaines"],
          description: "Répartition de la présence de l'alternant en formation/entreprise",
        },
      },
    },
  },
};
