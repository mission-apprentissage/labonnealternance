import nock from "nock"

import config from "@/config"

const { baseUrl } = config.franceCompetences

interface FCOpcoResponseCode99 {
  code: "99"
  siret: string
}

interface FCOpcoResponseCode01 {
  code: "01"
  siret: string
  idcc: string
  opcoRattachement: {
    code: string
    nom: string
  }
  opcoGestion?: {
    code: string
    nom: string
  }
}

interface FCOpcoResponseCode02 {
  code: "02"
  siret: string
  idcc: string
  opcoRattachement: {
    code: string
    nom: string
  }
  opcoGestion?: {
    code: string
    nom: string
  }
}

interface FCOpcoResponseCode03 {
  code: "03"
  siret: string
  idcc: string
  opcoRattachement: {
    code: string
    nom: string
  }
}

type FCOpcoResponse = FCOpcoResponseCode99 | FCOpcoResponseCode01 | FCOpcoResponseCode02 | FCOpcoResponseCode03

export function generateFCOpcoResponseFixture(data: Partial<FCOpcoResponseCode01>): FCOpcoResponseCode01 {
  return {
    code: "01",
    siret: "42476141900045",
    idcc: "1234",
    opcoRattachement: {
      code: "1",
      nom: "AKTO",
    },
    ...data,
  }
}

export function nockFranceCompetencesOpcoSearch(siret: string, response: FCOpcoResponse, statusCode: number = 200) {
  return nock(baseUrl)
    .get(`/siro/v1/public/${encodeURIComponent(siret)}`)
    .matchHeader("X-Gravitee-Api-Key", config.franceCompetences.apiKey)
    .reply(statusCode, response)
}
