import { getConnectedInfos, givenAConnectedOpcoUser } from "@tests/fixture/connectedUser.fixture"
import type { GetOfferResponse, OfferCreationByTokenResponse, OfferCreationResponse, OfferUpdateBody } from "@tests/sdk/entrepriseSdk"
import { entrepriseSdk } from "@tests/sdk/entrepriseSdk"
import { getApiApprentissageTestingToken } from "@tests/utils/jwt.test.utils"
import { useMongo } from "@tests/utils/mongo.test.utils"
import { useServer } from "@tests/utils/server.test.utils"
import { saveAdminUserTest, saveCfaUserTest, validatedUserStatus } from "@tests/utils/user.test.utils"
import { ObjectId } from "bson"
import type { IJob } from "shared"
import { JOB_STATUS } from "shared"
import { TRAINING_CONTRACT_TYPE } from "shared/constants/index"
import { generateJobFixture } from "shared/fixtures/recruiter.fixture"
import { generateReferentielRome } from "shared/fixtures/rome.fixture"
import dayjs from "shared/helpers/dayjs"
import type { IReferentielRome } from "shared/models/index"
import { AccessEntityType, JOB_STATUS, JOB_STATUS_ENGLISH } from "shared/models/index"
import { JOB_DESCRIPTION_MAX_LENGTH, JOB_EMPLOYER_DESCRIPTION_MAX_LENGTH, JOB_START_TYPE, OFFER_DESCRIPTION_MODE } from "shared/models/job.model"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { getDbCollection } from "@/common/utils/mongodb-utils"
import config from "@/config"
import { buildEstablishmentId } from "@/services/etablissement.service"
import mailer from "@/services/mailer.service"
import { sendMistralMessages } from "@/services/mistralai/mistralai.service"
import { CLASSIFICATION_SYSTEM_PROMPT } from "@/services/offre-classification/offre-classification.prompt"

// Mock mailer service to avoid sending actual emails during tests
vi.mock("@/services/mailer.service", () => {
  return {
    default: {
      sendEmail: vi.fn().mockResolvedValue({ messageId: "test-message-id", accepted: ["test@example.com"] }),
      renderEmail: vi.fn().mockResolvedValue("<html>Test Email</html>"),
    },
  }
})

// la modération des textes libres appelle Mistral : sans réponse, elle renvoie le texte masqué et sanitizé
vi.mock("@/services/mistralai/mistralai.service", () => ({
  sendMistralMessages: vi.fn().mockResolvedValue(null),
}))

