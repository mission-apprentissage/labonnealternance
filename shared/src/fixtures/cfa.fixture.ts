import { ObjectId } from "bson"

import type { ICFA } from "../models/cfa.model.js"

export function generateCfaFixture(data: Partial<ICFA> = {}): ICFA {
  return {
    _id: new ObjectId(),
    geo_coordinates: "43.60705,3.874892",
    siret: "35306634300016",
    address: "28 BD DU JEU DE PAUME 34000 MONTPELLIER",
    address_detail: {
      academie: {
        code: "11",
        nom: "Montpellier",
      },
      code_insee: "34172",
      code_postal: "34000",
      departement: {
        code: "34",
        nom: "Hérault",
      },
      geojson: {
        geometry: {
          coordinates: [3.874892, 43.60705],
          type: "Point",
        },
        properties: {
          score: 0.7273000395256917,
          source: "geo-adresse-api",
        },
        type: "Feature",
      },
      label: "28 BD DU JEU DE PAUME 34000 MONTPELLIER",
      localite: "Montpellier",
      region: {
        code: "76",
        nom: "Occitanie",
      },
    },
    raison_sociale: "PERFORM COIFFURES",
    origin: "lba",
    createdAt: new Date("2024-05-03T12:22:59.141Z"),
    updatedAt: new Date("2024-05-03T12:57:13.974Z"),

    ...data,
  }
}
