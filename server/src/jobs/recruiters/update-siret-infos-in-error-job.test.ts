import { useMongo } from "@tests/utils/mongo.test.utils"
import { entrepriseStatusEventFactory, saveCfaUserTest } from "@tests/utils/user.test.utils"
import type { ObjectId } from "mongodb"
import { generateJobsPartnersOfferPrivate } from "shared/fixtures/job-partners.fixture"
import { EntrepriseStatus } from "shared/models/entreprise.model"
import { JOB_STATUS_ENGLISH } from "shared/models/index"
import type { IJobsPartnersOfferPrivate } from "shared/models/jobs-partners.model"
import { JOBPARTNERS_LABEL } from "shared/models/jobs-partners.model"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { getDbCollection } from "@/common/utils/mongodb-utils"
import { getEntrepriseDataFromSiret } from "@/services/etablissement.service"
import { sendMailNouvelleOffre } from "@/services/formulaire-notifications.service"
import { updateSiretInfosInError } from "./update-siret-infos-in-error-job"

vi.mock("@/common/utils/slack-utils", () => ({ notifyToSlack: vi.fn().mockResolvedValue(undefined) }))
vi.mock("@/services/etablissement.service", () => ({ getEntrepriseDataFromSiret: vi.fn() }))
vi.mock("@/services/organization.service", () => ({ upsertEntrepriseData: vi.fn().mockResolvedValue(undefined) }))
vi.mock("@/services/formulaire-notifications.service", () => ({ sendMailNouvelleOffre: vi.fn().mockResolvedValue(undefined) }))
vi.mock("@/services/role-management.service", () => ({ sendDeactivatedRecruteurMail: vi.fn().mockResolvedValue(undefined) }))
vi.mock("@/services/user-recruteur.service", () => ({ setEntrepriseInError: vi.fn().mockResolvedValue(undefined) }))

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
  })

  /** Monte une entreprise en erreur gérée par un CFA, seul cas que le job traite. */
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
})
