import nock from "nock"

import type { IEmploiInclusionJob } from "./emploi-inclusion.client"
import config from "@/config"

const API_PATH = "/api/v1/siaes/"

export function generateEmploiInclusionJobFixture(overrides: Partial<IEmploiInclusionJob> = {}): IEmploiInclusionJob {
  return {
    id: "497f6eca-6276-4993-bfeb-53cbbbba6f08",
    cree_le: "2024-01-01T10:00:00Z",
    mis_a_jour_le: "2024-06-01T10:00:00Z",
    siret: "12345678901234",
    type: "ACI",
    raison_sociale: "Entreprise Test",
    enseigne: "Enseigne Test",
    telephone: "0123456789",
    courriel: "contact@test.fr",
    site_web: "https://test.fr",
    description: "Description entreprise",
    bloque_candidatures: false,
    addresse_ligne_1: "1 rue de la Paix",
    addresse_ligne_2: "",
    code_postal: "75001",
    ville: "Paris",
    departement: "75",
    postes: [
      {
        id: 1,
        rome: "M1805",
        cree_le: "2024-01-01T10:00:00Z",
        mis_a_jour_le: "2024-06-01T10:00:00Z",
        recrutement_ouvert: "True",
        description: "Description du poste",
        appellation_modifiee: "Développeur web en alternance",
        type_contrat: "APPRENTICESHIP",
        nombre_postes_ouverts: 2,
        lieu: {
          nom: "Paris",
          departement: "75",
          code_postaux: ["75001"],
          code_insee: "75101",
        },
        profil_recherche: "Profil recherché",
      },
    ],
    ...overrides,
  }
}

type IEmploiInclusionPageResponse = { count: number; next: string | null; previous: string | null; results: IEmploiInclusionJob[] }

export function nockEmploiInclusionPage(departement: string, response: IEmploiInclusionPageResponse) {
  return nock(config.emploi_inclusion.url).get(API_PATH).query({ departement }).reply(200, response)
}

export function nockEmploiInclusionNextPage(nextUrl: string, response: IEmploiInclusionPageResponse) {
  const { pathname, search } = new URL(nextUrl)
  return nock(config.emploi_inclusion.url).get(`${pathname}${search}`).reply(200, response)
}
