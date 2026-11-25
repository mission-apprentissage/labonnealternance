import { useMongo } from "@tests/utils/mongo.test.utils"
import { entrepriseStatusEventFactory, roleManagementEventFactory, saveCfaUserTest, saveEntreprise, saveRoleManagement, saveUserWithAccount } from "@tests/utils/user.test.utils"
import type { ObjectId } from "mongodb"
import { AccessEntityType, AccessStatus } from "shared"
import { BusinessErrorCodes } from "shared/constants/error-codes"
import { generateJobsPartnersOfferPrivate } from "shared/fixtures/job-partners.fixture"
import { EntrepriseStatus } from "shared/models/entreprise.model"
import { JOB_STATUS_ENGLISH } from "shared/models/index"
import type { IJobsPartnersOfferPrivate } from "shared/models/jobs-partners.model"
import { JOBPARTNERS_LABEL } from "shared/models/jobs-partners.model"
import { getLastStatusEvent } from "shared/utils/get-last-status-event"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { getDbCollection } from "@/common/utils/mongodb-utils"
import { notifyToSlack, SLACK_MESSAGE_MAX_LENGTH } from "@/common/utils/slack-utils"
import { getEntrepriseDataFromSiret } from "@/services/etablissement.service"
import { sendMailNouvelleOffre } from "@/services/formulaire-notifications.service"
import { upsertEntrepriseData } from "@/services/organization.service"
import { sendDeactivatedRecruteurMail } from "@/services/role-management.service"
import { getErrorStreakStart, MAX_DETAILED_ROWS, STALE_ERROR_DAYS, updateSiretInfosInError } from "./update-siret-infos-in-error-job"

vi.mock("@/common/utils/slack-utils", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/common/utils/slack-utils")>()),
  notifyToSlack: vi.fn().mockResolvedValue(undefined),
}))
vi.mock("@/common/utils/sentry-utils")
vi.mock("@/services/etablissement.service", () => ({ getEntrepriseDataFromSiret: vi.fn() }))
vi.mock("@/services/organization.service", () => ({ upsertEntrepriseData: vi.fn().mockResolvedValue(undefined) }))
vi.mock("@/services/formulaire-notifications.service", () => ({ sendMailNouvelleOffre: vi.fn().mockResolvedValue(undefined) }))
vi.mock("@/services/role-management.service", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/services/role-management.service")>()),
  sendDeactivatedRecruteurMail: vi.fn().mockResolvedValue(undefined),
}))

useMongo()

/**
 * Les trois branches du job changent le statut d'offres : la branche nominale republie l'offre en
 * attente une fois le SIRET revalidé, la branche « création interdite » archive le formulaire, la
 * branche d'erreur dépublie. Aucune ne laissait de trace, et la dernière touchait tout le périmètre
 * du recruteur (issue #5429).
 */
