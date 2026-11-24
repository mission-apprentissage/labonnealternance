import { useMongo } from "@tests/utils/mongo.test.utils"
import {
  entrepriseStatusEventFactory,
  roleManagementEventFactory,
  saveCfa,
  saveEntreprise,
  saveEntrepriseManagedByCfa,
  saveRoleManagement,
  saveUserWithAccount,
} from "@tests/utils/user.test.utils"
import type { ObjectId } from "mongodb"
import { generateCacheInfoSiretFixture } from "shared/fixtures/cache-info-siret.fixture"
import { generateJobsPartnersOfferPrivate } from "shared/fixtures/job-partners.fixture"
import { CLOSED_SIRET_ACTION, CLOSED_SIRET_REASON } from "shared/models/closed-siret-actions.model"
import { EntrepriseStatus } from "shared/models/entreprise.model"
import { JOB_STATUS_ENGLISH } from "shared/models/job.model"
import type { IJobsPartnersOfferPrivate } from "shared/models/jobs-partners.model"
import { JOBPARTNERS_LABEL } from "shared/models/jobs-partners.model"
import { AccessEntityType, AccessStatus } from "shared/models/role-management.model"
import { getLastStatusEvent } from "shared/utils/get-last-status-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

import type { IEtatAdministratifResult } from "@/common/apis/api-entreprise/api-entreprise.client"
import { getEtatAdministratifFromGouv, NO_RESPONSE_REASON } from "@/common/apis/api-entreprise/api-entreprise.client"
import { sleep } from "@/common/utils/async-utils"
import { getDbCollection } from "@/common/utils/mongodb-utils"
import { sentryCaptureException } from "@/common/utils/sentry-utils"
import { notifyToSlack } from "@/common/utils/slack-utils"
import { modifyPermissionToUser } from "@/services/role-management.service"
import { deactivateEntreprise } from "@/services/user-recruteur.service"
import { emailHasActiveRole, isUserDisabled } from "@/services/user-with-account.service"
import { CLOSED_SIRET_JOB_NAME, deactivateClosedSiretAccounts } from "./deactivate-closed-siret-accounts"

vi.mock("@/common/apis/api-entreprise/api-entreprise.client", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/common/apis/api-entreprise/api-entreprise.client")>()),
  getEtatAdministratifFromGouv: vi.fn(),
}))
vi.mock("@/common/utils/async-utils", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/common/utils/async-utils")>()),
  sleep: vi.fn().mockResolvedValue(undefined),
}))
vi.mock("@/common/utils/slack-utils")
vi.mock("@/common/utils/sentry-utils")
vi.mock("@/services/user-recruteur.service", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/services/user-recruteur.service")>()
  return { ...original, deactivateEntreprise: vi.fn(original.deactivateEntreprise) }
})

vi.mock("@/services/role-management.service", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/services/role-management.service")>()
  return { ...original, modifyPermissionToUser: vi.fn(original.modifyPermissionToUser) }
})

useMongo()

const SIRET_FERME = "42476141900045"
const SIRET_ACTIF = "13002526500013"
const SIRET_CFA = "35306634300016"
const AUTRE_SIRET = "78430824900019"

// Antérieure aux événements posés par le job : getLastStatusEvent départage les dates égales au hasard.
const PAST = new Date("2025-01-01T00:00:00.000Z")
const DATE_FERMETURE = new Date("2026-06-30T00:00:00.000Z")

const FOUND_ACTIVE: IEtatAdministratifResult = { kind: "found", etat: "A", dateFermeture: null }
const FOUND_CLOSED: IEtatAdministratifResult = { kind: "found", etat: "F", dateFermeture: DATE_FERMETURE }
const NO_RATE_LIMIT = { remaining: null, resetAt: null, resetUnreadable: false }

const mockApi = (bySiret: Record<string, IEtatAdministratifResult | IEtatAdministratifResult[]>) => {
  const queues = new Map(Object.entries(bySiret).map(([siret, results]) => [siret, Array.isArray(results) ? [...results] : results]))
  vi.mocked(getEtatAdministratifFromGouv).mockImplementation(async (siret) => {
    const entry = queues.get(siret)
    const result = Array.isArray(entry) ? entry.shift() : entry
    if (!result) throw new Error(`SIRET non prévu par le test : ${siret}`)
    return { result, rateLimit: NO_RATE_LIMIT }
  })
}

