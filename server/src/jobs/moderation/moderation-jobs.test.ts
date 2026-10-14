import { useMongo } from "@tests/utils/mongo.test.utils"
import { entrepriseStatusEventFactory, saveEntrepriseUserTest, validatedUserStatus } from "@tests/utils/user.test.utils"
import { ObjectId } from "mongodb"
import { generateJobsPartnersOfferPrivate } from "shared/fixtures/job-partners.fixture"
import dayjs from "shared/helpers/dayjs"
import type { IEntreprise, IUserWithAccount } from "shared/models/index"
import { JOB_STATUS_ENGLISH, OFFER_DESCRIPTION_MODE } from "shared/models/job.model"
import type { IJobsPartnersOfferPrivate } from "shared/models/jobs-partners.model"
import { JOBPARTNERS_LABEL } from "shared/models/jobs-partners.model"
import type { IJobsPartnersModeration } from "shared/models/jobs-partners-moderation.model"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { getDbCollection } from "@/common/utils/mongodb-utils"
import { notifyToSlack } from "@/common/utils/slack-utils"
import mailer from "@/services/mailer.service"
import { sendMistralMessages } from "@/services/mistralai/mistralai.service"
import { purgeModerationTexts } from "./purge-moderation-texts"
import { rejeuClassificationOffres } from "./rejeu-classification"
import { REPRISE_CLASSIFICATION_JOB_NAME, repriseExhaustedClassifications, retryUnavailableClassifications } from "./retry-classification"

vi.mock("@/services/mistralai/mistralai.service", () => ({ sendMistralMessages: vi.fn() }))
vi.mock("@/common/utils/slack-utils")
vi.mock("@/services/mailer.service", () => ({ default: { sendEmail: vi.fn().mockResolvedValue({}) } }))

useMongo()

const T0 = new Date("2026-10-20T08:00:00.000Z")
const MINUTE = 60 * 1000
const classifierFails = () => vi.mocked(sendMistralMessages).mockResolvedValue(null)
const classifierReturns = (verdict: "conforme" | "non_conforme") =>
  vi
    .mocked(sendMistralMessages)
    .mockResolvedValue(JSON.stringify({ verdict, findings: verdict === "conforme" ? [] : [{ category: "discrimination", severity: "bloquant", verbatim: "extrait" }] }))

let siretSequence = 0
const nextSiret = () => String(11000001500000 + ++siretSequence)

const saveAccount = (userStatus = validatedUserStatus) => saveEntrepriseUserTest({ status: userStatus }, {}, { siret: nextSiret(), status: [entrepriseStatusEventFactory()] })

const saveOffer = async ({ user, entreprise }: { user: IUserWithAccount; entreprise: IEntreprise }, overrides: Partial<IJobsPartnersOfferPrivate> = {}) => {
  const offer = generateJobsPartnersOfferPrivate({
    partner_label: JOBPARTNERS_LABEL.OFFRES_EMPLOI_LBA,
    managed_by: user._id,
    workplace_siret: entreprise.siret,
    workplace_description: null,
    offer_description_mode: OFFER_DESCRIPTION_MODE.CUSTOM,
    offer_description: "Description rédigée par le recruteur, à classifier.",
    offer_status: JOB_STATUS_ENGLISH.EN_MODERATION,
    offer_status_history: [],
    offer_moderation_verdict: "a_verifier",
    offer_moderation_status: "indisponible",
    offer_moderation_review: null,
    created_at: T0,
    ...overrides,
  })
  await getDbCollection("jobs_partners").insertOne(offer)
  return offer
}

const saveModeration = async (jobId: ObjectId, overrides: Partial<IJobsPartnersModeration> = {}) => {
  const moderation: IJobsPartnersModeration = {
    _id: new ObjectId(),
    job_id: jobId,
    trigger: "creation",
    verdict: "a_verifier",
    status: "indisponible",
    findings: [],
    original_text: { job_description: "Texte saisi", job_employer_description: null },
    masked_text: { job_description: "Texte saisi", job_employer_description: null },
    prompt_version: "1.3.0",
    model: "mistral-large-2512",
    duration_ms: 10_000,
    review: null,
    created_at: T0,
    ...overrides,
  }
  await getDbCollection("jobs_partners_moderations").insertOne(moderation)
  return moderation
}

const getModerations = (jobId: ObjectId) =>
  getDbCollection("jobs_partners_moderations")
    .find({ job_id: jobId }, { sort: { created_at: 1 } })
    .toArray()

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] })
  vi.setSystemTime(T0)
  vi.mocked(sendMistralMessages).mockReset()
  vi.mocked(notifyToSlack).mockReset()
  vi.mocked(mailer.sendEmail).mockClear()
})

