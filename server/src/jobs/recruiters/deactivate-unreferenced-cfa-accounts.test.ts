import { useMongo } from "@tests/utils/mongo.test.utils"
import { roleManagementEventFactory, saveCfa, saveRoleManagement, saveUserWithAccount } from "@tests/utils/user.test.utils"
import type { ObjectId } from "mongodb"
import { VALIDATION_UTILISATEUR } from "shared/constants/recruteur"
import { generateJobsPartnersOfferPrivate } from "shared/fixtures/job-partners.fixture"
import { JOB_STATUS_ENGLISH } from "shared/models/job.model"
import type { IJobsPartnersOfferPrivate } from "shared/models/jobs-partners.model"
import { JOBPARTNERS_LABEL } from "shared/models/jobs-partners.model"
import { AccessEntityType, AccessStatus, CFA_NOT_REFERENCED_REASON } from "shared/models/role-management.model"
import { getLastStatusEvent } from "shared/utils/get-last-status-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

import type { IReferentielOnisepPresence } from "@/common/apis/referentiel-onisep/referentiel-onisep.client"
import { getReferentielOnisepPresence, getReferentielOnisepSirets } from "@/common/apis/referentiel-onisep/referentiel-onisep.client"
import { getDbCollection } from "@/common/utils/mongodb-utils"
import { sentryCaptureException } from "@/common/utils/sentry-utils"
import { notifyToSlack } from "@/common/utils/slack-utils"
import { modifyPermissionToUser } from "@/services/role-management.service"
import { isUserDisabled } from "@/services/user-with-account.service"
import type { IDeactivateUnreferencedCfaOptions } from "./deactivate-unreferenced-cfa-accounts"
import { deactivateUnreferencedCfaAccounts, UNREFERENCED_CFA_JOB_NAME } from "./deactivate-unreferenced-cfa-accounts"

vi.mock("@/common/apis/referentiel-onisep/referentiel-onisep.client", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/common/apis/referentiel-onisep/referentiel-onisep.client")>()),
  getReferentielOnisepSirets: vi.fn(),
  getReferentielOnisepPresence: vi.fn(),
}))
vi.mock("@/common/utils/slack-utils")
vi.mock("@/common/utils/sentry-utils")
vi.mock("@/services/role-management.service", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/services/role-management.service")>()
  return { ...original, modifyPermissionToUser: vi.fn(original.modifyPermissionToUser) }
})

useMongo()

const SIRET_REFERENCE = "13002526500013"
const SIRET_ABSENT = "35306634300016"
/** Même SIREN que SIRET_ABSENT, autre établissement. */
const SIRET_MEME_SIREN = "35306634300024"
const AUTRE_SIRET_ABSENT = "42476141900045"

// Antérieure aux événements posés par le job : getLastStatusEvent départage les dates égales au hasard.
const PAST = new Date("2025-01-01T00:00:00.000Z")

/** Les garde-fous de volumétrie ont leurs propres tests : ailleurs, une base de quelques CFA les déclencherait. */
const run = (options: IDeactivateUnreferencedCfaOptions = {}) => deactivateUnreferencedCfaAccounts({ minReferentielSize: 0, maxDeactivationRatio: 1, ...options })

const mockReferentiel = (sirets: string[], presence: Record<string, IReferentielOnisepPresence> = {}) => {
  vi.mocked(getReferentielOnisepSirets).mockResolvedValue(new Set(sirets))
  vi.mocked(getReferentielOnisepPresence).mockImplementation(async (siret) => presence[siret] ?? { kind: "absent" })
}

const saveCfaAccount = async (siret: string, status: AccessStatus = AccessStatus.GRANTED) => {
  const user = await saveUserWithAccount()
  const cfa = (await getDbCollection("cfas").findOne({ siret })) ?? (await saveCfa({ siret }))
  const role = await saveRoleManagement({
    user_id: user._id,
    authorized_id: cfa._id.toString(),
    authorized_type: AccessEntityType.CFA,
    status: [roleManagementEventFactory({ date: PAST, status })],
  })
  return { user, cfa, role }
}

