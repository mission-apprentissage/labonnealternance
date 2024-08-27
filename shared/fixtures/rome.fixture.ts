import { ObjectId } from "bson"

import { IReferentielRome } from "../models"

export function generateReferentielRome(data: Partial<IReferentielRome>): IReferentielRome {
  return {
    _id: new ObjectId(),
    competences: {
      savoir_faire: [
        {
          libelle: "Production, Fabrication",
          items: [
            {
              libelle: "Procéder à l'enregistrement, au tri, à l'affranchissement du courrier",
              code_ogr: "101622",
              coeur_metier: "Principale",
            },
            {
              libelle: "Réaliser des travaux de reprographie",
              code_ogr: "113818",
              coeur_metier: null,
            },
          ],
        },
        {
          libelle: "Organisation",
          items: [
            {
              libelle: "Contrôler la conformité des données ou des documents",
              code_ogr: "300253",
              coeur_metier: null,
            },
          ],
        },
      ],
      savoir_etre_professionnel: [
        {
          libelle: "Faire preuve de rigueur et de précision",
          code_ogr: "300490",
          coeur_metier: null,
        },
      ],
      savoirs: [
        {
          libelle: "Normes et procédés",
          items: [
            {
              libelle: "Méthode de classement et d'archivage",
              code_ogr: "121411",
              coeur_metier: null,
            },
          ],
        },
      ],
    },

    numero: "8411Z",
    rome: {
      code_rome: "M1602",
      intitule: "Opérations administratives",
      code_ogr: "475",
    },
    definition: "Exécute des travaux administratifs courants",
    acces_metier: "Ce métier est accessible avec un diplôme de fin d'études secondaires",
    ...data,
  }
}