afterEach(() => {
  vi.useRealTimers()
})

describe("retryUnavailableClassifications", () => {
  it("attend 5 min après l'échec du dépôt avant la première nouvelle tentative", async () => {
    const offer = await saveOffer(await saveAccount())
    await saveModeration(offer._id)
    classifierFails()

    vi.setSystemTime(new Date(T0.getTime() + 4 * MINUTE))
    expect(await retryUnavailableClassifications()).toMatchObject({ pending: 1, due: 0, attempted: 0 })
    expect(sendMistralMessages).not.toHaveBeenCalled()

    vi.setSystemTime(new Date(T0.getTime() + 5 * MINUTE))
    expect(await retryUnavailableClassifications()).toMatchObject({ due: 1, attempted: 1 })
  })

  it("passe epuise après trois échecs, puis la reprise reclasse les offres", async () => {
    const account = await saveAccount()
    const offers = await Promise.all([1, 2, 3].map(() => saveOffer(account)))
    await Promise.all(offers.map((offer) => saveModeration(offer._id)))
    classifierFails()

    // Une exécution toutes les 5 min : le circuit breaker n'en essaie qu'une par exécution.
    for (let minutes = 5; minutes <= 6 * 60; minutes += 5) {
      vi.setSystemTime(new Date(T0.getTime() + minutes * MINUTE))
      await retryUnavailableClassifications()
    }

    for (const offer of offers) {
      const moderations = await getModerations(offer._id)
      expect(moderations.map(({ trigger, status }) => [trigger, status])).toEqual([
        ["creation", "indisponible"],
        ["retry", "indisponible"],
        ["retry", "indisponible"],
        ["retry", "indisponible"],
      ])
      // Backoff de 5 min, 20 min puis 1 h, au plus tôt.
      const gaps = moderations.slice(1).map(({ created_at }, index) => created_at.getTime() - moderations[index].created_at.getTime())
      gaps.forEach((gap, index) => expect(gap).toBeGreaterThanOrEqual([5, 20, 60][index] * MINUTE))
      expect(await getDbCollection("jobs_partners").findOne({ _id: offer._id })).toMatchObject({
        offer_status: JOB_STATUS_ENGLISH.EN_MODERATION,
        offer_moderation_status: "epuise",
      })
    }
    const retryEpuiseAlerts = vi.mocked(notifyToSlack).mock.calls.filter(([{ message }]) => message.includes("après toutes les nouvelles tentatives"))
    expect(retryEpuiseAlerts).toHaveLength(3)

    classifierReturns("conforme")
    vi.setSystemTime(dayjs(T0).add(1, "day").toDate())
    expect(await repriseExhaustedClassifications()).toMatchObject({ pending: 3, attempted: 3, released: 3 })

    for (const offer of offers) {
      const released = await getDbCollection("jobs_partners").findOne({ _id: offer._id })
      expect(released).toMatchObject({ offer_status: JOB_STATUS_ENGLISH.ACTIVE, offer_moderation_status: "ok", offer_moderation_verdict: "conforme" })
      expect(released?.offer_status_history).toEqual([expect.objectContaining({ status: JOB_STATUS_ENGLISH.ACTIVE, granted_by: REPRISE_CLASSIFICATION_JOB_NAME })])
      expect((await getModerations(offer._id)).at(-1)).toMatchObject({ trigger: "reprise", status: "ok" })
    }
  })

  it("n'essaie qu'une offre quand le classifieur est indisponible, et n'alerte qu'une fois par heure", async () => {
    const account = await saveAccount()
    const offers = await Promise.all(Array.from({ length: 50 }, () => saveOffer(account)))
    await Promise.all(offers.map((offer) => saveModeration(offer._id)))
    classifierFails()

    vi.setSystemTime(new Date(T0.getTime() + 5 * MINUTE))
    expect(await retryUnavailableClassifications()).toMatchObject({ pending: 50, due: 50, attempted: 1, circuitOpen: true })
    // Une seule offre classifiée, sur son seul champ rempli.
    expect(sendMistralMessages).toHaveBeenCalledTimes(1)
    expect(await getDbCollection("jobs_partners_moderations").countDocuments({ trigger: "retry" })).toBe(1)
    expect(notifyToSlack).toHaveBeenCalledTimes(1)

    vi.setSystemTime(new Date(T0.getTime() + 10 * MINUTE))
    await retryUnavailableClassifications()
    expect(notifyToSlack).toHaveBeenCalledTimes(1)
  })

  it("garde en modération une offre que la nouvelle tentative juge non conforme, et alerte", async () => {
    const offer = await saveOffer(await saveAccount())
    await saveModeration(offer._id)
    classifierReturns("non_conforme")

    vi.setSystemTime(new Date(T0.getTime() + 5 * MINUTE))
    expect(await retryUnavailableClassifications()).toMatchObject({ attempted: 1, blocked: 1, released: 0 })

    expect(await getDbCollection("jobs_partners").findOne({ _id: offer._id })).toMatchObject({
      offer_status: JOB_STATUS_ENGLISH.EN_MODERATION,
      offer_moderation_status: "ok",
      offer_moderation_verdict: "non_conforme",
    })
    // Le texte saisi, connu de la classification du dépôt, accompagne chaque nouvelle tentative.
    expect((await getModerations(offer._id)).at(-1)?.original_text).toEqual({ job_description: "Texte saisi", job_employer_description: null })
    expect(notifyToSlack).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining(`Offre ${offer._id} bloquée`) }))
  })

  it("garde un verdict réel obtenu à la dernière tentative, sans passer epuise", async () => {
    const offer = await saveOffer(await saveAccount())
    await saveModeration(offer._id)
    await Promise.all([5, 25].map((minutes) => saveModeration(offer._id, { trigger: "retry", created_at: new Date(T0.getTime() + minutes * MINUTE) })))
    classifierReturns("non_conforme")

    vi.setSystemTime(new Date(T0.getTime() + 2 * 60 * MINUTE))
    await retryUnavailableClassifications()

    expect(await getDbCollection("jobs_partners").findOne({ _id: offer._id })).toMatchObject({
      offer_status: JOB_STATUS_ENGLISH.EN_MODERATION,
      offer_moderation_status: "ok",
      offer_moderation_verdict: "non_conforme",
    })
  })

  it("laisse en attente une offre libérée dont le compte n'est pas encore validé", async () => {
    const account = await saveAccount([])
    const offer = await saveOffer(account)
    await saveModeration(offer._id)
    classifierReturns("conforme")

    vi.setSystemTime(new Date(T0.getTime() + 5 * MINUTE))
    await retryUnavailableClassifications()

    expect((await getDbCollection("jobs_partners").findOne({ _id: offer._id }))?.offer_status).toBe(JOB_STATUS_ENGLISH.EN_ATTENTE)
  })

  it("ignore les offres sorties de modération et celles qui ont un verdict", async () => {
    const account = await saveAccount()
    const cancelled = await saveOffer(account, { offer_status: JOB_STATUS_ENGLISH.ANNULEE })
    const blocked = await saveOffer(account, { offer_moderation_status: "ok", offer_moderation_verdict: "non_conforme" })
    await Promise.all([cancelled, blocked].map((offer) => saveModeration(offer._id)))
    classifierReturns("conforme")

    vi.setSystemTime(new Date(T0.getTime() + 5 * MINUTE))
    expect(await retryUnavailableClassifications()).toMatchObject({ pending: 0, attempted: 0 })
  })
})

