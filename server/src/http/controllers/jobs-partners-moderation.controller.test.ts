import { createAndLogUser, logUser } from "@tests/utils/login.test.utils"
import { useMongo } from "@tests/utils/mongo.test.utils"
import { useServer } from "@tests/utils/server.test.utils"
import { entrepriseStatusEventFactory, roleManagementEventFactory, saveCfaUserTest, saveEntrepriseUserTest, validatedUserStatus } from "@tests/utils/user.test.utils"
import { addJob } from "job-processor"
import { ObjectId } from "mongodb"
import { OPCOS_LABEL } from "shared/constants/recruteur"
import { generateJobsPartnersOfferPrivate } from "shared/fixtures/job-partners.fixture"
import dayjs from "shared/helpers/dayjs"
import { JOB_STATUS, JOB_STATUS_ENGLISH, OFFER_DESCRIPTION_MODE } from "shared/models/job.model"
import type { IJobsPartnersOfferPrivate } from "shared/models/jobs-partners.model"
import { JOBPARTNERS_LABEL } from "shared/models/jobs-partners.model"
import type { IJobsPartnersModeration } from "shared/models/jobs-partners-moderation.model"
import { MODERATION_CATEGORY_NOTES } from "shared/models/jobs-partners-moderation-notes"
import { AccessStatus } from "shared/models/role-management.model"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { getDbCollection } from "@/common/utils/mongodb-utils"
import config from "@/config"
import { MAIL_OFFRE_REFUSEE_SUBJECT } from "@/services/formulaire-notifications.service"
import mailer from "@/services/mailer.service"
import { sendMistralMessages } from "@/services/mistralai/mistralai.service"

vi.mock("@/services/mailer.service", () => ({ default: { sendEmail: vi.fn().mockResolvedValue({}) } }))
vi.mock("@/services/mistralai/mistralai.service", () => ({ sendMistralMessages: vi.fn() }))
vi.mock("@/common/utils/slack-utils")
vi.mock("job-processor", async (importOriginal) => {
  const mod = await importOriginal<typeof import("job-processor")>()
  return { ...mod, addJob: vi.fn().mockResolvedValue(undefined) }
})

const T0 = new Date("2026-10-01T08:00:00.000Z")
const ORIGINAL_TEXT = "Texte saisi par le recruteur, joignable au 06 12 34 56 78"
const FINDING = { champ: "job_description", category: "mineurs", severity: "bloquant", verbatim: "réservé aux majeurs" } as const

let siretSequence = 0
const nextSiret = () => String(12000001500000 + ++siretSequence)

const saveRecruiter = async ({
  roleStatus = AccessStatus.GRANTED,
  email,
  raisonSociale = "Boulangerie du test",
}: {
  roleStatus?: AccessStatus
  email?: string
  raisonSociale?: string
} = {}) =>
  saveEntrepriseUserTest(
    { status: validatedUserStatus, ...(email ? { email } : {}) },
    { status: [roleManagementEventFactory({ status: roleStatus })] },
    { siret: nextSiret(), status: [entrepriseStatusEventFactory()], raison_sociale: raisonSociale }
  )

type IRecruiter = Awaited<ReturnType<typeof saveRecruiter>>

const saveModeratedOffer = async (
  recruiter: IRecruiter,
  { offer: offerOverrides = {}, moderation: moderationOverrides = {} }: { offer?: Partial<IJobsPartnersOfferPrivate>; moderation?: Partial<IJobsPartnersModeration> } = {}
) => {
  const offer = generateJobsPartnersOfferPrivate({
    partner_label: JOBPARTNERS_LABEL.OFFRES_EMPLOI_LBA,
    managed_by: recruiter.user._id,
    workplace_siret: recruiter.entreprise.siret,
    workplace_legal_name: "Boulangerie du test",
    workplace_opco: OPCOS_LABEL.AKTO,
    offer_description_mode: OFFER_DESCRIPTION_MODE.CUSTOM,
    offer_description: "Description masquée de l'offre",
    workplace_description: null,
    offer_status: JOB_STATUS_ENGLISH.EN_MODERATION,
    // Bloquée dès son dépôt : cf. isFirstPublication.
    offer_status_history: [{ status: JOB_STATUS_ENGLISH.EN_MODERATION, reason: "contenu non conforme selon le classifieur", date: T0, granted_by: "classifier" }],
    offer_moderation_verdict: "non_conforme",
    offer_moderation_status: "ok",
    offer_moderation_review: null,
    offer_expiration: dayjs(T0).add(2, "month").toDate(),
    created_at: T0,
    updated_at: T0,
    ...offerOverrides,
  })
  await getDbCollection("jobs_partners").insertOne(offer)
  const moderation: IJobsPartnersModeration = {
    _id: new ObjectId(),
    job_id: offer._id,
    trigger: "creation",
    verdict: offer.offer_moderation_verdict ?? "non_conforme",
    status: offer.offer_moderation_status === "ok" ? "ok" : "indisponible",
    findings: [FINDING],
    original_text: { job_description: ORIGINAL_TEXT, job_employer_description: null },
    masked_text: { job_description: "Description masquée de l'offre", job_employer_description: null },
    prompt_version: "1.3.0",
    model: "mistral-large-2512",
    duration_ms: 2_000,
    review: null,
    created_at: T0,
    ...moderationOverrides,
  }
  await getDbCollection("jobs_partners_moderations").insertOne(moderation)
  return { offer, moderation }
}

