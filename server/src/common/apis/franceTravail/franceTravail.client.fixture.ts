import nock from "nock"
import { IRomeoApiResponse } from "shared/models/cacheRomeo.model"

import { FTJob, FTResponse } from "@/services/ftjob.service.types"

import { IRomeoPayload } from "./franceTravail.client"

export const franceTravailRomeoFixture = {
  "Software Engineer": [
    {
      contexte: " ",
      identifiant: "1",
      intitule: "Software Engineer",
      metiersRome: [
        {
          codeAppellation: "404251",
          codeRome: "E1206",
          libelleAppellation: "Software Designer",
          libelleRome: "UX - UI Designer",
          scorePrediction: 0.832,
        },
        {
          codeAppellation: "404250",
          codeRome: "E1206",
          libelleAppellation: "Software Design Specialist Designer",
          libelleRome: "UX - UI Designer",
          scorePrediction: 0.764,
        },
        {
          codeAppellation: "404252",
          codeRome: "E1206",
          libelleAppellation: "Software design leader",
          libelleRome: "UX - UI Designer",
          scorePrediction: 0.754,
        },
        {
          codeAppellation: "404307",
          codeRome: "M1813",
          libelleAppellation: "Ingénieur / Ingénieure progiciel",
          libelleRome: "Intégrateur / Intégratrice logiciels métiers",
          scorePrediction: 0.752,
        },
        {
          codeAppellation: "404278",
          codeRome: "M1811",
          libelleAppellation: "Data engineer",
          libelleRome: "Data engineer",
          scorePrediction: 0.744,
        },
      ],
      uuidInference: "180d530a-474a-496b-8d3b-f3d91928c663",
    },
  ],
} as const satisfies Record<string, IRomeoApiResponse>

export function generateFtJobFixture(data: Partial<FTJob>): FTJob {
  return {
    id: "1",
    intitule: "Super offre d'apprentissage",
    description: "Attention il te faut une super motivation pour ce job",
    dateCreation: "2024-01-01T00:00:00.000Z",
    dateActualisation: "2024-02-01T00:00:00.000Z",
    lieuTravail: {
      libelle: "",
      latitude: "",
      longitude: "",
      codePostal: "",
      commune: "",
    },
    romeCode: "",
    romeLibelle: "",
    appellationlibelle: "",
    appellationLibelle: "",
    entreprise: {
      nom: "",
      logo: "",
      description: "",
      siret: "",
    },
    typeContrat: "",
    typeContratLibelle: "",
    natureContrat: "",
    experienceExige: "",
    experienceLibelle: "",
    salaire: {},
    alternance: true,
    nombrePostes: 1,
    accessibleTH: true,
    origineOffre: {
      origine: "",
      urlOrigine: "http://job.com",
      partenaires: [],
    },

    ...data,
  }
}

export function nockFranceTravailTokenAccessOffre() {
  return nock("https://entreprise.francetravail.fr:443")
    .post(
      "/connexion/oauth2/access_token",
      [
        "grant_type=client_credentials",
        "client_id=LBA_ESD_CLIENT_ID",
        "client_secret=LBA_ESD_CLIENT_SECRET",
        `scope=${encodeURIComponent("application_LBA_ESD_CLIENT_ID api_offresdemploiv2 o2dsoffre")}`,
      ].join("&")
    )
    .query({
      realm: "partenaire",
    })
    .reply(200, { access_token: "ft_token_offre", expires_in: 300 })
}

export function nockFranceTravailTokenAccessRomeo() {
  return nock("https://entreprise.francetravail.fr:443")
    .post(
      "/connexion/oauth2/access_token",
      [
        "grant_type=client_credentials",
        "client_id=LBA_ESD_CLIENT_ID",
        "client_secret=LBA_ESD_CLIENT_SECRET",
        `scope=${encodeURIComponent("application_LBA_ESD_CLIENT_ID api_romeov2")}`,
      ].join("&")
    )
    .query({
      realm: "partenaire",
    })
    .reply(200, { access_token: "ft_token_romeo", expires_in: 300 })
}

export function nockFranceTravailRomeo(payload: IRomeoPayload[], response: IRomeoApiResponse) {
  return nock("https://api.francetravail.io/partenaire")
    .post("/romeo/v2/predictionMetiers", { appellations: payload, options: { nomAppelant: "La bonne alternance" } })
    .matchHeader(`authorization`, `Bearer ft_token_romeo`)
    .reply(200, response)
}

export function nockFranceTravailOffreSearch(params: Record<string, string>, response: FTResponse) {
  return nock("https://api.francetravail.io/partenaire")
    .get("/offresdemploi/v2/offres/search")
    .query(params)
    .matchHeader(`authorization`, `Bearer ft_token_offre`)
    .reply(200, response)
}
