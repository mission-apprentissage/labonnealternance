import { givenAConnectedOpcoUser } from "@tests/fixture/connectedUser.fixture"
import type { GetOfferResponse, OfferCreationByTokenResponse, OfferCreationResponse, OfferUpdateBody } from "@tests/sdk/entrepriseSdk"
import { entrepriseSdk } from "@tests/sdk/entrepriseSdk"
import { useMongo } from "@tests/utils/mongo.test.utils"
import { useServer } from "@tests/utils/server.test.utils"
import { ObjectId } from "bson"
import type { IJob } from "shared"
import { TRAINING_CONTRACT_TYPE } from "shared/constants/index"
import { generateJobFixture } from "shared/fixtures/recruiter.fixture"
import { generateReferentielRome } from "shared/fixtures/rome.fixture"
import dayjs from "shared/helpers/dayjs"
import type { IReferentielRome } from "shared/models/index"
import { AccessEntityType, JOB_STATUS_ENGLISH } from "shared/models/index"
import { beforeEach, describe, expect, it } from "vitest"
import { getDbCollection } from "@/common/utils/mongodbUtils"

const buildCreateJobDataFromReferentiel = (referentielRome: IReferentielRome) => {
  return {
    job_start_date: dayjs().add(1, "day").toDate(),
    rome_code: [referentielRome.rome.code_rome],
    rome_appellation_label: referentielRome.appellations[0].libelle,
    rome_label: referentielRome.rome.intitule,
    competences_rome: referentielRome.competences,
    job_type: [TRAINING_CONTRACT_TYPE.APPRENTISSAGE],
    job_count: 1,
  }
}

function jobToJobPatch(job: IJob): OfferUpdateBody {
  const {
    is_disabled_elligible,
    job_count,
    job_status,
    job_type,
    rome_code,
    competences_rome,
    job_duration,
    job_level_label,
    job_rythm,
    offer_title_custom,
    rome_appellation_label,
    rome_label,
    job_start_date,
    job_expiration_date,
  } = job

  const body: OfferUpdateBody = {
    is_disabled_elligible,
    job_count,
    job_status,
    job_type,
    rome_code,
    competences_rome,
    job_duration,
    job_level_label,
    job_rythm,
    offer_title_custom,
    rome_appellation_label,
    rome_label,
    job_start_date: job_start_date!,
    job_expiration_date: job_expiration_date!,
  }
  return body
}