const buildCreateJobDataFromReferentiel = (referentielRome: IReferentielRome) => {
  return {
    job_start_date: dayjs().add(1, "day").toDate(),
    rome_code: [referentielRome.rome.code_rome],
    rome_appellation_label: referentielRome.appellations[0].libelle,
    rome_label: referentielRome.rome.intitule,
    competences_rome: referentielRome.competences,
    job_type: [TRAINING_CONTRACT_TYPE.APPRENTISSAGE],
    job_count: 1,
    ft_support: false,
    job_start_type: JOB_START_TYPE.PRECISE_DATE,
    job_start_date_flexible: false,
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
    job_start_type,
    job_start_date_flexible,
    job_start_date,
    job_expiration_date,
    ft_support,
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
    job_start_type: job_start_type!,
    job_start_date_flexible: Boolean(job_start_date_flexible),
    job_start_date: job_start_date!,
    job_expiration_date: job_expiration_date!,
    ft_support,
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
      await getDbCollection("jobs_partners").deleteMany({})
      await getDbCollection("userswithaccounts").deleteMany({})
      await getDbCollection("rolemanagements").deleteMany({})
      await getDbCollection("entreprises").deleteMany({})
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

  describe("description rédigée par le recruteur", () => {
    const description = "Vous participerez au développement de nos outils internes aux côtés de l'équipe technique."

    it.each([
      {
        route: "connectée",
        create: async () => {
          const { cookies, formulaire } = await entrepriseSdkInstance.createAndGetConnectedUser()
          const response = await entrepriseSdkInstance.createOffer({
            establishment_id: formulaire!.establishment_id,
            cookies,
            job: { ...buildCreateJobDataFromReferentiel(referentielRome), job_description: description },
          })
          return { cookies, jobId: (response.json() as OfferCreationResponse)._id.toString() }
        },
      },
      {
        route: "par jeton",
        create: async () => {
          const { cookies, formulaire, user } = await entrepriseSdkInstance.createAndGetConnectedUser()
          const response = await entrepriseSdkInstance.createOfferByToken({
            establishment_id: formulaire!.establishment_id,
            user,
            job: { ...buildCreateJobDataFromReferentiel(referentielRome), job_description: description },
          })
          return { cookies, jobId: (response.json() as OfferCreationByTokenResponse).job_id }
        },
      },
    ])("la conserve à la création (route $route) et la renvoie à l'édition", async ({ create }) => {
      const { cookies, jobId } = await create()

      const createdJob = await getDbCollection("jobs_partners").findOne({ _id: new ObjectId(jobId) })
      expect.soft(createdJob?.offer_description).toBe(description)

      const offerResponse = await entrepriseSdkInstance.getOffer({ jobId, cookies })
      expect.soft((offerResponse.json() as GetOfferResponse).job_description).toBe(description)
    })

    it("sans description saisie, stocke la définition du métier et ne la renvoie pas comme une saisie", async () => {
      const { cookies, formulaire } = await entrepriseSdkInstance.createAndGetConnectedUser()
      const response = await entrepriseSdkInstance.createOffer({
        establishment_id: formulaire!.establishment_id,
        cookies,
        job: buildCreateJobDataFromReferentiel(referentielRome),
      })
      const jobId = (response.json() as OfferCreationResponse)._id.toString()

      const createdJob = await getDbCollection("jobs_partners").findOne({ _id: new ObjectId(jobId) })
      expect.soft(createdJob?.offer_description).toBe(referentielRome.definition)

      const offerResponse = await entrepriseSdkInstance.getOffer({ jobId, cookies })
      expect.soft((offerResponse.json() as GetOfferResponse).job_description).toBeNull()
    })
  })

  describe("champs issus de la fiche ROME", () => {
    const description = "Vous participerez au développement de nos outils internes aux côtés de l'équipe technique."

    const createOffer = async (job_description?: string) => {
      const { cookies, formulaire } = await entrepriseSdkInstance.createAndGetConnectedUser()
      const response = await entrepriseSdkInstance.createOffer({
        establishment_id: formulaire!.establishment_id,
        cookies,
        job: { ...buildCreateJobDataFromReferentiel(referentielRome), job_description },
      })
      return { cookies, jobId: (response.json() as OfferCreationResponse)._id.toString() }
    }
    const readJob = async (jobId: string) => getDbCollection("jobs_partners").findOne({ _id: new ObjectId(jobId) })
    const romeFields = (job: Awaited<ReturnType<typeof readJob>>) => [
      job?.offer_desired_skills,
      job?.offer_to_be_acquired_skills,
      job?.offer_to_be_acquired_knowledge,
      job?.offer_access_conditions,
    ]

    it("laisse vides les champs ROME d'une offre à description rédigée, en gardant son code ROME", async () => {
      const { jobId } = await createOffer(description)

      const job = await readJob(jobId)
      expect.soft(job?.offer_description_mode).toBe(OFFER_DESCRIPTION_MODE.CUSTOM)
      expect.soft(job?.offer_rome_codes).toEqual([romeCode])
      expect.soft(romeFields(job)).toEqual([[], [], [], []])
    })

    it("remplit les champs ROME d'une offre sur fiche métier", async () => {
      const { jobId } = await createOffer()

      const job = await readJob(jobId)
      expect.soft(job?.offer_description_mode).toBe(OFFER_DESCRIPTION_MODE.STRUCTURED)
      for (const field of romeFields(job)) {
        expect.soft(field?.length).toBeGreaterThan(0)
      }
    })

    it("vide les champs ROME quand une offre sur fiche métier passe en description rédigée", async () => {
      const { cookies, jobId } = await createOffer()
      const job = (await entrepriseSdkInstance.getOffer({ jobId, cookies })).json() as GetOfferResponse

      const response = await entrepriseSdkInstance.updateOffer({ jobId, cookies, body: { ...jobToJobPatch(job), job_description: description } })

      expect.soft(response.statusCode).toBe(200)
      const updatedJob = await readJob(jobId)
      expect.soft(updatedJob?.offer_description_mode).toBe(OFFER_DESCRIPTION_MODE.CUSTOM)
      expect.soft(romeFields(updatedJob)).toEqual([[], [], [], []])
    })

    it("expose par l'API v3 le code ROME d'une offre rédigée, sans contenu de la fiche", async () => {
      const { jobId } = await createOffer(description)
      const token = await getApiApprentissageTestingToken({
        email: "test@test.fr",
        organisation: "Un partenaire",
        habilitations: { "applications:write": false, "appointments:write": false, "jobs:write": false },
      })

      const response = await httpClient().inject({ method: "GET", path: `/api/v3/jobs/${jobId}`, headers: { authorization: `Bearer ${token}` } })

      expect.soft(response.statusCode).toBe(200)
      const { offer } = response.json()
      expect.soft(offer.rome_codes).toEqual([romeCode])
      expect.soft([offer.desired_skills, offer.to_be_acquired_skills, offer.access_conditions]).toEqual([[], [], []])
    })

    it("ne renvoie pas de compétences à l'édition d'une offre à description rédigée, et les remplit au retour sur fiche métier", async () => {
      const { cookies, jobId } = await createOffer(description)
      const job = (await entrepriseSdkInstance.getOffer({ jobId, cookies })).json() as GetOfferResponse
      expect.soft(job.competences_rome).toBeNull()

      // sans compétences reçues, le formulaire repart de toute la fiche (cf. finalSelectedCompetences)
      const response = await entrepriseSdkInstance.updateOffer({
        jobId,
        cookies,
        body: { ...jobToJobPatch(job), job_description: null, competences_rome: referentielRome.competences },
      })

      expect.soft(response.statusCode).toBe(200)
      const updatedJob = await readJob(jobId)
      expect.soft(updatedJob?.offer_description_mode).toBe(OFFER_DESCRIPTION_MODE.STRUCTURED)
      for (const field of romeFields(updatedJob)) {
        expect.soft(field?.length).toBeGreaterThan(0)
      }
    })
  })

  describe("longueur des textes libres", () => {
    const limits = [
      { field: "job_description", max: JOB_DESCRIPTION_MAX_LENGTH },
      { field: "job_employer_description", max: JOB_EMPLOYER_DESCRIPTION_MAX_LENGTH },
    ] as const

    it.each(limits)("refuse $field au-delà de $max caractères à la création, l'accepte à la limite", async ({ field, max }) => {
      const { cookies, formulaire } = await entrepriseSdkInstance.createAndGetConnectedUser()
      const create = (length: number) =>
        entrepriseSdkInstance.createOffer({
          establishment_id: formulaire!.establishment_id,
          cookies,
          job: { ...buildCreateJobDataFromReferentiel(referentielRome), [field]: "a".repeat(length) },
        })

      expect.soft((await create(max + 1)).statusCode).toBe(400)
      expect.soft((await create(max)).statusCode).toBe(200)
    })

    it.each(limits)("refuse $field au-delà de $max caractères à la mise à jour, l'accepte à la limite", async ({ field, max }) => {
      const { cookies, formulaire } = await entrepriseSdkInstance.createAndGetConnectedUser()
      const createOfferResponse = await entrepriseSdkInstance.createOffer({
        establishment_id: formulaire!.establishment_id,
        cookies,
        job: buildCreateJobDataFromReferentiel(referentielRome),
      })
      const jobId = (createOfferResponse.json() as OfferCreationResponse)._id.toString()
      const job = (await entrepriseSdkInstance.getOffer({ jobId, cookies })).json() as GetOfferResponse
      const update = (length: number) => entrepriseSdkInstance.updateOffer({ jobId, cookies, body: { ...jobToJobPatch(job), [field]: "a".repeat(length) } })

      expect.soft((await update(max + 1)).statusCode).toBe(400)
      expect.soft((await update(max)).statusCode).toBe(200)
    })
  })

  describe("mise à jour", () => {
    it("met à jour la description publique quand le ROME est modifié", async () => {
      // given
      const { cookies, formulaire } = await entrepriseSdkInstance.createAndGetConnectedUser()

      const createOfferResponse = await entrepriseSdkInstance.createOffer({
        establishment_id: formulaire!.establishment_id,
        cookies,
        job: buildCreateJobDataFromReferentiel(referentielRome),
      })

      const { _id: jobObjectId } = createOfferResponse.json() as OfferCreationResponse
      const jobId = jobObjectId.toString()

      const newRome = generateReferentielRome({
        rome: {
          code_rome: "D1106",
          intitule: "Vente en alimentation",
          code_ogr: "335",
        },
        definition: "Réalise la vente de produits alimentaires (frais et hors frais) selon la réglementation du commerce, les règles d'hygiène et de sécurité alimentaires.",
      })
      await getDbCollection("referentielromes").insertOne(newRome)

      const offerResponse = await entrepriseSdkInstance.getOffer({ jobId, cookies })
      const job = offerResponse.json() as GetOfferResponse

      // when
      const response = await entrepriseSdkInstance.updateOffer({
        jobId,
        cookies,
        body: {
          ...jobToJobPatch(job),
          rome_code: [newRome.rome.code_rome],
          rome_label: newRome.rome.intitule,
          rome_appellation_label: newRome.appellations[0].libelle,
          competences_rome: newRome.competences,
        },
      })

      // then
      expect.soft(response.statusCode).toBe(200)

      const updatedJob = await getDbCollection("jobs_partners").findOne({ _id: new ObjectId(jobId) })
      expect.soft(updatedJob?.offer_description).toEqual(newRome.definition)
      expect.soft(updatedJob?.offer_rome_codes).toEqual([newRome.rome.code_rome])
    })

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

      const cancelResponse = await entrepriseSdkInstance.cancelOffer({
        jobId,
        user,
        body: { job_status: JOB_STATUS.POURVUE, job_status_comment: "J'ai pourvu l'offre avec La bonne alternance" },
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

  describe("POST /formulaire/:establishment_id/informations", () => {
    const newContactInfo = {
      email: "contact@entreprise-partenaire.fr",
      phone: "0611111111",
      first_name: "Jean",
      last_name: "Dupont",
    }

    it("permet à un CFA de modifier les informations de contact d'une entreprise qu'il gère", async () => {
      // given
      const { user: cfaUser, cfa, entreprise } = await saveCfaUserTest({ email: "cfa@cfa-domain.fr", phone: "0600000000", status: validatedUserStatus })
      const { cookies } = await getConnectedInfos(cfaUser.email)
      const establishment_id = buildEstablishmentId(cfaUser._id, entreprise.siret)

      // when
      const response = await httpClient().inject({
        method: "POST",
        path: `/api/formulaire/${establishment_id}/informations`,
        cookies,
        body: newContactInfo,
      })

      // then
      expect.soft(response.statusCode).toBe(200)
      const entrepriseManagedByCfa = await getDbCollection("entreprise_managed_by_cfa").findOne({ cfa_id: cfa._id, entreprise_id: entreprise._id })
      expect.soft(entrepriseManagedByCfa?.email).toBe(newContactInfo.email)
      expect.soft(entrepriseManagedByCfa?.phone).toBe(newContactInfo.phone)
      expect.soft(entrepriseManagedByCfa?.first_name).toBe(newContactInfo.first_name)
      expect.soft(entrepriseManagedByCfa?.last_name).toBe(newContactInfo.last_name)
    })

    it("permet à un admin de modifier les informations de contact d'une entreprise gérée par un CFA", async () => {
      // given
      const { user: cfaUser, cfa, entreprise } = await saveCfaUserTest({ email: "cfa@cfa-domain.fr", phone: "0600000000", status: validatedUserStatus })
      const { user: adminUser } = await saveAdminUserTest({ status: validatedUserStatus })
      const { cookies } = await getConnectedInfos(adminUser.email)
      const establishment_id = buildEstablishmentId(cfaUser._id, entreprise.siret)

      // when
      const response = await httpClient().inject({
        method: "POST",
        path: `/api/formulaire/${establishment_id}/informations`,
        cookies,
        body: newContactInfo,
      })

      // then
      expect.soft(response.statusCode).toBe(200)
      const entrepriseManagedByCfa = await getDbCollection("entreprise_managed_by_cfa").findOne({ cfa_id: cfa._id, entreprise_id: entreprise._id })
      expect.soft(entrepriseManagedByCfa?.email).toBe(newContactInfo.email)
      expect.soft(entrepriseManagedByCfa?.phone).toBe(newContactInfo.phone)
    })
  })

  describe("modération des textes libres (#5497, #5498)", () => {
    type IClassifierReply = "conforme" | "a_verifier" | "non_conforme" | "panne"
    const BLOQUANT = "Texte qui déclenche un verdict bloquant pour le test."
    const DOUTEUX = "Texte qui déclenche un verdict à vérifier pour le test."
    const CONFORME = "Vous participerez au développement de nos outils internes."
    const EN_PANNE = "Texte dont la classification échoue pour le test."

    const replyFor = (text: string): IClassifierReply => {
      if (text.includes(BLOQUANT)) return "non_conforme"
      if (text.includes(DOUTEUX)) return "a_verifier"
      if (text.includes(EN_PANNE)) return "panne"
      return "conforme"
    }

    // moderateFreeText reçoit null (texte masqué gardé tel quel) ; le classifieur répond selon le texte reçu.
    const mockClassifier = () =>
      vi.mocked(sendMistralMessages).mockImplementation(async ({ messages }) => {
        if (messages[0]?.content !== CLASSIFICATION_SYSTEM_PROMPT) return null
        const reply = replyFor(messages.find(({ role }) => role === "user")?.content ?? "")
        if (reply === "panne") return null
        const findings = reply === "conforme" ? [] : [{ category: "discrimination", severity: reply === "non_conforme" ? "bloquant" : "doute", verbatim: "extrait" }]
        return JSON.stringify({ verdict: reply, findings })
      })

    const createOfferWithTexts = async ({
      cookies,
      establishment_id,
      job_description,
      job_employer_description,
    }: {
      cookies: Record<string, string>
      establishment_id: string
      job_description?: string
      job_employer_description?: string
    }) => {
      const response = await entrepriseSdkInstance.createOffer({
        establishment_id,
        cookies,
        job: { ...buildCreateJobDataFromReferentiel(referentielRome), job_description, job_employer_description },
      })
      expect(response.statusCode).toBe(200)
      const { _id } = response.json() as OfferCreationResponse
      return new ObjectId(_id)
    }

    const updateOfferTexts = async ({ jobId, cookies, job_description }: { jobId: ObjectId; cookies: Record<string, string>; job_description: string }) => {
      const offer = (await entrepriseSdkInstance.getOffer({ jobId: jobId.toString(), cookies })).json() as GetOfferResponse
      // Le formulaire renvoie toujours les compétences, que validateFieldsFromReferentielRome exige.
      return entrepriseSdkInstance.updateOffer({
        jobId: jobId.toString(),
        cookies,
        body: { ...jobToJobPatch(offer), competences_rome: referentielRome.competences, job_description },
      })
    }

    const getModerations = (jobId: ObjectId) =>
      getDbCollection("jobs_partners_moderations")
        .find({ job_id: jobId }, { sort: { created_at: 1 } })
        .toArray()
    const publishedMails = () => vi.mocked(mailer.sendEmail).mock.calls.filter(([{ subject }]) => subject.includes("est publiée"))

    beforeEach(() => {
      mockClassifier()
      return () => {
        vi.mocked(sendMistralMessages).mockReset().mockResolvedValue(null)
        return getDbCollection("jobs_partners_moderations").deleteMany({})
      }
    })

    describe("blocage désactivé", () => {
      it("classifie le dépôt après la réponse, sans effet sur le statut", async () => {
        const { cookies, formulaire } = await entrepriseSdkInstance.createAndGetConnectedUser()
        const jobId = await createOfferWithTexts({ cookies, establishment_id: formulaire!.establishment_id, job_description: BLOQUANT })

        await vi.waitFor(async () => expect(await getModerations(jobId)).toHaveLength(1))
        const [moderation] = await getModerations(jobId)
        expect(moderation).toMatchObject({ trigger: "creation", verdict: "non_conforme", status: "ok", review: null })
        await vi.waitFor(async () =>
          expect(await getDbCollection("jobs_partners").findOne({ _id: jobId })).toMatchObject({
            offer_status: JOB_STATUS_ENGLISH.ACTIVE,
            offer_moderation_verdict: "non_conforme",
            offer_moderation_status: "ok",
            offer_moderation_review: null,
          })
        )
      })

      it("ne classifie pas une édition qui ne change aucun texte libre", async () => {
        const { cookies, formulaire } = await entrepriseSdkInstance.createAndGetConnectedUser()
        const jobId = await createOfferWithTexts({ cookies, establishment_id: formulaire!.establishment_id, job_description: CONFORME })
        await vi.waitFor(async () => expect(await getModerations(jobId)).toHaveLength(1))

        const response = await updateOfferTexts({ jobId, cookies, job_description: CONFORME })

        expect(response.statusCode).toBe(200)
        // Le témoin : un texte modifié, lui, est reclassifié.
        await updateOfferTexts({ jobId, cookies, job_description: `${CONFORME} Modifié.` })
        await vi.waitFor(async () => expect((await getModerations(jobId)).map(({ trigger }) => trigger)).toEqual(["creation", "edition"]))
      })
    })

    describe("blocage activé", () => {
      beforeEach(() => {
        config.moderation.enforce = true
      })
      afterEach(() => {
        config.moderation.enforce = false
      })

      it.each([
        ["conforme", JOB_STATUS_ENGLISH.ACTIVE, "ok", CONFORME],
        ["a_verifier", JOB_STATUS_ENGLISH.ACTIVE, "ok", DOUTEUX],
        ["non_conforme", JOB_STATUS_ENGLISH.EN_MODERATION, "ok", BLOQUANT],
        ["indisponible", JOB_STATUS_ENGLISH.EN_MODERATION, "indisponible", EN_PANNE],
      ] as const)("dépôt classifié %s ⇒ %s", async (_label, expectedStatus, expectedModerationStatus, text) => {
        const { cookies, formulaire } = await entrepriseSdkInstance.createAndGetConnectedUser()
        const jobId = await createOfferWithTexts({ cookies, establishment_id: formulaire!.establishment_id, job_description: text })

        const offer = await getDbCollection("jobs_partners").findOne({ _id: jobId })
        expect(offer?.offer_status).toBe(expectedStatus)
        expect(offer?.offer_moderation_status).toBe(expectedModerationStatus)
        expect(offer?.offer_moderation_review).toBeNull()
        // Écrit pendant le dépôt, sans attente.
        expect(await getModerations(jobId)).toEqual([expect.objectContaining({ trigger: "creation", status: expectedModerationStatus })])
        if (expectedStatus === JOB_STATUS_ENGLISH.EN_MODERATION) {
          expect(offer?.offer_status_history).toEqual([expect.objectContaining({ status: JOB_STATUS_ENGLISH.EN_MODERATION, granted_by: "classifier" })])
        }
      })

      it("bloque une offre dont un seul champ n'a pas pu être classifié, même si l'autre est conforme", async () => {
        const { cookies, formulaire } = await entrepriseSdkInstance.createAndGetConnectedUser()
        const jobId = await createOfferWithTexts({ cookies, establishment_id: formulaire!.establishment_id, job_description: CONFORME, job_employer_description: EN_PANNE })

        // En échec, le classifieur rend a_verifier : le gate doit lire le statut avant le verdict.
        expect(await getModerations(jobId)).toEqual([expect.objectContaining({ verdict: "a_verifier", status: "indisponible" })])
        expect((await getDbCollection("jobs_partners").findOne({ _id: jobId }))?.offer_status).toBe(JOB_STATUS_ENGLISH.EN_MODERATION)
      })

      it("bloque une offre dont la classification dépasse l'échéance", async () => {
        const timeoutMs = config.moderation.classificationTimeoutMs
        config.moderation.classificationTimeoutMs = 50
        vi.mocked(sendMistralMessages).mockImplementation(async ({ messages, signal }) => {
          if (messages[0]?.content !== CLASSIFICATION_SYSTEM_PROMPT) return null
          await new Promise((resolve) => signal?.addEventListener("abort", resolve))
          return null
        })
        try {
          const { cookies, formulaire } = await entrepriseSdkInstance.createAndGetConnectedUser()
          const jobId = await createOfferWithTexts({ cookies, establishment_id: formulaire!.establishment_id, job_description: CONFORME })

          const [moderation] = await getModerations(jobId)
          expect(moderation).toMatchObject({ status: "indisponible" })
          expect(moderation.duration_ms).toBeGreaterThanOrEqual(50)
          expect((await getDbCollection("jobs_partners").findOne({ _id: jobId }))?.offer_status).toBe(JOB_STATUS_ENGLISH.EN_MODERATION)
        } finally {
          config.moderation.classificationTimeoutMs = timeoutMs
        }
      })

      it("n'envoie aucun e-mail au recruteur à l'entrée en modération", async () => {
        const { cookies, formulaire } = await entrepriseSdkInstance.createAndGetConnectedUser()
        const establishment_id = formulaire!.establishment_id
        // La première offre d'un compte n'a jamais de mail « publiée » (cf. createJob) : seules les suivantes comptent.
        await createOfferWithTexts({ cookies, establishment_id, job_description: CONFORME })
        vi.mocked(mailer.sendEmail).mockClear()

        await createOfferWithTexts({ cookies, establishment_id, job_description: BLOQUANT })
        expect(publishedMails()).toHaveLength(0)

        // Le témoin : une offre conforme déposée dans les mêmes conditions est annoncée.
        await createOfferWithTexts({ cookies, establishment_id, job_description: CONFORME })
        expect(publishedMails()).toHaveLength(1)
      })

      it("met en modération une offre active dont l'édition est non conforme", async () => {
        const { cookies, formulaire } = await entrepriseSdkInstance.createAndGetConnectedUser()
        const jobId = await createOfferWithTexts({ cookies, establishment_id: formulaire!.establishment_id, job_description: CONFORME })

        const response = await updateOfferTexts({ jobId, cookies, job_description: BLOQUANT })

        expect(response.statusCode).toBe(200)
        const offer = await getDbCollection("jobs_partners").findOne({ _id: jobId })
        expect(offer).toMatchObject({ offer_status: JOB_STATUS_ENGLISH.EN_MODERATION, offer_moderation_verdict: "non_conforme", offer_moderation_review: null })
        expect(offer?.offer_status_history).toEqual([expect.objectContaining({ status: JOB_STATUS_ENGLISH.EN_MODERATION, granted_by: "classifier" })])
        expect((await getModerations(jobId)).map(({ trigger, verdict }) => [trigger, verdict])).toEqual([
          ["creation", "conforme"],
          ["edition", "non_conforme"],
        ])
      })

      it("publie une offre en modération corrigée par le recruteur, avec le mail de première publication", async () => {
        const { cookies, formulaire } = await entrepriseSdkInstance.createAndGetConnectedUser()
        const jobId = await createOfferWithTexts({ cookies, establishment_id: formulaire!.establishment_id, job_description: BLOQUANT })
        vi.mocked(mailer.sendEmail).mockClear()

        const response = await updateOfferTexts({ jobId, cookies, job_description: CONFORME })

        expect(response.statusCode).toBe(200)
        const offer = await getDbCollection("jobs_partners").findOne({ _id: jobId })
        expect(offer).toMatchObject({ offer_status: JOB_STATUS_ENGLISH.ACTIVE, offer_moderation_verdict: "conforme" })
        expect(offer?.offer_status_history.map(({ status }) => status)).toEqual([JOB_STATUS_ENGLISH.EN_MODERATION, JOB_STATUS_ENGLISH.ACTIVE])
        expect(publishedMails()).toHaveLength(1)
      })

      it("ne reclassifie pas une édition qui renvoie le texte enregistré, même si la passe IA varie", async () => {
        let moderationCalls = 0
        const classifier = vi.mocked(sendMistralMessages).getMockImplementation()
        vi.mocked(sendMistralMessages).mockImplementation(async (params) => {
          if (params.messages[0]?.content === CLASSIFICATION_SYSTEM_PROMPT) return classifier!(params)
          const userText = params.messages.find(({ role }) => role === "user")?.content ?? ""
          return JSON.stringify({ text: `${userText} (passe ${++moderationCalls})` })
        })
        const { cookies, formulaire } = await entrepriseSdkInstance.createAndGetConnectedUser()
        const jobId = await createOfferWithTexts({ cookies, establishment_id: formulaire!.establishment_id, job_description: CONFORME })
        const stored = (await entrepriseSdkInstance.getOffer({ jobId: jobId.toString(), cookies })).json() as GetOfferResponse

        const response = await updateOfferTexts({ jobId, cookies, job_description: stored.job_description! })

        expect(response.statusCode).toBe(200)
        expect(moderationCalls).toBeGreaterThanOrEqual(2)
        expect(await getModerations(jobId)).toHaveLength(1)
      })

      it("garde en modération une offre éditée sans changement de texte, quel que soit le statut envoyé", async () => {
        const { cookies, formulaire } = await entrepriseSdkInstance.createAndGetConnectedUser()
        const jobId = await createOfferWithTexts({ cookies, establishment_id: formulaire!.establishment_id, job_description: BLOQUANT })
        const offer = (await entrepriseSdkInstance.getOffer({ jobId: jobId.toString(), cookies })).json() as GetOfferResponse

        const response = await entrepriseSdkInstance.updateOffer({
          jobId: jobId.toString(),
          cookies,
          body: { ...jobToJobPatch(offer), competences_rome: referentielRome.competences, job_status: JOB_STATUS.ACTIVE, job_description: BLOQUANT },
        })

        expect(response.statusCode).toBe(200)
        expect((await getDbCollection("jobs_partners").findOne({ _id: jobId }))?.offer_status).toBe(JOB_STATUS_ENGLISH.EN_MODERATION)
        expect(await getModerations(jobId)).toHaveLength(1)
      })
    })
  })
})
