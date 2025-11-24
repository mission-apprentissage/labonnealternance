import nock from "nock"

import type { FTJob, FTResponse } from "@/services/ftjob.service.types"

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

export function nockFranceTravailOffreSearch(params: Record<string, string>, response: FTResponse) {
  return nock("https://api.francetravail.io/partenaire")
    .get("/offresdemploi/v2/offres/search")
    .query(params)
    .matchHeader(`authorization`, `Bearer ft_token_offre`)
    .reply(200, response)
}