const insertOffer = async (partner_job_id: string, overrides: Partial<IJobsPartnersOfferPrivate>) => {
  await getDbCollection("jobs_partners").insertOne(
    generateJobsPartnersOfferPrivate({
      partner_job_id,
      partner_label: JOBPARTNERS_LABEL.OFFRES_EMPLOI_LBA,
      offer_status: JOB_STATUS_ENGLISH.ACTIVE,
      offer_status_history: [],
      ...overrides,
    })
  )
}

const offerStatuses = async () => Object.fromEntries((await getDbCollection("jobs_partners").find({}).toArray()).map((offer) => [offer.partner_job_id, offer.offer_status]))
const lastRoleStatus = async (roleId: ObjectId) => getLastStatusEvent((await getDbCollection("rolemanagements").findOne({ _id: roleId }))?.status)

describe("deactivateUnreferencedCfaAccounts", () => {
  beforeEach(() => {
    vi.mocked(getReferentielOnisepSirets).mockReset()
    vi.mocked(getReferentielOnisepPresence).mockReset()
    vi.mocked(notifyToSlack).mockClear()
    vi.mocked(sentryCaptureException).mockClear()
    vi.mocked(modifyPermissionToUser).mockClear()
  })

  describe("ne désactive aucun CFA référencé", () => {
    it("laisse intact un CFA présent dans la liste, sans appel unitaire", async () => {
      const { role } = await saveCfaAccount(SIRET_REFERENCE)
      await insertOffer("offre", { cfa_siret: SIRET_REFERENCE })
      mockReferentiel([SIRET_REFERENCE])

      const report = await run()

      expect.soft(report).toMatchObject({ cfasWithActiveRole: 1, absentFromList: 0, deactivatedCfas: [] })
      expect.soft((await lastRoleStatus(role._id))?.status).toBe(AccessStatus.GRANTED)
      expect.soft(await offerStatuses()).toEqual({ offre: JOB_STATUS_ENGLISH.ACTIVE })
      expect.soft(getReferentielOnisepPresence).not.toHaveBeenCalled()
    })

    it("compare le SIRET entier : un établissement du même SIREN au Référentiel ne couvre pas le CFA", async () => {
      const { role } = await saveCfaAccount(SIRET_ABSENT)
      mockReferentiel([SIRET_MEME_SIREN])

      const report = await run()

      expect.soft(report.deactivatedCfas.map(({ siret }) => siret)).toEqual([SIRET_ABSENT])
      expect.soft((await lastRoleStatus(role._id))?.status).toBe(AccessStatus.DENIED)
    })

    it("laisse intact un CFA absent de la liste mais trouvé à l'appel unitaire", async () => {
      const { role } = await saveCfaAccount(SIRET_ABSENT)
      mockReferentiel([SIRET_REFERENCE], { [SIRET_ABSENT]: { kind: "present" } })

      const report = await run()

      expect.soft(report).toMatchObject({ absentFromList: 1, presentOnRecheck: 1, deactivatedCfas: [] })
      expect.soft((await lastRoleStatus(role._id))?.status).toBe(AccessStatus.GRANTED)
      expect.soft(vi.mocked(notifyToSlack).mock.calls[0]?.[0]).toMatchObject({ error: false })
    })

    it("ne conclut pas sur une erreur du Référentiel, et termine en échec", async () => {
      const { role } = await saveCfaAccount(SIRET_ABSENT)
      mockReferentiel([SIRET_REFERENCE], { [SIRET_ABSENT]: { kind: "error", reason: "HTTP 503" } })

      await expect(run()).rejects.toThrow(/1 erreurs techniques/)

      expect.soft((await lastRoleStatus(role._id))?.status).toBe(AccessStatus.GRANTED)
      expect.soft(vi.mocked(notifyToSlack).mock.calls[0]?.[0]).toMatchObject({ error: true })
    })

    it("ignore les CFA sans rôle actif", async () => {
      await saveCfaAccount(SIRET_ABSENT, AccessStatus.DENIED)
      await saveCfa({ siret: AUTRE_SIRET_ABSENT })
      mockReferentiel([SIRET_REFERENCE])

      const report = await run()

      expect.soft(report).toMatchObject({ cfasWithActiveRole: 0, absentFromList: 0, rolesDenied: 0 })
      expect.soft(getReferentielOnisepPresence).not.toHaveBeenCalled()
      expect.soft(modifyPermissionToUser).not.toHaveBeenCalled()
    })
  })

  it("ignore et compte un rôle actif dont le CFA est introuvable ou l'identifiant illisible", async () => {
    const { role } = await saveCfaAccount(SIRET_ABSENT)
    await saveRoleManagement({ authorized_id: "id", authorized_type: AccessEntityType.CFA, status: [roleManagementEventFactory({ date: PAST })] })
    await saveRoleManagement({ authorized_id: "0123456789abcdef01234567", authorized_type: AccessEntityType.CFA, status: [roleManagementEventFactory({ date: PAST })] })
    mockReferentiel([SIRET_REFERENCE])

    const report = await run()

    expect.soft(report).toMatchObject({ rolesWithoutCfa: 2, cfasWithActiveRole: 1, rolesDenied: 1 })
    expect.soft((await lastRoleStatus(role._id))?.status).toBe(AccessStatus.DENIED)
  })

  describe("CFA absent du Référentiel", () => {
    it("désactive tous ses rôles actifs avec le motif existant, en validation automatique", async () => {
      const granted = await saveCfaAccount(SIRET_ABSENT, AccessStatus.GRANTED)
      const awaiting = await saveCfaAccount(SIRET_ABSENT, AccessStatus.AWAITING_VALIDATION)
      mockReferentiel([SIRET_REFERENCE])

      const report = await run()

      expect.soft(report).toMatchObject({ cfasWithActiveRole: 1, rolesDenied: 2 })
      expect.soft(report.deactivatedCfas.map(({ siret }) => siret)).toEqual([SIRET_ABSENT])
      for (const { role } of [granted, awaiting]) {
        expect.soft(await lastRoleStatus(role._id)).toMatchObject({
          status: AccessStatus.DENIED,
          reason: CFA_NOT_REFERENCED_REASON,
          validation_type: VALIDATION_UTILISATEUR.AUTO,
          granted_by: UNREFERENCED_CFA_JOB_NAME,
        })
      }
    })

    it("ne désactive pas le compte utilisateur", async () => {
      const { user } = await saveCfaAccount(SIRET_ABSENT)
      mockReferentiel([SIRET_REFERENCE])

      await run()

      const saved = await getDbCollection("userswithaccounts").findOne({ _id: user._id })
      expect(saved && isUserDisabled(saved)).toBe(false)
    })

    it("annule ses offres déléguées en cours, et seulement celles-là", async () => {
      await saveCfaAccount(SIRET_ABSENT)
      await saveCfaAccount(SIRET_REFERENCE)
      await insertOffer("active", { cfa_siret: SIRET_ABSENT })
      await insertOffer("en-attente", { cfa_siret: SIRET_ABSENT, offer_status: JOB_STATUS_ENGLISH.EN_ATTENTE })
      await insertOffer("pourvue", { cfa_siret: SIRET_ABSENT, offer_status: JOB_STATUS_ENGLISH.POURVUE })
      await insertOffer("partenaire-externe", { cfa_siret: SIRET_ABSENT, partner_label: JOBPARTNERS_LABEL.HELLOWORK })
      await insertOffer("autre-cfa", { cfa_siret: SIRET_REFERENCE })
      mockReferentiel([SIRET_REFERENCE])

      const report = await run()

      expect.soft(report.offersCancelled).toBe(2)
      expect.soft(await offerStatuses()).toEqual({
        active: JOB_STATUS_ENGLISH.ANNULEE,
        "en-attente": JOB_STATUS_ENGLISH.ANNULEE,
        pourvue: JOB_STATUS_ENGLISH.POURVUE,
        "partenaire-externe": JOB_STATUS_ENGLISH.ACTIVE,
        "autre-cfa": JOB_STATUS_ENGLISH.ACTIVE,
      })
      const offer = await getDbCollection("jobs_partners").findOne({ partner_job_id: "active" })
      expect
        .soft(offer?.offer_status_history)
        .toEqual([expect.objectContaining({ status: JOB_STATUS_ENGLISH.ANNULEE, reason: CFA_NOT_REFERENCED_REASON, granted_by: UNREFERENCED_CFA_JOB_NAME })])
    })

    it("ne touche pas au champ lastUpdateFromSource, réservé à la lecture INSEE", async () => {
      const { cfa } = await saveCfaAccount(SIRET_ABSENT)
      await getDbCollection("cfas").updateOne({ _id: cfa._id }, { $set: { lastUpdateFromSource: null } })
      mockReferentiel([SIRET_REFERENCE])

      await run()

      expect((await getDbCollection("cfas").findOne({ _id: cfa._id }))?.lastUpdateFromSource ?? null).toBeNull()
    })

    it("est idempotent : relancé, il ne modifie plus rien", async () => {
      const { role } = await saveCfaAccount(SIRET_ABSENT)
      await insertOffer("active", { cfa_siret: SIRET_ABSENT })
      mockReferentiel([SIRET_REFERENCE])

      await run()
      const second = await run()

      expect.soft(second).toMatchObject({ cfasWithActiveRole: 0, rolesDenied: 0, offersCancelled: 0, deactivatedCfas: [] })
      expect.soft((await getDbCollection("rolemanagements").findOne({ _id: role._id }))?.status).toHaveLength(2)
    })

    it("liste les CFA dans le rapport Slack", async () => {
      await saveCfaAccount(SIRET_ABSENT)
      mockReferentiel([SIRET_REFERENCE])

      await run()

      const [notification] = vi.mocked(notifyToSlack).mock.calls[0] ?? []
      expect.soft(notification).toMatchObject({ error: false })
      expect.soft(notification?.message).toContain(SIRET_ABSENT)
    })
  })

  describe("dry-run", () => {
    it("rapporte les rôles et offres concernés sans rien écrire", async () => {
      const { role } = await saveCfaAccount(SIRET_ABSENT)
      await insertOffer("active", { cfa_siret: SIRET_ABSENT })
      mockReferentiel([SIRET_REFERENCE])

      const report = await run({ dryRun: true })

      expect.soft(report).toMatchObject({ dryRun: true, rolesDenied: 1, offersCancelled: 1 })
      expect.soft(report.deactivatedCfas.map(({ siret }) => siret)).toEqual([SIRET_ABSENT])
      expect.soft((await lastRoleStatus(role._id))?.status).toBe(AccessStatus.GRANTED)
      expect.soft(await offerStatuses()).toEqual({ active: JOB_STATUS_ENGLISH.ACTIVE })
      expect.soft(modifyPermissionToUser).not.toHaveBeenCalled()
    })
  })

  describe("garde-fous : arrêt avant toute écriture", () => {
    it("s'arrête si la liste du Référentiel compte moins d'organismes que le minimum", async () => {
      const { role } = await saveCfaAccount(SIRET_ABSENT)
      mockReferentiel([SIRET_REFERENCE])

      await expect(run({ minReferentielSize: 2 })).rejects.toThrow(/1 organismes reçus du Référentiel/)

      expect.soft((await lastRoleStatus(role._id))?.status).toBe(AccessStatus.GRANTED)
      expect.soft(getReferentielOnisepPresence).not.toHaveBeenCalled()
      expect.soft(vi.mocked(notifyToSlack).mock.calls[0]?.[0]).toMatchObject({ error: true })
    })

    it("s'arrête si la part de CFA absents dépasse le seuil", async () => {
      const absent = await saveCfaAccount(SIRET_ABSENT)
      await saveCfaAccount(SIRET_REFERENCE)
      mockReferentiel([SIRET_REFERENCE])

      await expect(run({ maxDeactivationRatio: 0.4 })).rejects.toThrow(/1 CFA sur 2 absents de la liste/)

      expect.soft((await lastRoleStatus(absent.role._id))?.status).toBe(AccessStatus.GRANTED)
      expect.soft(getReferentielOnisepPresence).not.toHaveBeenCalled()
    })

    it("applique le seuil à 50 % pile sans s'arrêter", async () => {
      await saveCfaAccount(SIRET_ABSENT)
      await saveCfaAccount(SIRET_REFERENCE)
      mockReferentiel([SIRET_REFERENCE])

      const report = await run({ maxDeactivationRatio: 0.5 })

      expect(report.deactivatedCfas).toHaveLength(1)
    })

    it("s'arrête si la liste du Référentiel est illisible", async () => {
      const { role } = await saveCfaAccount(SIRET_ABSENT)
      vi.mocked(getReferentielOnisepSirets).mockRejectedValue(new Error("Référentiel Onisep : 10 SIRET distincts reçus pour un total annoncé de 11528"))

      await expect(run()).rejects.toThrow(/lecture du Référentiel impossible/)

      expect.soft((await lastRoleStatus(role._id))?.status).toBe(AccessStatus.GRANTED)
      expect.soft(vi.mocked(notifyToSlack).mock.calls[0]?.[0]).toMatchObject({ error: true })
    })

    it("exige par défaut au moins 5 000 organismes", async () => {
      await saveCfaAccount(SIRET_ABSENT)
      mockReferentiel(Array.from({ length: 4999 }, (_, i) => String(i)))

      await expect(deactivateUnreferencedCfaAccounts({ maxDeactivationRatio: 1 })).rejects.toThrow(/moins que le minimum attendu \(5000\)/)
      expect(getReferentielOnisepPresence).not.toHaveBeenCalled()
    })

    it.each([
      [1, "désactive"],
      [2, "s'arrête"],
    ])("plafonne par défaut la part de CFA absents à 10 % : sur 10 CFA, %i absent(s) → %s", async (absentCount) => {
      const sirets = Array.from({ length: 10 }, (_, i) => `2000000000${String(i).padStart(4, "0")}`)
      for (const siret of sirets) await saveCfaAccount(siret)
      mockReferentiel(sirets.slice(absentCount))

      const result = deactivateUnreferencedCfaAccounts({ minReferentielSize: 0 })

      if (absentCount === 1) await expect(result).resolves.toMatchObject({ deactivatedCfas: [expect.objectContaining({ siret: sirets[0] })] })
      else await expect(result).rejects.toThrow(/2 CFA sur 10 absents de la liste, au-delà du seuil de 10 %/)
    })
  })

  describe("erreurs en cours de traitement", () => {
    it("s'arrête après 10 erreurs consécutives du Référentiel", async () => {
      const sirets = Array.from({ length: 12 }, (_, i) => `1000000000${String(i).padStart(4, "0")}`)
      for (const siret of sirets) await saveCfaAccount(siret)
      mockReferentiel([SIRET_REFERENCE])
      vi.mocked(getReferentielOnisepPresence).mockResolvedValue({ kind: "error", reason: "sans réponse" })

      await expect(run()).rejects.toThrow(/10 erreurs consécutives/)
      expect(getReferentielOnisepPresence).toHaveBeenCalledTimes(10)
    })

    it("poursuit après l'échec de traitement d'un CFA, le signale à Sentry et termine en échec", async () => {
      const first = await saveCfaAccount(SIRET_ABSENT)
      const second = await saveCfaAccount(AUTRE_SIRET_ABSENT)
      mockReferentiel([SIRET_REFERENCE])
      vi.mocked(modifyPermissionToUser).mockRejectedValueOnce(new Error("panne"))

      await expect(run()).rejects.toThrow(/1 CFA en échec de traitement/)

      // Les CFA sont traités par SIRET croissant : SIRET_ABSENT (353…) échoue, AUTRE_SIRET_ABSENT (424…) passe.
      expect.soft((await lastRoleStatus(first.role._id))?.status).toBe(AccessStatus.GRANTED)
      expect.soft((await lastRoleStatus(second.role._id))?.status).toBe(AccessStatus.DENIED)
      expect.soft(sentryCaptureException).toHaveBeenCalledOnce()
    })
  })
})
