import { generateEligibleTrainingEstablishmentFixture, generateEligibleTrainingFixture } from "shared/fixtures/appointment.fixture"
import { generateReferentielOnisepFixture } from "shared/fixtures/referentiel/onisep.fixture"
import { describe, expect, it } from "vitest"

import { getApiApprentissageTestingToken, getApiApprentissageTestingTokenFromInvalidPrivateKey } from "../../../../tests/utils/jwt.test.utils"
import { useMongo } from "../../../../tests/utils/mongo.test.utils"
import { useServer } from "../../../../tests/utils/server.test.utils"
import { getDbCollection } from "../../../common/utils/mongodbUtils"

const parcousupToken = await getApiApprentissageTestingToken({
  email: "test@test.fr",
  organisation: "parcoursup",
  habilitations: { "applications:write": false, "appointments:write": true, "jobs:write": false },
})

const onisepToken = await getApiApprentissageTestingToken({
  email: "test@test.fr",
  organisation: "onisep",
  habilitations: { "applications:write": false, "appointments:write": true, "jobs:write": false },
})

const lbaToken = await getApiApprentissageTestingToken({
  email: "test@test.fr",
  organisation: "lba",
  habilitations: { "applications:write": false, "appointments:write": true, "jobs:write": false },
})

const affelnetToken = await getApiApprentissageTestingToken({
  email: "test@test.fr",
  organisation: "affelnet",
  habilitations: { "applications:write": false, "appointments:write": true, "jobs:write": false },
})

const fakeToken = await getApiApprentissageTestingTokenFromInvalidPrivateKey({
  email: "mail@mail.com",
  organisation: "Un super Partenaire",
  habilitations: { "applications:write": false, "appointments:write": true, "jobs:write": false },
})

const eligibleTraining = generateEligibleTrainingFixture({})
const notEligibleTraining = generateEligibleTrainingFixture({ referrers: ["LBA"], parcoursup_id: "10021" })
const etablissement = generateEligibleTrainingEstablishmentFixture({})
const referentielOnisep = generateReferentielOnisepFixture({})

const mockData = async () => {
  await getDbCollection("eligible_trainings_for_appointments").insertOne(eligibleTraining)
  await getDbCollection("eligible_trainings_for_appointments").insertOne(notEligibleTraining)
  await getDbCollection("etablissements").insertOne(etablissement)
  await getDbCollection("referentieloniseps").insertOne(referentielOnisep)
}

useMongo(mockData)

describe("POST /v2/appointment", () => {
  const httpClient = useServer()
  const expectedUrlPattern = /^https?:\/\/[^/]+\/rdva/

  it("Return 401 if no api key provided", async () => {
    const response = await httpClient().inject({ method: "POST", path: "/api/v2/appointment" })
    expect(response.statusCode).toBe(401)
    expect(response.json()).toEqual({ statusCode: 401, error: "Unauthorized", message: "Unable to parse token missing-bearer" })
  })

  it("Return 401 if api key is invalid", async () => {
    const response = await httpClient().inject({ method: "POST", path: "/api/v2/appointment", headers: { authorization: `Bearer ${fakeToken}` } })
    expect.soft(response.statusCode).toBe(401)
    expect(response.json()).toEqual({ statusCode: 401, error: "Unauthorized", message: "Unable to parse token invalid-signature" })
  })

  it("Return 200 + error object if appointment is not available", async () => {
    const response = await httpClient().inject({
      method: "POST",
      path: "/api/v2/appointment",
      body: {
        parcoursup_id: notEligibleTraining.parcoursup_id,
      },
      headers: { authorization: `Bearer ${parcousupToken}` },
    })

    expect.soft(response.statusCode).toEqual(200)
    expect.soft(response.json()).toEqual({
      error: "Appointment request not available",
    })
  })

  it("Return 200 using PARCOURSUP ID", async () => {
    const response = await httpClient().inject({
      method: "POST",
      path: "/api/v2/appointment",
      body: {
        parcoursup_id: eligibleTraining.parcoursup_id,
      },
      headers: { authorization: `Bearer ${parcousupToken}` },
    })

    expect.soft(response.statusCode).toEqual(200)
    expect.soft(response.json()).toEqual({
      cfd: "32025001",
      cle_ministere_educatif: "088281P01313885594860007038855948600070-67118#L01",
      code_postal: "93290",
      etablissement_formateur_entreprise_raison_sociale: "AFORP FORMATION",
      etablissement_formateur_siret: "77572845400205",
      form_url: expect.stringMatching(expectedUrlPattern),
      intitule_long: "ASSISTANCE TECHNIQUE D'INGENIEUR (BTS)",
      lieu_formation_adresse: "64 Avenue de la Plaine de France",
      localite: "Tremblay-en-France",
    })
  })
  it("Return 200 using ONISEP ID", async () => {
    const response = await httpClient().inject({
      method: "POST",
      path: "/api/v2/appointment",
      body: {
        onisep_id: referentielOnisep.id_action_ideo2,
      },
      headers: { authorization: `Bearer ${onisepToken}` },
    })

    expect.soft(response.statusCode).toEqual(200)
    expect.soft(response.json()).toEqual({
      cfd: "32025001",
      cle_ministere_educatif: "088281P01313885594860007038855948600070-67118#L01",
      code_postal: "93290",
      etablissement_formateur_entreprise_raison_sociale: "AFORP FORMATION",
      etablissement_formateur_siret: "77572845400205",
      form_url: expect.stringMatching(expectedUrlPattern),
      intitule_long: "ASSISTANCE TECHNIQUE D'INGENIEUR (BTS)",
      lieu_formation_adresse: "64 Avenue de la Plaine de France",
      localite: "Tremblay-en-France",
    })
  })

  it("Return 200 using CLE MINISTERE EDUCATIVE", async () => {
    const response = await httpClient().inject({
      method: "POST",
      path: "/api/v2/appointment",
      body: {
        cle_ministere_educatif: eligibleTraining.cle_ministere_educatif,
      },
      headers: { authorization: `Bearer ${affelnetToken}` },
    })

    expect.soft(response.statusCode).toEqual(200)
    expect.soft(response.json()).toEqual({
      cfd: "32025001",
      cle_ministere_educatif: "088281P01313885594860007038855948600070-67118#L01",
      code_postal: "93290",
      etablissement_formateur_entreprise_raison_sociale: "AFORP FORMATION",
      etablissement_formateur_siret: "77572845400205",
      form_url: expect.stringMatching(expectedUrlPattern),
      intitule_long: "ASSISTANCE TECHNIQUE D'INGENIEUR (BTS)",
      lieu_formation_adresse: "64 Avenue de la Plaine de France",
      localite: "Tremblay-en-France",
    })
  })

  it("Return 400 using LBA referrer", async () => {
    const response = await httpClient().inject({
      method: "POST",
      path: "/api/v2/appointment",
      body: {
        cle_ministere_educatif: eligibleTraining.cle_ministere_educatif,
      },
      headers: { authorization: `Bearer ${lbaToken}` },
    })

    expect.soft(response.statusCode).toEqual(401)
  })
})
