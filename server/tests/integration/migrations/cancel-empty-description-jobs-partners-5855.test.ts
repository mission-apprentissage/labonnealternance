import { useMongo } from "@tests/utils/mongo.test.utils"
import { generateJobsPartnersOfferPrivate } from "shared/fixtures/job-partners.fixture"
import { JOB_STATUS_ENGLISH } from "shared/models/index"
import type { IJobsPartnersOfferPrivate } from "shared/models/jobs-partners.model"
import { JOBPARTNERS_LABEL } from "shared/models/jobs-partners.model"
import { describe, expect, it } from "vitest"
import { getDbCollection } from "@/common/utils/mongodb-utils"
import { up } from "@/migrations/20261106120000-cancel-empty-description-jobs-partners-5855"

// cf. backfill-offer-status-history-lba-5429.test.ts pour l'emplacement de ce test hors du dossier migrations
describe("migration cancel-empty-description-jobs-partners-5855", () => {
  useMongo()

  const GRANTED_BY = "20261106120000-cancel-empty-description-jobs-partners-5855"

  // Le validateur refuse une offer_description null : les offres héritées sont insérées sans lui.
  const insert = (docs: IJobsPartnersOfferPrivate[]) => getDbCollection("jobs_partners").insertMany(docs, { bypassDocumentValidation: true })

  const readAll = async () => new Map((await getDbCollection("jobs_partners").find({}).toArray()).map((j) => [j.partner_job_id, j]))

  it.each([
    ["vide", ""],
    ["faite de blancs", "  \n\t "],
    ["null", null],
  ])("annule une offre partenaire active à description %s, avec une seule trace", async (_, offer_description) => {
    await insert([generateJobsPartnersOfferPrivate({ partner_job_id: "vide", offer_description: offer_description as string })])

    await up()
    await up()

    const offer = (await readAll()).get("vide")
    expect.soft(offer?.offer_status).toBe(JOB_STATUS_ENGLISH.ANNULEE)
    expect
      .soft(offer?.offer_status_history.filter((entry) => entry.granted_by === GRANTED_BY))
      .toEqual([{ date: expect.any(Date), status: JOB_STATUS_ENGLISH.ANNULEE, reason: "DESCRIPTION_TOO_SHORT", granted_by: GRANTED_BY }])
    // Réservé au motif choisi dans la modale de clôture (#5722).
    expect.soft(offer?.job_status_comment).toBeNull()
  })

  it("ne touche ni aux offres décrites, ni aux offres déjà closes, ni aux offres LBA", async () => {
    await insert([
      generateJobsPartnersOfferPrivate({ partner_job_id: "decrite" }),
      generateJobsPartnersOfferPrivate({ partner_job_id: "annulee", offer_description: "", offer_status: JOB_STATUS_ENGLISH.ANNULEE }),
      generateJobsPartnersOfferPrivate({ partner_job_id: "lba", offer_description: "", partner_label: JOBPARTNERS_LABEL.OFFRES_EMPLOI_LBA }),
      generateJobsPartnersOfferPrivate({ partner_job_id: "recruteur-lba", offer_description: "", partner_label: JOBPARTNERS_LABEL.RECRUTEURS_LBA }),
    ])
    const before = await readAll()

    await up()

    expect.soft(await readAll()).toEqual(before)
  })

  describe("volet 2 : libellés d'expiration", () => {
    const entry = (reason: string, granted_by: string) => ({ date: new Date("2026-10-01T02:00:00.000Z"), status: JOB_STATUS_ENGLISH.ANNULEE, reason, granted_by })

    it("remplace les deux libellés d'expiration par le code EXPIRED, sans toucher aux autres entrées ni à updated_at", async () => {
      const updated_at = new Date("2026-10-01T02:00:00.000Z")
      await insert([
        generateJobsPartnersOfferPrivate({
          partner_job_id: "historique",
          offer_status: JOB_STATUS_ENGLISH.ANNULEE,
          updated_at,
          offer_status_history: [
            entry("offre expirée", "cancel-removed-jobs-partners"),
            entry("supprimée du flux source", "cancel-removed-jobs-partners"),
            entry("offre expirée (date dépassée)", "expire-jobs-partners"),
            entry("offre expirée", "cancel-removed-jobs-partners"),
          ],
        }),
      ])

      await up()
      await up()

      const offer = (await readAll()).get("historique")
      expect.soft(offer?.offer_status_history.map(({ reason }) => reason)).toEqual(["EXPIRED", "supprimée du flux source", "EXPIRED (date dépassée)", "EXPIRED"])
      expect.soft(offer?.updated_at).toEqual(updated_at)
    })
  })
})