describe("première publication d'une offre bloquée dès son dépôt", () => {
  const delegations = [{ email: "cfa@mail.fr", siret_code: "13002526500013", etablissement_id: "etab-1" }]
  const blockedAt = (date: Date) => ({ status: JOB_STATUS_ENGLISH.EN_MODERATION, reason: "classification indisponible", date, granted_by: "classifier" })
  const sentMails = () => vi.mocked(mailer.sendEmail).mock.calls.map(([{ to, subject }]) => [to, subject])

  it("envoie le mail « publiée » et partage l'offre aux CFA à sa publication", async () => {
    const account = await saveAccount()
    const offer = await saveOffer(account, { delegations, offer_status_history: [blockedAt(T0)] })
    await saveModeration(offer._id)
    classifierReturns("conforme")

    vi.setSystemTime(new Date(T0.getTime() + 5 * MINUTE))
    await retryUnavailableClassifications()

    expect(sentMails()).toEqual([
      [account.user.email, expect.stringContaining("est publiée")],
      ["cfa@mail.fr", "Une entreprise recrute dans votre domaine"],
      [account.user.email, "Votre offre a été partagée à 1 école(s)"],
    ])
  })

  it.each([
    ["re-bloquée après une édition", [blockedAt(new Date(T0.getTime() + MINUTE))]],
    ["déjà publiée une première fois", [blockedAt(T0), { ...blockedAt(T0), status: JOB_STATUS_ENGLISH.ACTIVE }, blockedAt(new Date(T0.getTime() + MINUTE))]],
  ])("n'annonce pas de nouveau une offre %s", async (_label, offer_status_history) => {
    const account = await saveAccount()
    const offer = await saveOffer(account, { delegations, offer_status_history })
    await saveModeration(offer._id)
    classifierReturns("conforme")

    vi.setSystemTime(new Date(T0.getTime() + 5 * MINUTE))
    await retryUnavailableClassifications()

    expect((await getDbCollection("jobs_partners").findOne({ _id: offer._id }))?.offer_status).toBe(JOB_STATUS_ENGLISH.ACTIVE)
    expect(sentMails()).toEqual([])
  })
})

