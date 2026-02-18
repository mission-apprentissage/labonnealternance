import { TRAINING_CONTRACT_TYPE } from "shared/constants/index"
import { generateReferentielRome } from "shared/fixtures/rome.fixture"
import type { IReferentielRome } from "shared/models/index"
import { AccessEntityType, JOB_STATUS } from "shared/models/index"
import { beforeEach, describe, expect, it } from "vitest"

import { ObjectId } from "bson"
import { omit } from "lodash-es"
import dayjs from "shared/helpers/dayjs"
import { getDbCollection } from "@/common/utils/mongodbUtils"
import { givenAConnectedOpcoUser } from "@tests/fixture/connectedUser.fixture"
import type { OfferCreationResponse } from "@tests/sdk/entrepriseSdk"
import { entrepriseSdk } from "@tests/sdk/entrepriseSdk"
import { useMongo } from "@tests/utils/mongo.test.utils"
import { useServer } from "@tests/utils/server.test.utils"

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
  })

  describe("mise à jour", () => {
    it("met à jour une offre active", async () => {
      // given
      const { cookies: entrepriseCookies, formulaire } = await entrepriseSdkInstance.createAndGetConnectedUser()
      const opco = formulaire!.opco!

      const offerResponse = await entrepriseSdkInstance.createOffer({
        establishment_id: formulaire!.establishment_id,
        cookies: entrepriseCookies,
        job: buildCreateJobDataFromReferentiel(referentielRome),
      })

      const { recruiter } = offerResponse.json() as OfferCreationResponse
      const { cookies } = await givenAConnectedOpcoUser(
        {},
        {
          authorized_id: opco,
          authorized_type: AccessEntityType.OPCO,
        }
      )

      // when
      const job = recruiter.jobs[0]
      const jobId = job._id.toString()
      const response = await entrepriseSdkInstance.updateOffer({
        jobId,
        cookies,
        body: {
          ...omit(job, "_id"),
          job_update_date: new Date(),
          job_creation_date: new Date(job.job_creation_date!),
          job_expiration_date: new Date(job.job_expiration_date!),
          job_count: 3,
        },
      })
      // then
      expect.soft(response.statusCode).toBe(200)
    })
    it("interdit la mise à jour d'une offre annulée", async () => {
      // given
      const { cookies: entrepriseCookies, formulaire, user } = await entrepriseSdkInstance.createAndGetConnectedUser()
      const offerResponse = await entrepriseSdkInstance.createOffer({
        establishment_id: formulaire!.establishment_id,
        cookies: entrepriseCookies,
        job: buildCreateJobDataFromReferentiel(referentielRome),
      })
      const { recruiter } = offerResponse.json() as OfferCreationResponse
      const job = recruiter.jobs[0]
      const jobId = job._id.toString()
      const cancelResponse = await entrepriseSdkInstance.cancelOffer({
        jobId,
        user,
      })
      expect.soft(cancelResponse.statusCode).toBe(200)
      // when
      const response = await entrepriseSdkInstance.updateOffer({
        jobId,
        cookies: entrepriseCookies,
        body: {
          ...omit(job, "_id"),
          job_update_date: new Date(),
          job_creation_date: new Date(job.job_creation_date!),
          job_expiration_date: new Date(job.job_expiration_date!),
          job_count: 3,
        },
      })
      expect.soft(response.statusCode).toBe(409)
    })
    it("interdit la mise à jour d'une offre pourvue", async () => {
      // given
      const { cookies: entrepriseCookies, formulaire, user } = await entrepriseSdkInstance.createAndGetConnectedUser()
      const offerResponse = await entrepriseSdkInstance.createOffer({
        establishment_id: formulaire!.establishment_id,
        cookies: entrepriseCookies,
        job: buildCreateJobDataFromReferentiel(referentielRome),
      })
      const { recruiter } = offerResponse.json() as OfferCreationResponse
      const job = recruiter.jobs[0]
      const jobId = job._id.toString()
      const cancelResponse = await entrepriseSdkInstance.providedOffer({
        jobId,
        user,
      })
      expect.soft(cancelResponse.statusCode).toBe(200)
      // when
      const response = await entrepriseSdkInstance.updateOffer({
        jobId,
        cookies: entrepriseCookies,
        body: {
          ...omit(job, "_id"),
          job_update_date: new Date(),
          job_creation_date: new Date(job.job_creation_date!),
          job_expiration_date: new Date(job.job_expiration_date!),
          job_count: 3,
        },
      })
      expect.soft(response.statusCode).toBe(409)
    })
    it.only("interdit la mise à jour d'une offre au status En attente", async () => {
      // given
      const { cookies: entrepriseCookies, formulaire, user } = await entrepriseSdkInstance.createAndGetConnectedUser({ validated: false })
      const offerResponse = await entrepriseSdkInstance.createOfferByToken({
        establishment_id: formulaire!.establishment_id,
        user,
        job: buildCreateJobDataFromReferentiel(referentielRome),
      })
      expect.soft(offerResponse.statusCode).toBe(200)
      const { recruiter } = offerResponse.json() as OfferCreationResponse
      const job = recruiter.jobs[0]
      expect.soft(job.job_status).toBe(JOB_STATUS.EN_ATTENTE)
      const jobId = job._id.toString()

      // when
      const response = await entrepriseSdkInstance.updateOffer({
        jobId,
        cookies: entrepriseCookies,
        body: {
          ...omit(job, "_id"),
          job_update_date: new Date(),
          job_creation_date: new Date(job.job_creation_date!),
          job_expiration_date: new Date(job.job_expiration_date!),
          job_count: 3,
        },
      })
      expect.soft(response.statusCode).toBe(403)
    })
  })
  describe("PUT /formulaire/offre/:jobId/cancel", () => {
    it("dépublie une offre avec status Annulée", async () => {
      // given
      const { cookies: entrepriseCookies, formulaire, user } = await entrepriseSdkInstance.createAndGetConnectedUser()

      const offerResponse = await entrepriseSdkInstance.createOffer({
        establishment_id: formulaire!.establishment_id,
        cookies: entrepriseCookies,
        job: buildCreateJobDataFromReferentiel(referentielRome),
      })
      const { recruiter } = offerResponse.json() as OfferCreationResponse
      const job = recruiter.jobs[0]
      const jobId = job._id.toString()

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

      const offerResponse = await entrepriseSdkInstance.createOffer({
        establishment_id: formulaire!.establishment_id,
        cookies: entrepriseCookies,
        job: buildCreateJobDataFromReferentiel(referentielRome),
      })
      const { recruiter } = offerResponse.json() as OfferCreationResponse
      const job = recruiter.jobs[0]
      const jobId = job._id.toString()

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

      const offerResponse = await entrepriseSdkInstance.createOffer({
        establishment_id: formulaire!.establishment_id,
        cookies: entrepriseCookies,
        job: buildCreateJobDataFromReferentiel(referentielRome),
      })
      const { recruiter } = offerResponse.json() as OfferCreationResponse
      const job = recruiter.jobs[0]
      const jobId = job._id.toString()

      // when
      const response = await entrepriseSdkInstance.extendOffer({
        jobId,
        cookies: entrepriseCookies,
      })
      expect.soft(response.statusCode).toBe(200)
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
