import { ObjectId } from "bson"

import { IReferentielRome } from "../models"

import { getFixtureValue } from "./fixture_helper"

export function generateReferentielRome(data: Partial<IReferentielRome>): IReferentielRome {
  return {
    _id: getFixtureValue(data, "_id", new ObjectId()),
    competences: getFixtureValue(data, "competences", {
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
    }),

    numero: getFixtureValue(data, "numero", "8411Z"),
    rome: getFixtureValue(data, "rome", {
      code_rome: "M1602",
      intitule: "Opérations administratives",
      code_ogr: "475",
    }),
    definition: getFixtureValue(data, "definition", "Exécute des travaux administratifs courants"),
    acces_metier: getFixtureValue(data, "acces_metier", "Ce métier est accessible avec un diplôme de fin d'études secondaires"),
    ...data,
  }
}