describe("repriseExhaustedClassifications", () => {
  it("laisse l'offre epuise quand le classifieur reste indisponible, et alerte", async () => {
    const account = await saveAccount()
    const offers = await Promise.all([1, 2].map(() => saveOffer(account, { offer_moderation_status: "epuise" })))
    classifierFails()

    expect(await repriseExhaustedClassifications()).toMatchObject({ pending: 2, attempted: 1, unavailable: 1, circuitOpen: true })

    const [first] = offers
    expect(await getDbCollection("jobs_partners").findOne({ _id: first._id })).toMatchObject({
      offer_status: JOB_STATUS_ENGLISH.EN_MODERATION,
      offer_moderation_status: "epuise",
    })
    expect(await getModerations(first._id)).toEqual([expect.objectContaining({ trigger: "reprise", status: "indisponible" })])
    expect(notifyToSlack).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining("Classifieur indisponible") }))
  })
})

describe("purgeModerationTexts", () => {
  it("efface les textes et les extraits au-delà d'un an, et garde le verdict", async () => {
    const offer = await saveOffer(await saveAccount())
    const finding = { champ: "job_description", category: "discrimination", severity: "bloquant", verbatim: "extrait" } as const
    const old = await saveModeration(offer._id, { created_at: dayjs(T0).subtract(1, "year").subtract(1, "day").toDate(), verdict: "non_conforme", findings: [finding] })
    const recent = await saveModeration(offer._id, { created_at: dayjs(T0).subtract(1, "year").add(1, "day").toDate(), findings: [finding] })

    expect(await purgeModerationTexts()).toEqual({ modifiedCount: 1 })

    expect(await getDbCollection("jobs_partners_moderations").findOne({ _id: old._id })).toMatchObject({
      verdict: "non_conforme",
      original_text: null,
      masked_text: null,
      findings: [{ ...finding, verbatim: null }],
    })
    expect(await getDbCollection("jobs_partners_moderations").findOne({ _id: recent._id })).toMatchObject({ masked_text: recent.masked_text, findings: [finding] })
  })
})

describe("rejeuClassificationOffres", () => {
  it("classifie les offres actives à texte libre sans toucher aux offres", async () => {
    const account = await saveAccount()
    const custom = await saveOffer(account, { offer_status: JOB_STATUS_ENGLISH.ACTIVE })
    const employerOnly = await saveOffer(account, {
      offer_status: JOB_STATUS_ENGLISH.ACTIVE,
      offer_description_mode: OFFER_DESCRIPTION_MODE.STRUCTURED,
      workplace_description: "Présentation de l'entreprise.",
    })
    const structured = await saveOffer(account, { offer_status: JOB_STATUS_ENGLISH.ACTIVE, offer_description_mode: OFFER_DESCRIPTION_MODE.STRUCTURED })
    const pending = await saveOffer(account, { offer_status: JOB_STATUS_ENGLISH.EN_ATTENTE })
    classifierReturns("non_conforme")

    const result = await rejeuClassificationOffres()

    expect(result).toMatchObject({ selected: 2, classified: 2, verdicts: { non_conforme: 2, conforme: 0, a_verifier: 0, indisponible: 0 } })
    expect(await getModerations(custom._id)).toEqual([expect.objectContaining({ trigger: "rejeu", original_text: null })])
    expect(await getModerations(employerOnly._id)).toEqual([
      expect.objectContaining({ masked_text: { job_description: null, job_employer_description: "Présentation de l'entreprise." } }),
    ])
    expect(await getModerations(structured._id)).toEqual([])
    expect(await getModerations(pending._id)).toEqual([])
    // Collection seule : ni le statut ni les champs de modération de l'offre ne bougent.
    expect(await getDbCollection("jobs_partners").findOne({ _id: custom._id })).toMatchObject({
      offer_status: JOB_STATUS_ENGLISH.ACTIVE,
      offer_moderation_verdict: "a_verifier",
      offer_moderation_status: "indisponible",
    })
  })

  it.each([
    ["--concurrency", { concurrency: "abc" }],
    ["--concurrency", { concurrency: "0" }],
    ["--limit", { limit: "-3" }],
  ])("refuse une option %s invalide au lieu de ne rien classifier", async (option, payload) => {
    await expect(rejeuClassificationOffres(payload)).rejects.toThrow(option)
    expect(sendMistralMessages).not.toHaveBeenCalled()
  })
})