describe("formulaire.controller", () => {
  useMongo()
  const httpClient = useServer()
  const entrepriseSdkInstance = entrepriseSdk(httpClient)

  const romeCode = "M1602"
  const referentielRome = generateReferentielRome()
  referentielRome.rome.code_rome = romeCode

  beforeEach(async () => {
    await getDbCollection("referentielromes").insertOne(referentielRome)

    return async () => {
      await getDbCollection("referentielromes").deleteMany({})
    }
  })

  it("crée une offre", async () => {
    // given
    const { cookies: entrepriseCookies, formulaire } = await entrepriseSdkInstance.createAndGetConnectedUser()
    // when
    const offerResponse = await entrepriseSdkInstance.createOffer({
      establishment_id: formulaire!.establishment_id,
      cookies: entrepriseCookies,
      job: buildCreateJobDataFromReferentiel(referentielRome),
    })

    // then
    expect.soft(offerResponse.statusCode).toBe(200)

    const { _id: jobObjectId } = offerResponse.json() as OfferCreationResponse
    const createdJob = await getDbCollection("jobs_partners").findOne({ _id: new ObjectId(jobObjectId) })

    expect.soft(createdJob?.is_delegated).toBe(false)
    expect.soft(createdJob?.cfa_siret).toBeNull()
    expect.soft(createdJob?.cfa_legal_name).toBeNull()
    expect.soft(createdJob?.cfa_apply_phone).toBeNull()
    expect.soft(createdJob?.cfa_apply_email).toBeNull()
    expect.soft(createdJob?.cfa_address_label).toBeNull()
  }, 10_000)

  describe("mise à jour", () => {
    it("met à jour une offre active", async () => {
      // given
      const { cookies: entrepriseCookies, formulaire, opco } = await entrepriseSdkInstance.createAndGetConnectedUser()

      const createOfferResponse = await entrepriseSdkInstance.createOffer({
        establishment_id: formulaire!.establishment_id,
        cookies: entrepriseCookies,
        job: buildCreateJobDataFromReferentiel(referentielRome),
      })

      const { _id: jobObjectId } = createOfferResponse.json() as OfferCreationResponse
      const jobId = jobObjectId.toString()
      const { cookies } = await givenAConnectedOpcoUser(
        {},
        {
          authorized_id: opco,
          authorized_type: AccessEntityType.OPCO,
        }
      )
      const offerResponse = await entrepriseSdkInstance.getOffer({ jobId, cookies })
      const job = offerResponse.json() as GetOfferResponse

      // when
      const response = await entrepriseSdkInstance.updateOffer({
        jobId,
        cookies,
        body: jobToJobPatch({
          ...job,
          job_count: 3,
        }),
      })
      // then
      expect.soft(response.statusCode).toBe(200)
    })
    it("interdit la mise à jour d'une offre annulée", async () => {
      // given
      const { cookies: entrepriseCookies, formulaire, user } = await entrepriseSdkInstance.createAndGetConnectedUser()
      const createOfferResponse = await entrepriseSdkInstance.createOffer({
        establishment_id: formulaire!.establishment_id,
        cookies: entrepriseCookies,
        job: buildCreateJobDataFromReferentiel(referentielRome),
      })
      const { _id: jobObjectId } = createOfferResponse.json() as OfferCreationResponse
      const jobId = jobObjectId.toString()
      const offerResponse = await entrepriseSdkInstance.getOffer({ jobId, cookies: entrepriseCookies })
      const job = offerResponse.json() as GetOfferResponse

      const cancelResponse = await entrepriseSdkInstance.cancelOffer({
        jobId,
        user,
      })
      expect.soft(cancelResponse.statusCode).toBe(200)
      // when
      const response = await entrepriseSdkInstance.updateOffer({
        jobId,
        cookies: entrepriseCookies,
        body: jobToJobPatch({
          ...job,
          job_count: 3,
        }),
      })
      expect.soft(response.statusCode).toBe(409)
    })
    it("interdit la mise à jour d'une offre pourvue", async () => {
      // given
      const { cookies: entrepriseCookies, formulaire, user } = await entrepriseSdkInstance.createAndGetConnectedUser()
      const createOfferResponse = await entrepriseSdkInstance.createOffer({
        establishment_id: formulaire!.establishment_id,
        cookies: entrepriseCookies,
        job: buildCreateJobDataFromReferentiel(referentielRome),
      })
      const { _id: jobObjectId } = createOfferResponse.json() as OfferCreationResponse
      const jobId = jobObjectId.toString()
      const offerResponse = await entrepriseSdkInstance.getOffer({ jobId, cookies: entrepriseCookies })
      const job = offerResponse.json() as GetOfferResponse

      const cancelResponse = await entrepriseSdkInstance.providedOffer({
        jobId,
        user,
      })
      expect.soft(cancelResponse.statusCode).toBe(200)
      // when
      const response = await entrepriseSdkInstance.updateOffer({
        jobId,
        cookies: entrepriseCookies,
        body: jobToJobPatch({
          ...job,
          job_count: 3,
        }),
      })
      expect.soft(response.statusCode).toBe(409)
    })
    it("interdit la mise à jour d'une offre au status En attente", async () => {
      // given
      const { cookies: entrepriseCookies, formulaire, user } = await entrepriseSdkInstance.createAndGetConnectedUser({ validated: false })
      const createOfferResponse = await entrepriseSdkInstance.createOfferByToken({
        establishment_id: formulaire!.establishment_id,
        user,
        job: buildCreateJobDataFromReferentiel(referentielRome),
      })
      expect.soft(createOfferResponse.statusCode).toBe(200)
      const { job_id: jobId } = createOfferResponse.json() as OfferCreationByTokenResponse

      const jobPartner = await getDbCollection("jobs_partners").findOne({ _id: new ObjectId(jobId) })
      expect.soft(jobPartner?.offer_status).toEqual(JOB_STATUS_ENGLISH.EN_ATTENTE)

      // when
      const response = await entrepriseSdkInstance.updateOffer({
        jobId,
        cookies: entrepriseCookies,
        body: jobToJobPatch({
          ...generateJobFixture(),
          job_count: 3,
        }),
      })
      expect.soft(response.statusCode).toBe(403)
    })
  })
  describe("PUT /formulaire/offre/:jobId/cancel", () => {
    it("dépublie une offre avec status Annulée", async () => {
      // given
      const { cookies: entrepriseCookies, formulaire, user } = await entrepriseSdkInstance.createAndGetConnectedUser()
      const createOfferResponse = await entrepriseSdkInstance.createOffer({
        establishment_id: formulaire!.establishment_id,
        cookies: entrepriseCookies,
        job: buildCreateJobDataFromReferentiel(referentielRome),
      })
      const { _id: jobObjectId } = createOfferResponse.json() as OfferCreationResponse
      const jobId = jobObjectId.toString()
      // when
      const response = await entrepriseSdkInstance.cancelOffer({
        jobId,
        user,
      })
      expect.soft(response.statusCode).toBe(200)
    })
    it("renvoie une 400 lorsque l'offre n'existe pas", async () => {
      // given
      const { user } = await entrepriseSdkInstance.createAndGetConnectedUser()

      // when
      const response = await entrepriseSdkInstance.cancelOffer({
        jobId: new ObjectId().toString(),
        user,
      })
      expect.soft(response.statusCode).toBe(400)
    })
  })
  describe("PUT /formulaire/offre/:jobId/provided", () => {
    it("dépublie une offre avec status Pourvue", async () => {
      // given
      const { cookies: entrepriseCookies, formulaire, user } = await entrepriseSdkInstance.createAndGetConnectedUser()

      const createOfferResponse = await entrepriseSdkInstance.createOffer({
        establishment_id: formulaire!.establishment_id,
        cookies: entrepriseCookies,
        job: buildCreateJobDataFromReferentiel(referentielRome),
      })
      const { _id: jobObjectId } = createOfferResponse.json() as OfferCreationResponse
      const jobId = jobObjectId.toString()

      // when
      const response = await entrepriseSdkInstance.providedOffer({
        jobId,
        user,
      })
      expect.soft(response.statusCode).toBe(200)
    })
    it("renvoie une 400 lorsque l'offre n'existe pas", async () => {
      // given
      const { user } = await entrepriseSdkInstance.createAndGetConnectedUser()

      // when
      const response = await entrepriseSdkInstance.providedOffer({
        jobId: new ObjectId().toString(),
        user,
      })
      expect.soft(response.statusCode).toBe(400)
    })
  })
  describe("PUT /formulaire/offre/:jobId/extend", () => {
    it("étend la durée de l'offre", async () => {
      // given
      const { cookies: entrepriseCookies, formulaire } = await entrepriseSdkInstance.createAndGetConnectedUser()

      const createOfferResponse = await entrepriseSdkInstance.createOffer({
        establishment_id: formulaire!.establishment_id,
        cookies: entrepriseCookies,
        job: buildCreateJobDataFromReferentiel(referentielRome),
      })
      const { _id: jobObjectId } = createOfferResponse.json() as OfferCreationResponse
      const jobId = jobObjectId.toString()

      // when
      const response = await entrepriseSdkInstance.extendOffer({
        jobId,
        cookies: entrepriseCookies,
      })
      expect.soft(response.statusCode).toBe(200)

      const extendedJobPartner = await getDbCollection("jobs_partners").findOne({ _id: new ObjectId(jobId) })
      expect.soft(extendedJobPartner?.job_prolongation_count).toBe(1)
      expect.soft(extendedJobPartner?.job_last_prolongation_date).toBeDefined()
      expect.soft(extendedJobPartner?.relance_mail_expiration_J7).toBeNull()
      expect.soft(extendedJobPartner?.relance_mail_expiration_J1).toBeNull()

      const formulaireResponse = await httpClient().inject({
        method: "GET",
        path: `/api/formulaire/${formulaire!.establishment_id}`,
        cookies: entrepriseCookies,
      })
      expect.soft(formulaireResponse.statusCode).toBe(200)

      const recruiter = formulaireResponse.json()
      const extendedJob = recruiter.jobs.find((job: IJob) => job._id.toString() === jobId)
      expect.soft(extendedJob?.job_prolongation_count).toBe(1)
      expect.soft(extendedJob?.job_last_prolongation_date).toBeDefined()
    })
    it("renvoie une 404 si l'offre n'existe pas", async () => {
      // given
      const { cookies: entrepriseCookies } = await entrepriseSdkInstance.createAndGetConnectedUser()

      // when
      const response = await entrepriseSdkInstance.extendOffer({
        jobId: new ObjectId().toString(),
        cookies: entrepriseCookies,
      })
      expect.soft(response.statusCode).toBe(404)
    })
  })
})