// La fixture générée remplit lastUpdateFromSource au hasard : en base, le champ est absent avant le premier passage du job.
const saveEntrepriseNonVerifiee = (data: Parameters<typeof saveEntreprise>[0]) => saveEntreprise({ lastUpdateFromSource: null, ...data })
const saveCfaNonVerifie = (data: Parameters<typeof saveCfa>[0]) => saveCfa({ lastUpdateFromSource: null, ...data })

const grantedRole = () => [roleManagementEventFactory({ date: PAST })]
const valideEntreprise = () => [entrepriseStatusEventFactory({ date: PAST })]

const saveRecruteur = async (siret: string) => {
  const user = await saveUserWithAccount()
  const entreprise = await saveEntrepriseNonVerifiee({ siret, status: valideEntreprise() })
  const role = await saveRoleManagement({ user_id: user._id, authorized_id: entreprise._id.toString(), authorized_type: AccessEntityType.ENTREPRISE, status: grantedRole() })
  return { user, entreprise, role }
}

const saveCfaAvecPartenaire = async ({ cfaSiret, partenaireSiret }: { cfaSiret: string; partenaireSiret: string }) => {
  const user = await saveUserWithAccount()
  const cfa = await saveCfaNonVerifie({ siret: cfaSiret })
  const role = await saveRoleManagement({ user_id: user._id, authorized_id: cfa._id.toString(), authorized_type: AccessEntityType.CFA, status: grantedRole() })
  const partenaire = await saveEntrepriseNonVerifiee({ siret: partenaireSiret, status: valideEntreprise() })
  const link = await saveEntrepriseManagedByCfa({ cfa_id: cfa._id, entreprise_id: partenaire._id })
  return { user, cfa, role, partenaire, link }
}

const insertOffer = async (partner_job_id: string, managed_by: ObjectId, overrides: Partial<IJobsPartnersOfferPrivate> = {}) => {
  await getDbCollection("jobs_partners").insertOne(
    generateJobsPartnersOfferPrivate({
      partner_job_id,
      partner_label: JOBPARTNERS_LABEL.OFFRES_EMPLOI_LBA,
      managed_by,
      offer_status: JOB_STATUS_ENGLISH.ACTIVE,
      offer_status_history: [],
      ...overrides,
    })
  )
}

const offerStatuses = async () => Object.fromEntries((await getDbCollection("jobs_partners").find({}).toArray()).map((offer) => [offer.partner_job_id, offer.offer_status]))
const lastRoleStatus = async (roleId: ObjectId) => getLastStatusEvent((await getDbCollection("rolemanagements").findOne({ _id: roleId }))?.status)
const lastEntrepriseStatus = async (entrepriseId: ObjectId) => getLastStatusEvent((await getDbCollection("entreprises").findOne({ _id: entrepriseId }))?.status)