const getOffer = async (id: ObjectId) => getDbCollection("jobs_partners").findOne({ _id: id })
const getModeration = async (id: ObjectId) => getDbCollection("jobs_partners_moderations").findOne({ _id: id })
const sentEmails = () => vi.mocked(mailer.sendEmail).mock.calls.map(([email]) => email as { to: string; subject: string; data: Record<string, any> })

describe("modération des offres libres (#5499)", () => {
  useMongo()
  const httpClient = useServer()

  beforeEach(() => {
    vi.mocked(mailer.sendEmail)
      .mockReset()
      .mockResolvedValue({} as any)
    vi.mocked(sendMistralMessages).mockReset()
  })

  const loginAdmin = () => createAndLogUser(httpClient, "admin-moderation", { type: "ADMIN" })
  // createAndLogUser crée un OPCO AKTO.
  const loginOpcoAkto = () => createAndLogUser(httpClient, "opco-moderation", { type: "OPCO" })

  const inject = async ({ method, path, headers, body }: { method: "GET" | "POST"; path: string; headers: Record<string, string>; body?: object }) =>
    httpClient().inject({ method, path: `/api${path}`, headers, ...(body ? { body } : {}) })

  describe("accès", () => {
    // Une réponse 403 ferme la session (cf. errorMiddleware) : chaque appel refusé part d'une connexion neuve.
    it("refuse le recruteur de l'offre, qui porte pourtant job:manage sur elle", async () => {
      const recruiter = await saveRecruiter({ email: "recruteur-moderation@mail.com" })
      const { offer, moderation } = await saveModeratedOffer(recruiter)
      const headers = async () => (await logUser(httpClient, "recruteur-moderation")).bearerToken

      const detail = await inject({ method: "GET", path: `/moderation/jobs/${offer._id}`, headers: await headers() })
      const validate = await inject({
        method: "POST",
        path: `/moderation/jobs/${offer._id}/validate`,
        headers: await headers(),
        body: { moderation_id: moderation._id.toString() },
      })
      const queue = await inject({ method: "GET", path: "/moderation/jobs", headers: await headers() })

      expect([detail.statusCode, validate.statusCode, queue.statusCode]).toEqual([403, 403, 403])
      expect((await getOffer(offer._id))?.offer_status).toBe(JOB_STATUS_ENGLISH.EN_MODERATION)
    })

    it("refuse à un OPCO une offre d'une entreprise d'un autre OPCO, et la retire de sa file", async () => {
      const recruiter = await saveRecruiter()
      const { offer, moderation } = await saveModeratedOffer(recruiter, { offer: { workplace_opco: OPCOS_LABEL.ATLAS } })
      await loginOpcoAkto()
      const headers = async () => (await logUser(httpClient, "opco-moderation")).bearerToken

      const detail = await inject({ method: "GET", path: `/moderation/jobs/${offer._id}`, headers: await headers() })
      const refuse = await inject({
        method: "POST",
        path: `/moderation/jobs/${offer._id}/refuse`,
        headers: await headers(),
        body: { moderation_id: moderation._id.toString(), agent_note: false },
      })
      // Le filtre OPCO de l'écran ne permet pas d'élargir le périmètre.
      const queue = await inject({ method: "GET", path: `/moderation/jobs?opco=${encodeURIComponent(OPCOS_LABEL.ATLAS)}`, headers: await headers() })
      const summary = await inject({ method: "GET", path: `/moderation/jobs/summary?ids=${offer._id}`, headers: await headers() })

      expect([detail.statusCode, refuse.statusCode]).toEqual([403, 403])
      expect(queue.json().jobs).toEqual([])
      expect(summary.json().jobs).toEqual([])
      expect((await getOffer(offer._id))?.offer_status).toBe(JOB_STATUS_ENGLISH.EN_MODERATION)
    })

    it("laisse un OPCO valider et refuser les offres de son OPCO comme un administrateur", async () => {
      const recruiter = await saveRecruiter()
      const toValidate = await saveModeratedOffer(recruiter)
      const toRefuse = await saveModeratedOffer(recruiter)
      const { bearerToken, user } = await loginOpcoAkto()

      const validate = await inject({
        method: "POST",
        path: `/moderation/jobs/${toValidate.offer._id}/validate`,
        headers: bearerToken,
        body: { moderation_id: toValidate.moderation._id.toString() },
      })
      const refuse = await inject({
        method: "POST",
        path: `/moderation/jobs/${toRefuse.offer._id}/refuse`,
        headers: bearerToken,
        body: { moderation_id: toRefuse.moderation._id.toString(), agent_note: true },
      })

      expect(validate.json()).toEqual({ offer_status: JOB_STATUS_ENGLISH.ACTIVE })
      expect(refuse.json()).toEqual({ offer_status: JOB_STATUS_ENGLISH.ANNULEE, email_sent: true })
      expect((await getModeration(toValidate.moderation._id))?.review).toMatchObject({ status: "validee", by: user.email })
      expect((await getModeration(toRefuse.moderation._id))?.review).toMatchObject({ status: "refusee", by: user.email })
    })

    it("réserve la relance en masse aux administrateurs", async () => {
      const { bearerToken } = await loginOpcoAkto()

      const response = await inject({ method: "POST", path: "/moderation/jobs/reclassify", headers: bearerToken })

      expect(response.statusCode).toBe(403)
    })
  })

  describe("valider", () => {
    it("laisse publiée une offre en ligne, trace la décision et n'envoie aucun e-mail", async () => {
      const recruiter = await saveRecruiter()
      const { offer, moderation } = await saveModeratedOffer(recruiter, {
        offer: { offer_status: JOB_STATUS_ENGLISH.ACTIVE, offer_moderation_verdict: "a_verifier", offer_status_history: [] },
      })
      const { bearerToken, user } = await loginAdmin()

      const response = await inject({ method: "POST", path: `/moderation/jobs/${offer._id}/validate`, headers: bearerToken, body: { moderation_id: moderation._id.toString() } })

      expect(response.json()).toEqual({ offer_status: JOB_STATUS_ENGLISH.ACTIVE })
      const updated = await getOffer(offer._id)
      expect(updated).toMatchObject({ offer_status: JOB_STATUS_ENGLISH.ACTIVE, offer_moderation_review: "validee", offer_status_history: [] })
      expect((await getModeration(moderation._id))?.review).toMatchObject({ status: "validee", by: user.email })
      expect(sentEmails()).toEqual([])
    })

    it("publie une offre bloquée dès son dépôt, avec l'e-mail et le partage aux CFA différés, et une expiration repartie pour deux mois", async () => {
      const recruiter = await saveRecruiter()
      const delegations = [{ email: "cfa@mail.fr", siret_code: "13002526500013", etablissement_id: "etab-1" }]
      const { offer, moderation } = await saveModeratedOffer(recruiter, { offer: { delegations } })
      const { bearerToken, user } = await loginAdmin()
      const before = new Date()

      const response = await inject({ method: "POST", path: `/moderation/jobs/${offer._id}/validate`, headers: bearerToken, body: { moderation_id: moderation._id.toString() } })

      expect(response.json()).toEqual({ offer_status: JOB_STATUS_ENGLISH.ACTIVE })
      const updated = await getOffer(offer._id)
      expect(updated).toMatchObject({ offer_status: JOB_STATUS_ENGLISH.ACTIVE, offer_moderation_review: "validee" })
      expect(updated?.offer_status_history.at(-1)).toMatchObject({ status: JOB_STATUS_ENGLISH.ACTIVE, reason: "offre validée par la modération", granted_by: user.email })
      expect(updated?.offer_expiration).toEqual(dayjs(before).add(2, "months").startOf("day").toDate())
      expect(sentEmails().map(({ to, subject }) => [to, subject])).toEqual([
        [recruiter.user.email, expect.stringContaining("est publiée")],
        ["cfa@mail.fr", "Une entreprise recrute dans votre domaine"],
        [recruiter.user.email, "Votre offre a été partagée à 1 école(s)"],
      ])
    })

    it("mentionne une décision prise sans verdict IA quand les nouvelles tentatives ont échoué", async () => {
      const recruiter = await saveRecruiter()
      const { offer, moderation } = await saveModeratedOffer(recruiter, {
        offer: { offer_moderation_verdict: "a_verifier", offer_moderation_status: "epuise" },
        moderation: { findings: [] },
      })
      const { bearerToken } = await loginAdmin()

      await inject({ method: "POST", path: `/moderation/jobs/${offer._id}/validate`, headers: bearerToken, body: { moderation_id: moderation._id.toString() } })

      expect((await getModeration(moderation._id))?.review).toMatchObject({ status: "validee", without_verdict: true })
    })

    it("refuse une seconde décision", async () => {
      const recruiter = await saveRecruiter()
      const { offer, moderation } = await saveModeratedOffer(recruiter)
      const { bearerToken } = await loginAdmin()
      const body = { moderation_id: moderation._id.toString() }

      await inject({ method: "POST", path: `/moderation/jobs/${offer._id}/validate`, headers: bearerToken, body })
      const second = await inject({ method: "POST", path: `/moderation/jobs/${offer._id}/refuse`, headers: bearerToken, body: { ...body, agent_note: false } })

      expect(second.statusCode).toBe(409)
      expect((await getOffer(offer._id))?.offer_status).toBe(JOB_STATUS_ENGLISH.ACTIVE)
    })

    it("refuse une décision sur une classification remplacée par une édition", async () => {
      const recruiter = await saveRecruiter()
      const { offer, moderation } = await saveModeratedOffer(recruiter)
      await getDbCollection("jobs_partners_moderations").insertOne({ ...moderation, _id: new ObjectId(), trigger: "edition", created_at: dayjs(T0).add(1, "hour").toDate() })
      const { bearerToken } = await loginAdmin()

      const response = await inject({ method: "POST", path: `/moderation/jobs/${offer._id}/validate`, headers: bearerToken, body: { moderation_id: moderation._id.toString() } })

      expect(response.statusCode).toBe(409)
      expect((await getOffer(offer._id))?.offer_status).toBe(JOB_STATUS_ENGLISH.EN_MODERATION)
    })

    it.each([
      ["en attente de validation", AccessStatus.AWAITING_VALIDATION],
      ["désactivé", AccessStatus.DENIED],
    ])("refuse Valider et Refuser sur un compte %s", async (_label, roleStatus) => {
      const recruiter = await saveRecruiter({ roleStatus })
      const { offer, moderation } = await saveModeratedOffer(recruiter)
      const { bearerToken } = await loginAdmin()
      const body = { moderation_id: moderation._id.toString() }

      const validate = await inject({ method: "POST", path: `/moderation/jobs/${offer._id}/validate`, headers: bearerToken, body })
      const refuse = await inject({ method: "POST", path: `/moderation/jobs/${offer._id}/refuse`, headers: bearerToken, body: { ...body, agent_note: true } })
      const detail = await inject({ method: "GET", path: `/moderation/jobs/${offer._id}`, headers: bearerToken })

      expect([validate.statusCode, refuse.statusCode]).toEqual([400, 400])
      expect(detail.json().decision_blocked_reason).toBe("compte_non_valide")
      expect(sentEmails()).toEqual([])
    })

    it("motive par le compte, et non par la clôture, le blocage d'une offre en attente de la validation du compte", async () => {
      const recruiter = await saveRecruiter({ roleStatus: AccessStatus.AWAITING_VALIDATION })
      const enAttente = await saveModeratedOffer(recruiter, { offer: { offer_status: JOB_STATUS_ENGLISH.EN_ATTENTE, offer_status_history: [] } })
      const close = await saveModeratedOffer(recruiter, { offer: { offer_status: JOB_STATUS_ENGLISH.ANNULEE, offer_status_history: [] } })
      const { bearerToken } = await loginAdmin()
      const blockedReason = async (id: ObjectId) => (await inject({ method: "GET", path: `/moderation/jobs/${id}`, headers: bearerToken })).json().decision_blocked_reason

      const validate = await inject({
        method: "POST",
        path: `/moderation/jobs/${enAttente.offer._id}/validate`,
        headers: bearerToken,
        body: { moderation_id: enAttente.moderation._id.toString() },
      })

      expect(await blockedReason(enAttente.offer._id)).toBe("compte_non_valide")
      expect(await blockedReason(close.offer._id)).toBe("statut")
      expect(validate.statusCode).toBe(400)
      expect((await getOffer(enAttente.offer._id))?.offer_status).toBe(JOB_STATUS_ENGLISH.EN_ATTENTE)
    })
  })

  describe("refuser", () => {
    it("annule l'offre et envoie l'e-mail de refus avec la note de l'agent et le commentaire", async () => {
      const recruiter = await saveRecruiter()
      const { offer, moderation } = await saveModeratedOffer(recruiter)
      const { bearerToken, user } = await loginAdmin()

      const response = await inject({
        method: "POST",
        path: `/moderation/jobs/${offer._id}/refuse`,
        headers: bearerToken,
        body: { moderation_id: moderation._id.toString(), agent_note: true, comment: "  Merci de préciser les horaires.  " },
      })

      expect(response.json()).toEqual({ offer_status: JOB_STATUS_ENGLISH.ANNULEE, email_sent: true })
      const updated = await getOffer(offer._id)
      expect(updated).toMatchObject({ offer_status: JOB_STATUS_ENGLISH.ANNULEE, offer_moderation_review: "refusee" })
      expect(updated?.offer_status_history.at(-1)).toMatchObject({ status: JOB_STATUS_ENGLISH.ANNULEE, reason: "offre refusée par la modération", granted_by: user.email })
      expect((await getModeration(moderation._id))?.review).toMatchObject({ status: "refusee", message: "Merci de préciser les horaires.", agent_note_sent: true })
      const [email] = sentEmails()
      expect(email).toMatchObject({ to: recruiter.user.email, subject: MAIL_OFFRE_REFUSEE_SUBJECT })
      expect(email.data.comment).toBe("Merci de préciser les horaires.")
      expect(email.data.agent_note).toEqual([`Dans la description de l’offre, vous avez écrit “réservé aux majeurs”. ${MODERATION_CATEGORY_NOTES.mineurs}`])
    })

    it("envoie un e-mail générique sans note ni commentaire, y compris pour une offre en ligne", async () => {
      const recruiter = await saveRecruiter()
      const { offer, moderation } = await saveModeratedOffer(recruiter, { offer: { offer_status: JOB_STATUS_ENGLISH.ACTIVE, offer_moderation_verdict: "a_verifier" } })
      const { bearerToken } = await loginAdmin()

      await inject({
        method: "POST",
        path: `/moderation/jobs/${offer._id}/refuse`,
        headers: bearerToken,
        body: { moderation_id: moderation._id.toString(), agent_note: false, comment: "   " },
      })

      expect((await getOffer(offer._id))?.offer_status).toBe(JOB_STATUS_ENGLISH.ANNULEE)
      expect(sentEmails().map(({ data }) => ({ agent_note: data.agent_note, comment: data.comment }))).toEqual([{ agent_note: [], comment: null }])
      expect((await getModeration(moderation._id))?.review).toMatchObject({ message: null, agent_note_sent: false })
    })

    it("signale un e-mail non envoyé sans rendre la décision rejouable", async () => {
      const recruiter = await saveRecruiter()
      const { offer, moderation } = await saveModeratedOffer(recruiter)
      vi.mocked(mailer.sendEmail).mockRejectedValue(new Error("SMTP indisponible"))
      const { bearerToken } = await loginAdmin()

      const response = await inject({
        method: "POST",
        path: `/moderation/jobs/${offer._id}/refuse`,
        headers: bearerToken,
        body: { moderation_id: moderation._id.toString(), agent_note: true },
      })

      expect(response.json()).toEqual({ offer_status: JOB_STATUS_ENGLISH.ANNULEE, email_sent: false })
      expect((await getOffer(offer._id))?.offer_moderation_review).toBe("refusee")
    })
  })

  describe("relancer l'analyse", () => {
    const classifierReturns = (verdict: "conforme" | "non_conforme") =>
      vi
        .mocked(sendMistralMessages)
        .mockResolvedValue(JSON.stringify({ verdict, findings: verdict === "conforme" ? [] : [{ category: "discrimination", severity: "bloquant", verbatim: "extrait" }] }))

    afterEach(() => {
      config.moderation.enforce = false
    })

    it("publie une offre bloquée faute d'analyse quand l'analyse relancée la juge conforme", async () => {
      config.moderation.enforce = true
      classifierReturns("conforme")
      const recruiter = await saveRecruiter()
      const { offer } = await saveModeratedOffer(recruiter, { offer: { offer_moderation_verdict: "a_verifier", offer_moderation_status: "indisponible" } })
      const { bearerToken } = await loginAdmin()

      const response = await inject({ method: "POST", path: `/moderation/jobs/${offer._id}/reclassify`, headers: bearerToken })

      expect(response.json()).toEqual({ verdict: "conforme", status: "ok", offer_status: JOB_STATUS_ENGLISH.ACTIVE })
      const moderations = await getDbCollection("jobs_partners_moderations")
        .find({ job_id: offer._id }, { sort: { created_at: -1 } })
        .toArray()
      expect(moderations[0]).toMatchObject({ trigger: "relance_admin", original_text: { job_description: ORIGINAL_TEXT } })
    })

    it("laisse en ligne une offre publiée sans verdict et la met dans la file si l'analyse la juge non conforme", async () => {
      classifierReturns("non_conforme")
      const recruiter = await saveRecruiter()
      const { offer } = await saveModeratedOffer(recruiter, {
        offer: { offer_status: JOB_STATUS_ENGLISH.ACTIVE, offer_moderation_verdict: "a_verifier", offer_moderation_status: "indisponible", offer_status_history: [] },
      })
      const { bearerToken } = await loginAdmin()

      const response = await inject({ method: "POST", path: `/moderation/jobs/${offer._id}/reclassify`, headers: bearerToken })
      const queue = await inject({ method: "GET", path: "/moderation/jobs?conformity=non_conforme", headers: bearerToken })

      expect(response.json()).toEqual({ verdict: "non_conforme", status: "ok", offer_status: JOB_STATUS_ENGLISH.ACTIVE })
      expect(queue.json().jobs.map(({ _id }) => _id)).toEqual([offer._id.toString()])
    })

    it("bloque, blocage actif, une offre publiée que l'analyse relancée juge non conforme, mais pas sur une panne du classifieur", async () => {
      config.moderation.enforce = true
      const recruiter = await saveRecruiter()
      const published: Partial<IJobsPartnersOfferPrivate> = {
        offer_status: JOB_STATUS_ENGLISH.ACTIVE,
        offer_moderation_verdict: "a_verifier",
        offer_moderation_status: "indisponible",
        offer_status_history: [],
      }
      const nonConforme = await saveModeratedOffer(recruiter, { offer: published })
      const panne = await saveModeratedOffer(recruiter, { offer: published })
      const { bearerToken } = await loginAdmin()

      classifierReturns("non_conforme")
      await inject({ method: "POST", path: `/moderation/jobs/${nonConforme.offer._id}/reclassify`, headers: bearerToken })
      vi.mocked(sendMistralMessages).mockResolvedValue(null)
      await inject({ method: "POST", path: `/moderation/jobs/${panne.offer._id}/reclassify`, headers: bearerToken })

      expect(await getOffer(nonConforme.offer._id)).toMatchObject({ offer_status: JOB_STATUS_ENGLISH.EN_MODERATION, offer_moderation_verdict: "non_conforme" })
      expect((await getOffer(nonConforme.offer._id))?.offer_status_history.at(-1)).toMatchObject({ status: JOB_STATUS_ENGLISH.EN_MODERATION })
      expect(await getOffer(panne.offer._id)).toMatchObject({ offer_status: JOB_STATUS_ENGLISH.ACTIVE, offer_moderation_status: "indisponible" })
    })

    it("refuse de relancer une analyse qui a abouti", async () => {
      const recruiter = await saveRecruiter()
      const { offer } = await saveModeratedOffer(recruiter)
      const { bearerToken } = await loginAdmin()

      const response = await inject({ method: "POST", path: `/moderation/jobs/${offer._id}/reclassify`, headers: bearerToken })

      expect(response.statusCode).toBe(400)
      expect(sendMistralMessages).not.toHaveBeenCalled()
    })

    it("lance la reprise en masse quand des analyses en échec l'attendent, et seulement alors", async () => {
      vi.mocked(addJob).mockClear()
      const { bearerToken } = await loginAdmin()

      const sansAttente = await inject({ method: "POST", path: "/moderation/jobs/reclassify", headers: bearerToken })
      expect(sansAttente.json()).toEqual({ pending: 0 })
      expect(addJob).not.toHaveBeenCalled()

      await saveModeratedOffer(await saveRecruiter(), { offer: { offer_moderation_verdict: "a_verifier", offer_moderation_status: "epuise" } })
      const avecAttente = await inject({ method: "POST", path: "/moderation/jobs/reclassify", headers: bearerToken })

      expect(avecAttente.json()).toEqual({ pending: 1 })
      expect(addJob).toHaveBeenCalledExactlyOnceWith({ name: "repriseExhaustedClassifications", queued: true })
    })
  })

  describe("file des offres à modérer", () => {
    it("ne garde que les offres à vérifier, non conformes ou sans analyse, publiées ou bloquées et sans décision", async () => {
      const recruiter = await saveRecruiter()
      const at = (hours: number) => dayjs(T0).add(hours, "hour").toDate()
      const nonConforme = await saveModeratedOffer(recruiter, { offer: { created_at: at(1) } })
      const aVerifier = await saveModeratedOffer(recruiter, { offer: { offer_status: JOB_STATUS_ENGLISH.ACTIVE, offer_moderation_verdict: "a_verifier", created_at: at(2) } })
      const indisponible = await saveModeratedOffer(recruiter, { offer: { offer_moderation_verdict: "a_verifier", offer_moderation_status: "epuise", created_at: at(3) } })
      // Hors de la file : conforme, déjà décidée, close par le recruteur, jamais classifiée, offre partenaire.
      await saveModeratedOffer(recruiter, { offer: { offer_status: JOB_STATUS_ENGLISH.ACTIVE, offer_moderation_verdict: "conforme" } })
      await saveModeratedOffer(recruiter, { offer: { offer_status: JOB_STATUS_ENGLISH.ACTIVE, offer_moderation_review: "validee" } })
      await saveModeratedOffer(recruiter, { offer: { offer_status: JOB_STATUS_ENGLISH.POURVUE } })
      await getDbCollection("jobs_partners").insertOne(
        generateJobsPartnersOfferPrivate({ partner_label: JOBPARTNERS_LABEL.OFFRES_EMPLOI_LBA, managed_by: recruiter.user._id, offer_status: JOB_STATUS_ENGLISH.ACTIVE })
      )
      await saveModeratedOffer(recruiter, { offer: { partner_label: "Hellowork" } })
      const { bearerToken } = await loginAdmin()

      const response = await inject({ method: "GET", path: "/moderation/jobs", headers: bearerToken })

      expect(response.json().pagination.total).toBe(3)
      expect(response.json().jobs.map(({ _id }) => _id)).toEqual([indisponible, aVerifier, nonConforme].map(({ offer }) => offer._id.toString()))
      expect(response.json().jobs[0].recruiter).toMatchObject({ email: recruiter.user.email, account_type: "ENTREPRISE", account_status: AccessStatus.GRANTED })
    })

    it("filtre la conformité sur l'issue de l'analyse avant le verdict, qui vaut à vérifier en cas d'échec", async () => {
      const recruiter = await saveRecruiter()
      const aVerifier = await saveModeratedOffer(recruiter, { offer: { offer_status: JOB_STATUS_ENGLISH.ACTIVE, offer_moderation_verdict: "a_verifier" } })
      const indisponible = await saveModeratedOffer(recruiter, { offer: { offer_moderation_verdict: "a_verifier", offer_moderation_status: "indisponible" } })
      const { bearerToken } = await loginAdmin()

      const aVerifierOnly = await inject({ method: "GET", path: "/moderation/jobs?conformity=a_verifier", headers: bearerToken })
      const indisponibleOnly = await inject({ method: "GET", path: "/moderation/jobs?conformity=indisponible", headers: bearerToken })

      expect(aVerifierOnly.json().jobs.map(({ _id }) => _id)).toEqual([aVerifier.offer._id.toString()])
      expect(indisponibleOnly.json().jobs.map(({ _id }) => _id)).toEqual([indisponible.offer._id.toString()])
    })

    it("filtre sur le statut et le type du compte, offres de CFA comprises", async () => {
      const active = await saveModeratedOffer(await saveRecruiter())
      const awaiting = await saveModeratedOffer(await saveRecruiter({ roleStatus: AccessStatus.AWAITING_VALIDATION }))
      const {
        user: cfaUser,
        cfa,
        entreprise,
      } = await saveCfaUserTest({ status: validatedUserStatus }, { siret: nextSiret(), raison_sociale: "CFA du test" }, { siret: nextSiret() })
      const delegated = await saveModeratedOffer({ user: cfaUser, entreprise } as IRecruiter, {
        offer: { is_delegated: true, cfa_siret: cfa.siret, cfa_legal_name: cfa.raison_sociale },
      })
      const { bearerToken } = await loginAdmin()

      const awaitingOnly = await inject({ method: "GET", path: `/moderation/jobs?account_status=${AccessStatus.AWAITING_VALIDATION}`, headers: bearerToken })
      const grantedCfa = await inject({ method: "GET", path: `/moderation/jobs?account_status=${AccessStatus.GRANTED}&account_type=CFA`, headers: bearerToken })
      const entreprises = await inject({ method: "GET", path: "/moderation/jobs?account_type=ENTREPRISE", headers: bearerToken })

      expect(awaitingOnly.json().jobs.map(({ _id }) => _id)).toEqual([awaiting.offer._id.toString()])
      expect(grantedCfa.json().jobs.map(({ _id }) => _id)).toEqual([delegated.offer._id.toString()])
      expect(grantedCfa.json().jobs[0].recruiter).toMatchObject({ account_type: "CFA", account_status: AccessStatus.GRANTED, organization_id: cfa._id.toString() })
      expect(
        entreprises
          .json()
          .jobs.map(({ _id }) => _id)
          .sort()
      ).toEqual([active, awaiting].map(({ offer }) => offer._id.toString()).sort())
    })

    it("trie la file sur toutes les offres, pas seulement sur la page affichée", async () => {
      // Raisons sociales de l'offre croisées avec celles des entreprises : le tri par recruteur suit le nom affiché.
      const nonConforme = await saveModeratedOffer(await saveRecruiter({ raisonSociale: "Zénith" }), { offer: { offer_title: "Boulanger", workplace_legal_name: "atelier" } })
      const indisponible = await saveModeratedOffer(await saveRecruiter({ raisonSociale: "atelier" }), {
        offer: { offer_title: "agent d'accueil", workplace_legal_name: "Zénith", offer_moderation_verdict: "a_verifier", offer_moderation_status: "epuise" },
      })
      const aVerifier = await saveModeratedOffer(await saveRecruiter({ raisonSociale: "Bistrot" }), {
        offer: { offer_title: "Cuisinier", workplace_legal_name: "Bistrot", offer_status: JOB_STATUS_ENGLISH.ACTIVE, offer_moderation_verdict: "a_verifier" },
      })
      const { bearerToken } = await loginAdmin()
      const firstOfPage = async (query: string) => (await inject({ method: "GET", path: `/moderation/jobs?limit=1&${query}`, headers: bearerToken })).json().jobs[0]._id

      expect(await firstOfPage("sort=offer_title&order=asc")).toBe(indisponible.offer._id.toString())
      expect(await firstOfPage("sort=conformity&order=asc")).toBe(nonConforme.offer._id.toString())
      expect(await firstOfPage("sort=conformity&order=desc")).toBe(indisponible.offer._id.toString())
      expect(await firstOfPage("sort=recruiter&order=asc")).toBe(indisponible.offer._id.toString())
      expect(await firstOfPage("sort=recruiter&order=desc")).toBe(nonConforme.offer._id.toString())
      expect(await firstOfPage(`sort=recruiter&order=asc&account_status=${AccessStatus.GRANTED}`)).toBe(indisponible.offer._id.toString())
      expect(await firstOfPage("sort=offer_status&order=asc")).toBe(aVerifier.offer._id.toString())
    })

    it("recherche par e-mail du recruteur, SIRET, raison sociale ou identifiant", async () => {
      const recruiter = await saveRecruiter({ email: "Contact.Recherche@mail.com" })
      const { offer } = await saveModeratedOffer(recruiter, { offer: { workplace_legal_name: "Menuiserie Dupuis" } })
      await saveModeratedOffer(await saveRecruiter())
      const { bearerToken } = await loginAdmin()

      for (const search of ["contact.recherche@mail.com", recruiter.entreprise.siret, "menuiserie dup", offer._id.toString()]) {
        const response = await inject({ method: "GET", path: `/moderation/jobs?search=${encodeURIComponent(search)}`, headers: bearerToken })
        expect(
          response.json().jobs.map(({ _id }) => _id),
          search
        ).toEqual([offer._id.toString()])
      }
    })

    it("ne renvoie le texte saisi par le recruteur que par l'historique", async () => {
      const recruiter = await saveRecruiter()
      const { offer } = await saveModeratedOffer(recruiter)
      const { bearerToken } = await loginAdmin()

      const queue = await inject({ method: "GET", path: "/moderation/jobs", headers: bearerToken })
      const detail = await inject({ method: "GET", path: `/moderation/jobs/${offer._id}`, headers: bearerToken })
      const summary = await inject({ method: "GET", path: `/moderation/jobs/summary?ids=${offer._id}`, headers: bearerToken })
      const history = await inject({ method: "GET", path: `/moderation/jobs/${offer._id}/history`, headers: bearerToken })

      for (const response of [queue, detail, summary]) {
        expect(response.statusCode).toBe(200)
        expect(response.body).not.toContain(ORIGINAL_TEXT)
        expect(response.body).not.toContain("original_text")
      }
      expect(detail.json().moderation.findings).toEqual([FINDING])
      expect(history.json().moderations[0].original_text).toEqual({ job_description: ORIGINAL_TEXT, job_employer_description: null })
    })

    it("résume pour la fiche entreprise les constats de la dernière classification de chaque offre", async () => {
      const recruiter = await saveRecruiter()
      const { offer, moderation } = await saveModeratedOffer(recruiter)
      await getDbCollection("jobs_partners_moderations").insertOne({
        ...moderation,
        _id: new ObjectId(),
        findings: [{ ...FINDING, category: "remuneration", verbatim: "extrait d'une analyse plus ancienne" }],
        created_at: dayjs(T0).subtract(1, "day").toDate(),
      })
      const { bearerToken } = await loginAdmin()

      const response = await inject({ method: "GET", path: `/moderation/jobs/summary?ids=${offer._id}`, headers: bearerToken })

      expect(response.json().jobs).toEqual([
        { _id: offer._id.toString(), offer_moderation_verdict: "non_conforme", offer_moderation_status: "ok", offer_moderation_review: null, findings: [FINDING] },
      ])
    })
  })

  describe("chemins qui sortaient une offre de modération sans décision", () => {
    it("refuse la réactivation d'une offre en modération par la route d'administration des offres", async () => {
      const recruiter = await saveRecruiter()
      const { offer } = await saveModeratedOffer(recruiter)
      const { bearerToken } = await loginAdmin()

      const response = await inject({ method: "POST", path: `/admin/jobs-partners/${offer._id}/activate`, headers: bearerToken })

      expect(response.statusCode).toBe(400)
      expect((await getOffer(offer._id))?.offer_status).toBe(JOB_STATUS_ENGLISH.EN_MODERATION)
    })

    it("refuse la clôture d'une offre en modération par un administrateur, pas par son recruteur", async () => {
      const recruiter = await saveRecruiter({ email: "recruteur-cloture@mail.com" })
      const { offer } = await saveModeratedOffer(recruiter)
      const body = { job_status: JOB_STATUS.ANNULEE, job_status_comment: "Autre" }
      const { bearerToken: adminToken } = await loginAdmin()

      const byAdmin = await httpClient().inject({ method: "PUT", path: `/api/formulaire/offre/f/${offer._id}/cancel`, headers: adminToken, body })
      expect(byAdmin.statusCode).toBe(400)
      expect((await getOffer(offer._id))?.offer_status).toBe(JOB_STATUS_ENGLISH.EN_MODERATION)

      const { bearerToken: recruiterToken } = await logUser(httpClient, "recruteur-cloture")
      const byRecruiter = await httpClient().inject({ method: "PUT", path: `/api/formulaire/offre/f/${offer._id}/cancel`, headers: recruiterToken, body })
      expect(byRecruiter.statusCode).toBe(200)
      expect((await getOffer(offer._id))?.offer_status).toBe(JOB_STATUS_ENGLISH.ANNULEE)
    })
  })
})
