import { ObjectId } from "bson"

import { IReferentielCommune } from "../../models/referentiel/communes.model.js"

export const parisFixture: Omit<IReferentielCommune, "_id"> = {
  centre: {
    coordinates: [2.347, 48.8589],
    type: "Point",
  },
  bbox: {
    coordinates: [
      [
        [2.224219, 48.815562],
        [2.469851, 48.815562],
        [2.469851, 48.902148],
        [2.224219, 48.902148],
        [2.224219, 48.815562],
      ],
    ],
    type: "Polygon",
  },
  code: "75056",
  codeDepartement: "75",
  codeRegion: "11",
  codesPostaux: [
    "75001",
    "75002",
    "75003",
    "75004",
    "75005",
    "75006",
    "75007",
    "75008",
    "75009",
    "75010",
    "75011",
    "75012",
    "75013",
    "75014",
    "75015",
    "75016",
    "75017",
    "75018",
    "75019",
    "75020",
    "75116",
  ],
  nom: "Paris",
}

export const clichyFixture: Omit<IReferentielCommune, "_id"> = {
  code: "92024",
  centre: {
    coordinates: [2.3041, 48.9041],
    type: "Point",
  },
  codeDepartement: "92",
  codeRegion: "11",
  codesPostaux: ["92110"],
  nom: "Clichy",
  bbox: {
    coordinates: [
      [
        [2.287395, 48.894154],
        [2.320866, 48.894154],
        [2.320866, 48.914045],
        [2.287395, 48.914045],
        [2.287395, 48.894154],
      ],
    ],
    type: "Polygon",
  },
}

export const levalloisFixture: Omit<IReferentielCommune, "_id"> = {
  code: "92044",
  centre: {
    coordinates: [2.2874, 48.8946],
    type: "Point",
  },
  codeDepartement: "92",
  codeRegion: "11",
  codesPostaux: ["92300"],
  nom: "Levallois-Perret",
  bbox: {
    coordinates: [
      [
        [2.271064, 48.885639],
        [2.303774, 48.885639],
        [2.303774, 48.903642],
        [2.271064, 48.903642],
        [2.271064, 48.885639],
      ],
    ],
    type: "Polygon",
  },
}

export const marseilleFixture: Omit<IReferentielCommune, "_id"> = {
  code: "13055",
  centre: {
    coordinates: [5.3806, 43.2803],
    type: "Point",
  },
  codeDepartement: "13",
  codeRegion: "93",
  codesPostaux: ["13001", "13002", "13003", "13004", "13005", "13006", "13007", "13008", "13009", "13010", "13011", "13012", "13013", "13014", "13015", "13016"],
  nom: "Marseille",
  bbox: {
    coordinates: [
      [
        [5.228734, 43.169626],
        [5.532543, 43.169626],
        [5.532543, 43.391057],
        [5.228734, 43.391057],
        [5.228734, 43.169626],
      ],
    ],
    type: "Polygon",
  },
}

export function generateReferentielCommuneFixtures(data: Omit<IReferentielCommune, "_id">[]): IReferentielCommune[] {
  return data.map((fixture) => ({
    _id: new ObjectId(),
    ...fixture,
  }))
}