describe("deactivateClosedSiretAccounts", () => {
  beforeEach(() => {
    vi.mocked(getEtatAdministratifFromGouv).mockReset()
    vi.mocked(sleep).mockClear()
    vi.mocked(notifyToSlack).mockClear()
  })

  describe("ne modifie aucun compte sans fermeture avérée", () => {
    it("laisse intact un recruteur dont le SIRET est actif, et date la vérification", async () => {
      const { user, entreprise, role } = await saveRecruteur(SIRET_ACTIF)
      await insertOffer("offre", user._id, { workplace_siret: SIRET_ACTIF })
      mockApi({ [SIRET_ACTIF]: FOUND_ACTIVE })

      const report = await deactivateClosedSiretAccounts()

      expect.soft(report).toMatchObject({ checked: 1, active: 1, closed: 0 })
      expect.soft((await lastRoleStatus(role._id))?.status).toBe(AccessStatus.GRANTED)
      expect.soft((await lastEntrepriseStatus(entreprise._id))?.status).toBe(EntrepriseStatus.VALIDE)
      expect.soft(await offerStatuses()).toEqual({ offre: JOB_STATUS_ENGLISH.ACTIVE })
      expect.soft(await getDbCollection("closed_siret_actions").countDocuments()).toBe(0)
      expect.soft((await getDbCollection("entreprises").findOne({ _id: entreprise._id }))?.lastUpdateFromSource).toBeInstanceOf(Date)
    })

    it.each<[string, IEtatAdministratifResult]>([
      ["SIRET inconnu (404)", { kind: "unknown", reason: "HTTP 404", technical: false }],
      ["non diffusible (451)", { kind: "unknown", reason: "HTTP 451", technical: false }],
    ])("ne conclut pas à une fermeture sur %s", async (_label, result) => {
      const { user, entreprise, role } = await saveRecruteur(SIRET_FERME)
      await insertOffer("offre", user._id, { workplace_siret: SIRET_FERME })
      mockApi({ [SIRET_FERME]: result })

      const report = await deactivateClosedSiretAccounts()

      expect.soft(report).toMatchObject({ checked: 1, active: 0, closed: 0, unknown: { [result.kind === "unknown" ? result.reason : ""]: 1 } })
      expect.soft((await lastRoleStatus(role._id))?.status).toBe(AccessStatus.GRANTED)
      expect.soft(await offerStatuses()).toEqual({ offre: JOB_STATUS_ENGLISH.ACTIVE })
      // Pas de lecture aboutie : le SIRET reste à vérifier au prochain passage.
      expect.soft((await getDbCollection("entreprises").findOne({ _id: entreprise._id }))?.lastUpdateFromSource ?? null).toBeNull()
    })

    it("n'annule pas les offres d'un autre SIRET, ni les offres non LBA du SIRET fermé", async () => {
      const { user } = await saveRecruteur(SIRET_FERME)
      await insertOffer("autre-siret", user._id, { workplace_siret: AUTRE_SIRET })
      await insertOffer("partenaire-externe", user._id, { workplace_siret: SIRET_FERME, partner_label: JOBPARTNERS_LABEL.HELLOWORK })
      await insertOffer("pourvue", user._id, { workplace_siret: SIRET_FERME, offer_status: JOB_STATUS_ENGLISH.POURVUE })
      mockApi({ [SIRET_FERME]: FOUND_CLOSED })

      await deactivateClosedSiretAccounts()

      expect(await offerStatuses()).toEqual({
        "autre-siret": JOB_STATUS_ENGLISH.ACTIVE,
        "partenaire-externe": JOB_STATUS_ENGLISH.ACTIVE,
        pourvue: JOB_STATUS_ENGLISH.POURVUE,
      })
    })
  })

  describe("recruteur au SIRET fermé", () => {
    it("désactive l'entreprise et le rôle, annule les offres en cours et journalise chaque action", async () => {
      const { user, entreprise, role } = await saveRecruteur(SIRET_FERME)
      await insertOffer("active", user._id, { workplace_siret: SIRET_FERME })
      await insertOffer("en-attente", user._id, { workplace_siret: SIRET_FERME, offer_status: JOB_STATUS_ENGLISH.EN_ATTENTE })
      mockApi({ [SIRET_FERME]: FOUND_CLOSED })

      const report = await deactivateClosedSiretAccounts()

      expect.soft(report).toMatchObject({ closed: 1, offersCancelled: 2, actions: { ENTREPRISE_DESACTIVEE: 1, ROLE_DESACTIVE: 1, OFFRES_ANNULEES: 1, RETRAIT_DU_CFA: 0 } })
      expect.soft(await lastEntrepriseStatus(entreprise._id)).toMatchObject({ status: EntrepriseStatus.DESACTIVE, reason: CLOSED_SIRET_REASON })
      expect.soft(await lastRoleStatus(role._id)).toMatchObject({ status: AccessStatus.DENIED, reason: CLOSED_SIRET_REASON, granted_by: CLOSED_SIRET_JOB_NAME })
      expect.soft(await offerStatuses()).toEqual({ active: JOB_STATUS_ENGLISH.ANNULEE, "en-attente": JOB_STATUS_ENGLISH.ANNULEE })
      const offer = await getDbCollection("jobs_partners").findOne({ partner_job_id: "active" })
      expect
        .soft(offer?.offer_status_history)
        .toEqual([expect.objectContaining({ status: JOB_STATUS_ENGLISH.ANNULEE, reason: CLOSED_SIRET_REASON, granted_by: CLOSED_SIRET_JOB_NAME })])

      const actions = await getDbCollection("closed_siret_actions").find({}).toArray()
      expect
        .soft(actions.map(({ action }) => action).sort())
        .toEqual([CLOSED_SIRET_ACTION.ENTREPRISE_DESACTIVEE, CLOSED_SIRET_ACTION.OFFRES_ANNULEES, CLOSED_SIRET_ACTION.ROLE_DESACTIVE].sort())
      expect.soft(actions.find(({ action }) => action === CLOSED_SIRET_ACTION.ROLE_DESACTIVE)).toMatchObject({
        siret: SIRET_FERME,
        organization_type: "ENTREPRISE",
        organization_id: entreprise._id,
        role_id: role._id,
        user_id: user._id,
        date_fermeture: DATE_FERMETURE,
        run_id: expect.anything(),
      })
      expect.soft(actions.find(({ action }) => action === CLOSED_SIRET_ACTION.OFFRES_ANNULEES)?.offers_count).toBe(2)
    })

    it("désactive aussi un compte en attente de validation sur le SIRET fermé", async () => {
      const { role } = await saveRecruteur(SIRET_FERME)
      await getDbCollection("rolemanagements").updateOne(
        { _id: role._id },
        { $set: { status: [roleManagementEventFactory({ date: PAST, status: AccessStatus.AWAITING_VALIDATION })] } }
      )
      mockApi({ [SIRET_FERME]: FOUND_CLOSED })

      await deactivateClosedSiretAccounts()

      expect((await lastRoleStatus(role._id))?.status).toBe(AccessStatus.DENIED)
    })

    it("laisse au recruteur la possibilité de se recréer un compte sur un autre SIRET", async () => {
      const { user } = await saveRecruteur(SIRET_FERME)
      mockApi({ [SIRET_FERME]: FOUND_CLOSED })

      await deactivateClosedSiretAccounts()

      const updatedUser = await getDbCollection("userswithaccounts").findOne({ _id: user._id })
      expect.soft(updatedUser && isUserDisabled(updatedUser)).toBe(false)
      expect.soft(await emailHasActiveRole(user.email)).toBe(false)
    })

    it("marque le SIRET fermé dans le cache lu à la création de compte", async () => {
      await saveRecruteur(SIRET_FERME)
      await getDbCollection("cache_siret").insertOne(generateCacheInfoSiretFixture({ siret: SIRET_FERME }, "A"))
      mockApi({ [SIRET_FERME]: FOUND_CLOSED })

      await deactivateClosedSiretAccounts()

      expect((await getDbCollection("cache_siret").findOne({ siret: SIRET_FERME }))?.data?.data.etat_administratif).toBe("F")
    })
  })

  describe("entreprise partenaire d'un CFA au SIRET fermé", () => {
    it("la retire du CFA et annule ses offres, sans toucher au CFA ni à ses autres partenaires", async () => {
      const { user, cfa, role, partenaire } = await saveCfaAvecPartenaire({ cfaSiret: SIRET_CFA, partenaireSiret: SIRET_FERME })
      const autrePartenaire = await saveEntrepriseNonVerifiee({ siret: AUTRE_SIRET, status: valideEntreprise() })
      await saveEntrepriseManagedByCfa({ cfa_id: cfa._id, entreprise_id: autrePartenaire._id })
      await insertOffer("offre-partenaire-ferme", user._id, { workplace_siret: SIRET_FERME, cfa_siret: SIRET_CFA, is_delegated: true })
      await insertOffer("offre-autre-partenaire", user._id, { workplace_siret: AUTRE_SIRET, cfa_siret: SIRET_CFA, is_delegated: true })
      mockApi({ [SIRET_FERME]: FOUND_CLOSED, [SIRET_CFA]: FOUND_ACTIVE, [AUTRE_SIRET]: FOUND_ACTIVE })

      const report = await deactivateClosedSiretAccounts()

      expect.soft(report.actions).toMatchObject({ RETRAIT_DU_CFA: 1, ROLE_DESACTIVE: 0 })
      expect.soft(await getDbCollection("entreprise_managed_by_cfa").find({ cfa_id: cfa._id }).toArray()).toEqual([expect.objectContaining({ entreprise_id: autrePartenaire._id })])
      expect.soft(await offerStatuses()).toEqual({ "offre-partenaire-ferme": JOB_STATUS_ENGLISH.ANNULEE, "offre-autre-partenaire": JOB_STATUS_ENGLISH.ACTIVE })
      expect.soft((await lastRoleStatus(role._id))?.status).toBe(AccessStatus.GRANTED)
      expect.soft(await lastEntrepriseStatus(partenaire._id)).toMatchObject({ status: EntrepriseStatus.DESACTIVE, reason: CLOSED_SIRET_REASON })
      expect
        .soft(await getDbCollection("closed_siret_actions").findOne({ action: CLOSED_SIRET_ACTION.RETRAIT_DU_CFA }))
        .toMatchObject({ cfa_id: cfa._id, organization_id: partenaire._id })
    })
  })

  describe("CFA au SIRET fermé", () => {
    it("désactive le rôle CFA et annule toutes ses offres déléguées, sans désactiver ses entreprises partenaires", async () => {
      const { user, cfa, role, partenaire } = await saveCfaAvecPartenaire({ cfaSiret: SIRET_FERME, partenaireSiret: AUTRE_SIRET })
      await insertOffer("offre-deleguee", user._id, { workplace_siret: AUTRE_SIRET, cfa_siret: SIRET_FERME, is_delegated: true })
      await insertOffer("offre-autre-cfa", user._id, { workplace_siret: AUTRE_SIRET, cfa_siret: SIRET_CFA, is_delegated: true })
      mockApi({ [SIRET_FERME]: FOUND_CLOSED, [AUTRE_SIRET]: FOUND_ACTIVE })

      const report = await deactivateClosedSiretAccounts()

      expect.soft(report.actions).toMatchObject({ ROLE_DESACTIVE: 1, OFFRES_ANNULEES: 1, ENTREPRISE_DESACTIVEE: 0 })
      expect.soft(await lastRoleStatus(role._id)).toMatchObject({ status: AccessStatus.DENIED, reason: CLOSED_SIRET_REASON })
      expect.soft(await offerStatuses()).toEqual({ "offre-deleguee": JOB_STATUS_ENGLISH.ANNULEE, "offre-autre-cfa": JOB_STATUS_ENGLISH.ACTIVE })
      expect.soft((await lastEntrepriseStatus(partenaire._id))?.status).toBe(EntrepriseStatus.VALIDE)
      expect.soft(await getDbCollection("closed_siret_actions").findOne({ action: CLOSED_SIRET_ACTION.ROLE_DESACTIVE })).toMatchObject({
        organization_type: "CFA",
        organization_id: cfa._id,
      })
      expect.soft((await getDbCollection("cfas").findOne({ _id: cfa._id }))?.lastUpdateFromSource).toBeInstanceOf(Date)
    })
  })

  describe("idempotence et reprise", () => {
    // Un CFA n'a pas de statut DESACTIVE qui l'écarterait de la sélection : il est réinterrogé et repasse dans chaque règle.
    it("ne produit aucune modification supplémentaire quand il est relancé", async () => {
      const { user, role } = await saveCfaAvecPartenaire({ cfaSiret: SIRET_FERME, partenaireSiret: AUTRE_SIRET })
      await insertOffer("offre-deleguee", user._id, { workplace_siret: AUTRE_SIRET, cfa_siret: SIRET_FERME, is_delegated: true })
      mockApi({ [SIRET_FERME]: [FOUND_CLOSED, FOUND_CLOSED], [AUTRE_SIRET]: [FOUND_ACTIVE, FOUND_ACTIVE] })

      await deactivateClosedSiretAccounts()
      const snapshot = {
        role: await getDbCollection("rolemanagements").findOne({ _id: role._id }),
        offer: await getDbCollection("jobs_partners").findOne({ partner_job_id: "offre-deleguee" }),
        actions: await getDbCollection("closed_siret_actions").countDocuments(),
      }
      const secondRun = await deactivateClosedSiretAccounts({ recheckAfterDays: 0 })

      expect.soft(secondRun).toMatchObject({ closed: 1, offersCancelled: 0, actions: { ROLE_DESACTIVE: 0, OFFRES_ANNULEES: 0 } })
      expect.soft(await getDbCollection("rolemanagements").findOne({ _id: role._id })).toEqual(snapshot.role)
      expect.soft(await getDbCollection("jobs_partners").findOne({ partner_job_id: "offre-deleguee" })).toEqual(snapshot.offer)
      expect.soft(await getDbCollection("closed_siret_actions").countDocuments()).toBe(snapshot.actions)
    })

    it("n'interroge pas l'API pour une entreprise déjà désactivée ni pour une organisation vérifiée récemment", async () => {
      await saveEntrepriseNonVerifiee({ siret: SIRET_FERME, status: [entrepriseStatusEventFactory({ date: PAST, status: EntrepriseStatus.DESACTIVE })] })
      await saveCfaNonVerifie({ siret: SIRET_CFA, lastUpdateFromSource: new Date() })
      mockApi({})

      const report = await deactivateClosedSiretAccounts()

      expect.soft(report.checked).toBe(0)
      expect.soft(getEtatAdministratifFromGouv).not.toHaveBeenCalled()
      // Les tranches lancées après la fin de la vérification ne publient rien.
      expect.soft(notifyToSlack).not.toHaveBeenCalled()
    })

    it("n'appelle l'API qu'une fois pour une entreprise et un CFA de même SIRET", async () => {
      await saveEntrepriseNonVerifiee({ siret: SIRET_FERME, status: valideEntreprise() })
      await saveCfaNonVerifie({ siret: SIRET_FERME })
      mockApi({ [SIRET_FERME]: FOUND_ACTIVE })

      await deactivateClosedSiretAccounts()

      expect(getEtatAdministratifFromGouv).toHaveBeenCalledTimes(1)
    })
  })

  describe("limite et tranches", () => {
    it("n'interroge que `limit` SIRET, entreprises d'abord", async () => {
      await saveEntrepriseNonVerifiee({ siret: SIRET_ACTIF, status: valideEntreprise() })
      await saveEntrepriseNonVerifiee({ siret: AUTRE_SIRET, status: valideEntreprise() })
      await saveCfaNonVerifie({ siret: SIRET_CFA })
      mockApi({ [SIRET_ACTIF]: FOUND_ACTIVE, [AUTRE_SIRET]: FOUND_ACTIVE, [SIRET_CFA]: FOUND_ACTIVE })

      const report = await deactivateClosedSiretAccounts({ limit: 2 })

      expect.soft(report.checked).toBe(2)
      expect.soft(vi.mocked(getEtatAdministratifFromGouv).mock.calls.map(([siret]) => siret)).toEqual([SIRET_ACTIF, AUTRE_SIRET])
    })

    it("compte une seule fois, dans la limite, un SIRET partagé par une entreprise et un CFA", async () => {
      const { role: roleEntreprise } = await saveRecruteur(SIRET_FERME)
      const user = await saveUserWithAccount()
      const cfa = await saveCfaNonVerifie({ siret: SIRET_FERME })
      const roleCfa = await saveRoleManagement({ user_id: user._id, authorized_id: cfa._id.toString(), authorized_type: AccessEntityType.CFA, status: grantedRole() })
      await saveEntrepriseNonVerifiee({ siret: AUTRE_SIRET, status: valideEntreprise() })
      mockApi({ [SIRET_FERME]: FOUND_CLOSED })

      const report = await deactivateClosedSiretAccounts({ limit: 1 })

      expect.soft(report.checked).toBe(1)
      expect.soft((await lastRoleStatus(roleEntreprise._id))?.status).toBe(AccessStatus.DENIED)
      expect.soft((await lastRoleStatus(roleCfa._id))?.status).toBe(AccessStatus.DENIED)
    })

    it("s'arrête au bout de maxDurationMinutes et laisse la suite à la tranche suivante, qui publie le bilan", async () => {
      const { role } = await saveRecruteur(SIRET_FERME)
      await saveEntrepriseNonVerifiee({ siret: SIRET_ACTIF, status: valideEntreprise() })
      await saveEntrepriseNonVerifiee({ siret: AUTRE_SIRET, status: valideEntreprise() })
      const results: Record<string, IEtatAdministratifResult> = { [SIRET_FERME]: FOUND_CLOSED, [SIRET_ACTIF]: FOUND_ACTIVE, [AUTRE_SIRET]: FOUND_ACTIVE }
      vi.mocked(getEtatAdministratifFromGouv).mockImplementation(async (siret) => {
        await new Promise((resolve) => setTimeout(resolve, 50))
        return { result: results[siret], rateLimit: NO_RATE_LIMIT }
      })

      // 30 ms : la tranche s'arrête après le premier SIRET, qui prend 50 ms.
      const firstSlice = await deactivateClosedSiretAccounts({ maxDurationMinutes: 0.0005 })

      expect.soft(firstSlice).toMatchObject({ checked: 1, remaining: 2 })
      expect.soft((await lastRoleStatus(role._id))?.status).toBe(AccessStatus.DENIED)
      expect.soft(notifyToSlack).toHaveBeenLastCalledWith(expect.objectContaining({ subject: expect.stringContaining("(tranche)"), error: false }))

      const lastSlice = await deactivateClosedSiretAccounts()

      expect.soft(lastSlice).toMatchObject({ checked: 2, remaining: 0 })
      expect
        .soft(notifyToSlack)
        .toHaveBeenLastCalledWith(
          expect.objectContaining({ message: expect.stringMatching(/Bilan depuis le .* 3 entreprises et 0 CFA vérifiés, entreprises désactivées 1, rôles désactivés 1/) })
        )
    })
  })

  describe("dry-run", () => {
    it("rapporte les actions sans rien écrire en base", async () => {
      const { user, entreprise, role } = await saveRecruteur(SIRET_FERME)
      await insertOffer("active", user._id, { workplace_siret: SIRET_FERME })
      mockApi({ [SIRET_FERME]: FOUND_CLOSED })

      const report = await deactivateClosedSiretAccounts({ dryRun: true })

      expect.soft(report).toMatchObject({ dryRun: true, closed: 1, offersCancelled: 1, actions: { ENTREPRISE_DESACTIVEE: 1, ROLE_DESACTIVE: 1, OFFRES_ANNULEES: 1 } })
      expect.soft((await lastRoleStatus(role._id))?.status).toBe(AccessStatus.GRANTED)
      expect.soft((await lastEntrepriseStatus(entreprise._id))?.status).toBe(EntrepriseStatus.VALIDE)
      expect.soft(await offerStatuses()).toEqual({ active: JOB_STATUS_ENGLISH.ACTIVE })
      expect.soft(await getDbCollection("closed_siret_actions").countDocuments()).toBe(0)
      expect.soft((await getDbCollection("entreprises").findOne({ _id: entreprise._id }))?.lastUpdateFromSource ?? null).toBeNull()
    })
  })

  describe("volumétrie API Entreprise", () => {
    it("attend le délai Retry-After puis retente le même SIRET après un 429", async () => {
      const { role } = await saveRecruteur(SIRET_FERME)
      mockApi({ [SIRET_FERME]: [{ kind: "rate_limited", retryAfterMs: 42_000 }, FOUND_CLOSED] })

      const report = await deactivateClosedSiretAccounts()

      expect.soft(sleep).toHaveBeenCalledWith(42_000)
      expect.soft(report).toMatchObject({ checked: 1, closed: 1 })
      expect.soft((await lastRoleStatus(role._id))?.status).toBe(AccessStatus.DENIED)
    })

    it("s'arrête en échec après trois 429 consécutifs", async () => {
      await saveRecruteur(SIRET_FERME)
      const rateLimited: IEtatAdministratifResult = { kind: "rate_limited", retryAfterMs: 1000 }
      mockApi({ [SIRET_FERME]: [rateLimited, rateLimited, rateLimited] })

      await expect(deactivateClosedSiretAccounts()).rejects.toThrow("429")
      expect(notifyToSlack).toHaveBeenCalledWith(expect.objectContaining({ error: true }))
    })

    it("s'arrête en échec après dix appels consécutifs sans réponse", async () => {
      const sirets = Array.from({ length: 10 }, (_, index) => `1300252650${String(index).padStart(4, "0")}`)
      for (const siret of sirets) {
        await saveEntrepriseNonVerifiee({ siret, status: valideEntreprise() })
      }
      mockApi(Object.fromEntries(sirets.map((siret) => [siret, { kind: "unknown", reason: NO_RESPONSE_REASON, technical: true }])))

      await expect(deactivateClosedSiretAccounts()).rejects.toThrow("sans réponse")
    })

    it("termine en échec au-delà du seuil d'erreurs techniques, après avoir appliqué les fermetures", async () => {
      const { role } = await saveRecruteur(SIRET_FERME)
      await saveEntrepriseNonVerifiee({ siret: AUTRE_SIRET, status: valideEntreprise() })
      mockApi({ [SIRET_FERME]: FOUND_CLOSED, [AUTRE_SIRET]: { kind: "unknown", reason: "HTTP 503", technical: true } })

      await expect(deactivateClosedSiretAccounts()).rejects.toThrow("erreurs techniques")
      expect.soft((await lastRoleStatus(role._id))?.status).toBe(AccessStatus.DENIED)
      expect.soft(notifyToSlack).toHaveBeenCalledWith(expect.objectContaining({ error: true }))
    })

    it("poursuit après un échec de traitement en base, le signale à Sentry et termine en échec", async () => {
      await saveRecruteur(SIRET_FERME)
      const traite = await saveRecruteur(AUTRE_SIRET)
      mockApi({ [SIRET_FERME]: FOUND_CLOSED, [AUTRE_SIRET]: FOUND_CLOSED })
      vi.mocked(deactivateEntreprise).mockRejectedValueOnce(new Error("Document failed validation"))

      await expect(deactivateClosedSiretAccounts()).rejects.toThrow("1 SIRET en échec de traitement")
      expect.soft(sentryCaptureException).toHaveBeenCalledTimes(1)
      expect.soft(notifyToSlack).toHaveBeenCalledWith(expect.objectContaining({ error: true }))
      expect.soft((await lastRoleStatus(traite.role._id))?.status).toBe(AccessStatus.DENIED)
    })

    // L'entreprise ne passe DESACTIVE qu'en dernier : un échec plus tôt la laisse dans la sélection du passage suivant.
    it.each<[string, () => void]>([
      ["la désactivation d'un rôle", () => vi.mocked(modifyPermissionToUser).mockRejectedValueOnce(new Error("Document failed validation"))],
      ["la désactivation de l'entreprise", () => vi.mocked(deactivateEntreprise).mockRejectedValueOnce(new Error("Document failed validation"))],
    ])("reprend au passage suivant un SIRET dont %s a échoué", async (_label, failOnce) => {
      const { user, entreprise, role } = await saveRecruteur(SIRET_FERME)
      await insertOffer("active", user._id, { workplace_siret: SIRET_FERME })
      mockApi({ [SIRET_FERME]: [FOUND_CLOSED, FOUND_CLOSED] })
      failOnce()

      await expect(deactivateClosedSiretAccounts()).rejects.toThrow("1 SIRET en échec de traitement")
      const secondRun = await deactivateClosedSiretAccounts()

      expect.soft(secondRun.checked).toBe(1)
      expect.soft((await lastRoleStatus(role._id))?.status).toBe(AccessStatus.DENIED)
      expect.soft(await offerStatuses()).toEqual({ active: JOB_STATUS_ENGLISH.ANNULEE })
      expect.soft(await lastEntrepriseStatus(entreprise._id)).toMatchObject({ status: EntrepriseStatus.DESACTIVE, reason: CLOSED_SIRET_REASON })
    })

    it("s'arrête dès le premier refus du jeton (401, 403), sans rien modifier", async () => {
      const { role } = await saveRecruteur(SIRET_FERME)
      await saveEntrepriseNonVerifiee({ siret: AUTRE_SIRET, status: valideEntreprise() })
      mockApi({ [SIRET_FERME]: { kind: "unauthorized", reason: "HTTP 401" }, [AUTRE_SIRET]: FOUND_CLOSED })

      await expect(deactivateClosedSiretAccounts()).rejects.toThrow("jeton API Entreprise refusé (HTTP 401)")
      expect.soft(getEtatAdministratifFromGouv).toHaveBeenCalledTimes(1)
      expect.soft((await lastRoleStatus(role._id))?.status).toBe(AccessStatus.GRANTED)
      expect.soft(notifyToSlack).toHaveBeenCalledWith(expect.objectContaining({ error: true }))
    })

    it("termine en échec quand les réponses n'ont plus d'état administratif, sans rien modifier", async () => {
      const { role } = await saveRecruteur(SIRET_FERME)
      mockApi({ [SIRET_FERME]: { kind: "unknown", reason: "réponse sans état administratif", technical: true } })

      await expect(deactivateClosedSiretAccounts()).rejects.toThrow("erreurs techniques")
      expect.soft((await lastRoleStatus(role._id))?.status).toBe(AccessStatus.GRANTED)
    })

    it("signale sur Slack un header RateLimit-Reset illisible, sans faire échouer le job", async () => {
      await saveEntrepriseNonVerifiee({ siret: SIRET_ACTIF, status: valideEntreprise() })
      vi.mocked(getEtatAdministratifFromGouv).mockResolvedValue({ result: FOUND_ACTIVE, rateLimit: { remaining: 10, resetAt: null, resetUnreadable: true } })

      const report = await deactivateClosedSiretAccounts()

      expect.soft(report.rateLimitResetUnreadable).toBe(true)
      expect.soft(notifyToSlack).toHaveBeenCalledWith(expect.objectContaining({ error: true, message: expect.stringContaining("RateLimit-Reset illisible") }))
    })

    it("attend la minute suivante quand le quota restant passe sous la réserve", async () => {
      await saveEntrepriseNonVerifiee({ siret: SIRET_ACTIF, status: valideEntreprise() })
      await saveEntrepriseNonVerifiee({ siret: AUTRE_SIRET, status: valideEntreprise() })
      const resetAt = new Date(Date.now() + 30_000)
      vi.mocked(getEtatAdministratifFromGouv).mockResolvedValue({ result: FOUND_ACTIVE, rateLimit: { remaining: 10, resetAt, resetUnreadable: false } })

      await deactivateClosedSiretAccounts({ rateLimitReserve: 25 })

      const waits = vi.mocked(sleep).mock.calls.map(([ms]) => ms)
      expect(Math.max(...waits)).toBeGreaterThan(29_000)
    })
  })
})