describe("updateSiretInfosInError", () => {
  const SIRET = "42476141900045"

  beforeEach(() => {
    vi.mocked(getEntrepriseDataFromSiret).mockReset()
    vi.mocked(notifyToSlack).mockClear()
    vi.mocked(upsertEntrepriseData)
      .mockReset()
      .mockResolvedValue(undefined as never)
    vi.mocked(sendDeactivatedRecruteurMail).mockClear()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  /** Monte une entreprise en erreur gérée par un CFA. */
  const saveEntrepriseEnErreurAvecCfa = async () => saveCfaUserTest({}, {}, { siret: SIRET, status: [entrepriseStatusEventFactory({ status: EntrepriseStatus.ERROR })] })

  const saveEntrepriseEnErreur = async () => {
    const { user, entreprise } = await saveCfaUserTest({}, {}, { siret: SIRET, status: [entrepriseStatusEventFactory({ status: EntrepriseStatus.ERROR })] })
    return { user, entreprise }
  }

  const insertOffer = async (partner_job_id: string, managed_by: ObjectId, overrides: Partial<IJobsPartnersOfferPrivate> = {}) => {
    await getDbCollection("jobs_partners").insertOne(
      generateJobsPartnersOfferPrivate({
        partner_job_id,
        partner_label: JOBPARTNERS_LABEL.OFFRES_EMPLOI_LBA,
        workplace_siret: SIRET,
        managed_by,
        offer_status_history: [],
        ...overrides,
      })
    )
  }

  const slackMessages = (subjectPart: string) =>
    vi
      .mocked(notifyToSlack)
      .mock.calls.map(([call]) => call)
      .filter(({ subject }) => subject.includes(subjectPart))

  const readAll = async () => new Map((await getDbCollection("jobs_partners").find({}).toArray()).map((j) => [j.partner_job_id, j]))

  describe("quand le SIRET est de nouveau valide", () => {
    it("republie l'offre en attente et trace la transition", async () => {
      const { user } = await saveEntrepriseEnErreur()
      await insertOffer("en-attente", user._id, { offer_status: JOB_STATUS_ENGLISH.EN_ATTENTE })
      vi.mocked(getEntrepriseDataFromSiret).mockResolvedValue({ siret: SIRET } as never)

      await updateSiretInfosInError()
      const byId = await readAll()

      expect.soft(byId.get("en-attente")?.offer_status).toEqual(JOB_STATUS_ENGLISH.ACTIVE)
      expect.soft(byId.get("en-attente")?.offer_status_history).toEqual([
        expect.objectContaining({
          status: JOB_STATUS_ENGLISH.ACTIVE,
          reason: "données entreprise corrigées",
          granted_by: "update-siret-infos-in-error-job",
        }),
      ])
    })

    it("garde l'offre republiée quand l'envoi du mail échoue", async () => {
      // L'envoi était dans le try englobant : sa panne faisait retomber dans le catch, qui
      // dépubliait l'offre tout juste republiée sous le motif "vérification du SIRET en erreur".
      const { user } = await saveEntrepriseEnErreur()
      await insertOffer("en-attente", user._id, { offer_status: JOB_STATUS_ENGLISH.EN_ATTENTE })
      vi.mocked(getEntrepriseDataFromSiret).mockResolvedValue({ siret: SIRET } as never)
      vi.mocked(sendMailNouvelleOffre).mockRejectedValueOnce(new Error("SMTP indisponible"))

      await updateSiretInfosInError()
      const byId = await readAll()

      expect.soft(byId.get("en-attente")?.offer_status).toEqual(JOB_STATUS_ENGLISH.ACTIVE)
      expect.soft(byId.get("en-attente")?.offer_status_history).toHaveLength(1)
      expect.soft(byId.get("en-attente")?.offer_status_history[0]).toMatchObject({ reason: "données entreprise corrigées" })
    })
  })

  describe("quand le SIRET interdit la création du compte", () => {
    it("archive le formulaire et trace les offres encore ouvertes", async () => {
      // Troisième branche du job : le SIRET répond, mais avec une erreur métier (non diffusible,
      // code NAF 85...). Le formulaire entier est archivé, ce qui passe par archiveFormulaire.
      const { user } = await saveEntrepriseEnErreur()
      const updated_at = new Date("2026-01-15T09:00:00.000Z")
      await insertOffer("active", user._id, { offer_status: JOB_STATUS_ENGLISH.ACTIVE })
      await insertOffer("pourvue", user._id, { offer_status: JOB_STATUS_ENGLISH.POURVUE, updated_at })
      vi.mocked(getEntrepriseDataFromSiret).mockResolvedValue({ error: true, message: "informations non diffusibles" } as never)

      await updateSiretInfosInError()
      const byId = await readAll()

      expect.soft(byId.get("active")?.offer_status).toEqual(JOB_STATUS_ENGLISH.ANNULEE)
      expect
        .soft(byId.get("active")?.offer_status_history)
        .toEqual([expect.objectContaining({ status: JOB_STATUS_ENGLISH.ANNULEE, reason: "formulaire du recruteur archivé", granted_by: "archive-formulaire" })])
      // L'archivage ne rouvre pas et ne réécrit pas les offres déjà closes.
      expect.soft(byId.get("pourvue")?.offer_status).toEqual(JOB_STATUS_ENGLISH.POURVUE)
      expect.soft(byId.get("pourvue")?.updated_at).toEqual(updated_at)
      expect.soft(byId.get("pourvue")?.offer_status_history).toEqual([])
    })
  })

  describe("quand la vérification du SIRET échoue", () => {
    const failSiret = () => vi.mocked(getEntrepriseDataFromSiret).mockRejectedValue(new Error("API SIRET indisponible"))

    it("dépublie l'offre active et trace la transition", async () => {
      const { user } = await saveEntrepriseEnErreur()
      await insertOffer("active", user._id, { offer_status: JOB_STATUS_ENGLISH.ACTIVE })
      failSiret()

      await updateSiretInfosInError()
      const byId = await readAll()

      expect.soft(byId.get("active")?.offer_status).toEqual(JOB_STATUS_ENGLISH.EN_ATTENTE)
      expect.soft(byId.get("active")?.offer_status_history).toEqual([
        expect.objectContaining({
          status: JOB_STATUS_ENGLISH.EN_ATTENTE,
          reason: "vérification du SIRET en erreur",
          granted_by: "update-siret-infos-in-error-job",
        }),
      ])
    })

    it("laisse les offres closes fermées", async () => {
      // Le filtre portait sur tout le périmètre du recruteur : une annulation ou un recrutement
      // réussi repassait "en attente", donc réapparaissait comme publiable.
      const { user } = await saveEntrepriseEnErreur()
      const updated_at = new Date("2026-01-15T09:00:00.000Z")
      await insertOffer("pourvue", user._id, { offer_status: JOB_STATUS_ENGLISH.POURVUE, updated_at })
      await insertOffer("annulee", user._id, { offer_status: JOB_STATUS_ENGLISH.ANNULEE, updated_at })
      failSiret()

      await updateSiretInfosInError()
      const byId = await readAll()

      expect.soft(byId.get("pourvue")?.offer_status).toEqual(JOB_STATUS_ENGLISH.POURVUE)
      expect.soft(byId.get("annulee")?.offer_status).toEqual(JOB_STATUS_ENGLISH.ANNULEE)
      for (const id of ["pourvue", "annulee"]) {
        expect.soft(byId.get(id)?.updated_at).toEqual(updated_at)
        expect.soft(byId.get(id)?.offer_status_history).toEqual([])
      }
    })

    it("n'ajoute pas de transition fictive à une offre déjà en attente", async () => {
      const { user } = await saveEntrepriseEnErreur()
      const updated_at = new Date("2026-01-15T09:00:00.000Z")
      await insertOffer("deja-en-attente", user._id, { offer_status: JOB_STATUS_ENGLISH.EN_ATTENTE, updated_at })
      failSiret()

      await updateSiretInfosInError()
      const byId = await readAll()

      expect.soft(byId.get("deja-en-attente")?.offer_status).toEqual(JOB_STATUS_ENGLISH.EN_ATTENTE)
      expect.soft(byId.get("deja-en-attente")?.updated_at).toEqual(updated_at)
      expect.soft(byId.get("deja-en-attente")?.offer_status_history).toEqual([])
    })
  })

  describe("rapport Slack", () => {
    const NOW = new Date("2026-11-24T00:10:00.000Z")
    const DAY_MS = 24 * 60 * 60 * 1000
    const daysAgo = (days: number) => new Date(NOW.getTime() - days * DAY_MS)
    const errorEvent = (date: Date, reason = "getGeoPoint: addresse non trouvée") => entrepriseStatusEventFactory({ status: EntrepriseStatus.ERROR, date, reason })
    const failSiret = (message = "getGeoPoint: addresse non trouvée") => vi.mocked(getEntrepriseDataFromSiret).mockRejectedValue(new Error(message))
    const entreprisesReport = () =>
      slackMessages("entreprises")
        .map(({ message }) => message)
        .join("\n")
    const sectionOf = (report: string, title: string) => report.slice(report.indexOf(title)).split("```")[1] ?? ""

    beforeEach(() => {
      vi.useFakeTimers({ toFake: ["Date"] })
      vi.setSystemTime(NOW)
    })

    it("détaille chaque échec : SIRET, début du blocage, ancienneté, motif", async () => {
      await saveEntreprise({ siret: SIRET, status: [errorEvent(daysAgo(30)), errorEvent(daysAgo(1))] })
      failSiret()

      await updateSiretInfosInError()
      const report = entreprisesReport()

      expect.soft(report).toContain("0 entreprises reprises avec succès. 1 entreprises en échec.")
      expect
        .soft(sectionOf(report, `depuis plus de ${STALE_ERROR_DAYS} jours — 1 entreprise :`))
        .toMatch(new RegExp(`${SIRET}\\s+2026-10-25\\s+30\\s+getGeoPoint: addresse non trouvée`))
      expect.soft(report).not.toContain("Échecs récents")
      expect.soft(slackMessages("entreprises").every(({ error }) => error === true)).toBe(true)
    })

    it.each([
      [8, true],
      [6, false],
    ])("un blocage de %i jours est signalé comme ancien : %s", async (days, stale) => {
      await saveEntreprise({ siret: SIRET, status: [errorEvent(daysAgo(days))] })
      failSiret()

      await updateSiretInfosInError()
      const report = entreprisesReport()

      expect.soft(report.includes(":rotating_light:")).toBe(stale)
      expect.soft(report.includes("Échecs récents — 1 entreprise :")).toBe(!stale)
    })

    it("ne compte pas un blocage antérieur déjà résolu dans l'ancienneté", async () => {
      await saveEntreprise({
        siret: SIRET,
        status: [errorEvent(daysAgo(60)), entrepriseStatusEventFactory({ status: EntrepriseStatus.VALIDE, date: daysAgo(40) }), errorEvent(daysAgo(3))],
      })
      failSiret()

      await updateSiretInfosInError()
      const report = entreprisesReport()

      expect.soft(report).not.toContain(":rotating_light:")
      expect.soft(sectionOf(report, "Échecs récents — 1 entreprise :")).toMatch(new RegExp(`${SIRET}\\s+2026-11-21\\s+3\\s`))
    })

    it("n'envoie aucun détail quand tout est repris", async () => {
      await saveEntreprise({ siret: SIRET, status: [errorEvent(daysAgo(30))] })
      vi.mocked(getEntrepriseDataFromSiret).mockResolvedValue({ siret: SIRET } as never)

      await updateSiretInfosInError()

      const [message] = slackMessages("entreprises")
      expect.soft(slackMessages("entreprises")).toHaveLength(1)
      expect.soft(message.error).toBe(false)
      expect.soft(message.message).toBe("1 entreprises reprises avec succès. 0 entreprises en échec. 0 entreprises désactivées pour non-respect des règles de création.")
    })

    it("compte une erreur métier comme une désactivation, pas comme un succès", async () => {
      await saveEntreprise({ siret: SIRET, status: [errorEvent(daysAgo(30))] })
      vi.mocked(getEntrepriseDataFromSiret).mockResolvedValue({ error: true, message: "Les établissements domiciliés à l'étranger ne sont pas pris en charge." })

      const { userRecruteurResult } = await updateSiretInfosInError()
      const report = entreprisesReport()

      expect.soft(userRecruteurResult).toEqual({ success: 0, failure: 0, deactivated: 1 })
      expect.soft(sectionOf(report, "Désactivations — 1 entreprise :")).toMatch(new RegExp(`${SIRET}\\s+2026-10-25\\s+30\\s+Les établissements domiciliés`))
      expect.soft(slackMessages("entreprises").every(({ error }) => error === false)).toBe(true)
    })

    it("tronque le détail au-delà du nombre de lignes maximal", async () => {
      const total = MAX_DETAILED_ROWS + 3
      for (let index = 0; index < total; index++) {
        await saveEntreprise({ siret: `${10000000000000 + index}`, status: [errorEvent(daysAgo(30))] })
      }
      failSiret("x".repeat(500))

      await updateSiretInfosInError()
      const report = entreprisesReport()

      expect.soft(slackMessages("entreprises")).toHaveLength(1)
      // marge pour la colonne SIRET CFA du rapport des recruteurs
      expect.soft(report.length).toBeLessThan(SLACK_MESSAGE_MAX_LENGTH - MAX_DETAILED_ROWS * 15)
      expect.soft(report).toContain(`depuis plus de ${STALE_ERROR_DAYS} jours — ${total} entreprises :`)
      expect.soft(report.match(/^1000000000\d{4}\s/gm)).toHaveLength(MAX_DETAILED_ROWS)
      expect.soft(report).toContain("… et 3 autres")
    })

    it("tronque un motif long et neutralise ce qui casserait le tableau", async () => {
      await saveEntreprise({ siret: SIRET, status: [errorEvent(daysAgo(1))] })
      failSiret(`ligne 1\nligne 2 \`\`\` ${"x".repeat(200)}`)

      await updateSiretInfosInError()
      const section = sectionOf(entreprisesReport(), "Échecs récents — 1 entreprise :")

      expect.soft(section).toContain("ligne 1 ligne 2 xxx")
      expect.soft(section).toContain("…")
      expect.soft(section.split("\n").every((line) => line.length < 120)).toBe(true)
    })

    it("n'expose ni raison sociale ni donnée du recruteur, et ne liste qu'une fois une entreprise gérée par un CFA", async () => {
      const userProps = { email: "jeanne.martin@cfa-test.fr", first_name: "Jeanne", last_name: "Martinez", phone: "0612345678" }
      const { cfa } = await saveCfaUserTest(userProps, {}, { siret: SIRET, raison_sociale: "Paul Durandeau", enseigne: "Chez Durandeau", status: [errorEvent(daysAgo(30))] })
      const secondUser = await saveUserWithAccount({ email: "autre@cfa-test.fr" })
      await saveRoleManagement({ user_id: secondUser._id, authorized_id: cfa._id.toString(), authorized_type: AccessEntityType.CFA, status: [roleManagementEventFactory()] })
      failSiret()

      await updateSiretInfosInError()
      const everything = vi
        .mocked(notifyToSlack)
        .mock.calls.map(([call]) => JSON.stringify(call))
        .join("\n")
      const recruteursReport = slackMessages("recruteurs")
        .map(({ message }) => message)
        .join("\n")

      for (const forbidden of [...Object.values(userProps), "Durandeau", "autre@cfa-test.fr"]) {
        expect.soft(everything).not.toContain(forbidden)
      }
      expect.soft(recruteursReport).toContain("2 recruteurs en échec")
      expect.soft(recruteursReport).toContain("— 1 entreprise :")
      expect.soft(recruteursReport.match(new RegExp(`^${SIRET}\\s+${cfa.siret}\\s`, "gm"))).toHaveLength(1)
    })
  })

  describe("historique de statut de l'entreprise", () => {
    const readStatus = async () => (await getDbCollection("entreprises").findOne({ siret: SIRET }))!.status

    it("n'ajoute pas d'événement ERROR quand l'échec se répète à l'identique", async () => {
      await saveEntreprise({ siret: SIRET, status: [entrepriseStatusEventFactory({ status: EntrepriseStatus.ERROR, reason: "création", date: new Date("2026-03-12") })] })
      vi.mocked(getEntrepriseDataFromSiret).mockRejectedValue(new Error("getGeoPoint: addresse non trouvée"))

      await updateSiretInfosInError()
      const afterFirstRun = await readStatus()
      await updateSiretInfosInError()
      await updateSiretInfosInError()
      const afterThirdRun = await readStatus()

      expect.soft(afterFirstRun.map(({ reason }) => reason)).toEqual(["création", "getGeoPoint: addresse non trouvée"])
      expect.soft(afterThirdRun).toEqual(afterFirstRun)
      expect.soft(getErrorStreakStart(afterThirdRun)).toEqual(new Date("2026-03-12"))
    })

    it("ajoute un événement quand le motif change", async () => {
      await saveEntreprise({
        siret: SIRET,
        status: [entrepriseStatusEventFactory({ status: EntrepriseStatus.ERROR, reason: "getGeoPoint: addresse non trouvée", date: new Date("2026-03-12") })],
      })
      vi.mocked(getEntrepriseDataFromSiret).mockRejectedValue(new Error("pas de raison sociale trouvée"))

      await updateSiretInfosInError()

      expect((await readStatus()).map(({ reason }) => reason)).toEqual(["getGeoPoint: addresse non trouvée", "pas de raison sociale trouvée"])
    })

    it("laisse une entreprise à mettre à jour sans événement ERROR", async () => {
      await saveEntreprise({ siret: SIRET, status: [entrepriseStatusEventFactory({ status: EntrepriseStatus.A_METTRE_A_JOUR, date: new Date("2026-03-12") })] })
      vi.mocked(getEntrepriseDataFromSiret).mockRejectedValue(new Error("getGeoPoint: addresse non trouvée"))

      const { userRecruteurResult } = await updateSiretInfosInError()

      expect.soft(userRecruteurResult.failure).toBe(1)
      expect.soft((await readStatus()).map(({ status }) => status)).toEqual([EntrepriseStatus.A_METTRE_A_JOUR])
    })
  })

  describe("quand une entreprise gérée par un CFA relève du code NAF 85", () => {
    it.each([
      ["85.59A", true],
      ["62.01Z", false],
    ])("NAF %s : refusée = %s", async (naf_code, refused) => {
      const { user } = await saveEntrepriseEnErreur()
      await insertOffer("en-attente", user._id, { offer_status: JOB_STATUS_ENGLISH.EN_ATTENTE })
      vi.mocked(getEntrepriseDataFromSiret).mockImplementation(async ({ type }) =>
        type === "ENTREPRISE" && refused ? { error: true, message: "refus", errorCode: BusinessErrorCodes.IS_CFA } : ({ siret: SIRET, naf_code } as never)
      )

      const { recruteurResult, userRecruteurResult } = await updateSiretInfosInError()
      const byId = await readAll()

      expect.soft(recruteurResult).toEqual({ success: refused ? 0 : 1, failure: 0, deactivated: refused ? 1 : 0 })
      expect.soft(userRecruteurResult.deactivated).toBe(refused ? 1 : 0)
      expect.soft(byId.get("en-attente")?.offer_status).toEqual(refused ? JOB_STATUS_ENGLISH.ANNULEE : JOB_STATUS_ENGLISH.ACTIVE)
      expect.soft(vi.mocked(sendDeactivatedRecruteurMail).mock.calls.map(([{ errorMessage }]) => errorMessage)).toEqual(refused ? ["entreprise rattachée à un code NAF 85"] : [])
      if (refused) {
        expect.soft(slackMessages("recruteurs")[0].message).toContain("entreprise rattachée à un code NAF 85")
      }
    })
  })

  describe("quand une entreprise gérée par un CFA est refusée", () => {
    it("archive le formulaire et prévient le CFA avant de désactiver l'entreprise", async () => {
      const { upsertEntrepriseData: realUpsert } = await vi.importActual<typeof import("@/services/organization.service")>("@/services/organization.service")
      vi.mocked(upsertEntrepriseData).mockImplementation(realUpsert)
      const { user, entreprise } = await saveEntrepriseEnErreur()
      await insertOffer("active", user._id, { offer_status: JOB_STATUS_ENGLISH.ACTIVE })
      vi.mocked(getEntrepriseDataFromSiret).mockResolvedValue({ error: true, message: "Les établissements domiciliés à l'étranger ne sont pas pris en charge." })

      const result = await updateSiretInfosInError()
      const byId = await readAll()
      const updatedEntreprise = await getDbCollection("entreprises").findOne({ _id: entreprise._id })

      expect.soft(result).toEqual({ recruteurResult: { success: 0, failure: 0, deactivated: 1 }, userRecruteurResult: { success: 0, failure: 0, deactivated: 1 } })
      expect.soft(byId.get("active")?.offer_status).toEqual(JOB_STATUS_ENGLISH.ANNULEE)
      expect.soft(sendDeactivatedRecruteurMail).toHaveBeenCalledTimes(1)
      expect.soft(getLastStatusEvent(updatedEntreprise?.status)).toMatchObject({
        status: EntrepriseStatus.DESACTIVE,
        reason: "Les établissements domiciliés à l'étranger ne sont pas pris en charge.",
      })
    })

    it("(faux positif) ne prévient pas un utilisateur dont l'accès au CFA est refusé", async () => {
      const { cfa } = await saveEntrepriseEnErreurAvecCfa()
      const denied = await saveUserWithAccount({ email: "refuse@cfa-test.fr" })
      await saveRoleManagement({
        user_id: denied._id,
        authorized_id: cfa._id.toString(),
        authorized_type: AccessEntityType.CFA,
        status: [roleManagementEventFactory({ status: AccessStatus.DENIED })],
      })
      vi.mocked(getEntrepriseDataFromSiret).mockResolvedValue({ error: true, message: "Cette entreprise est considérée comme fermée.", errorCode: BusinessErrorCodes.CLOSED })

      await updateSiretInfosInError()

      const recipients = vi.mocked(sendDeactivatedRecruteurMail).mock.calls.map(([{ email }]) => email)
      expect.soft(recipients).toHaveLength(1)
      expect.soft(recipients).not.toContain("refuse@cfa-test.fr")
    })
  })
})
