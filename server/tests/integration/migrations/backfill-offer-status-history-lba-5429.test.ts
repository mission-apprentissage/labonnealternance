import { useMongo } from "@tests/utils/mongo.test.utils"
import { JOB_STATUS_ENGLISH } from "shared"
import { generateJobsPartnersOfferPrivate } from "shared/fixtures/job-partners.fixture"
import { JOBPARTNERS_LABEL } from "shared/models/jobs-partners.model"
import { describe, expect, it } from "vitest"
import { getDbCollection } from "@/common/utils/mongodb-utils"
import { up } from "@/migrations/20260915143000-backfill-offer-status-history-lba-5429"

/**
 * Ce test vit sous tests/ et non à côté de la migration : le runner liste tous les `.js` du
 * dossier migrations compilé, et `dist` contient les fichiers de test — un `*.test.ts` colocalisé
 * serait donc ramassé comme une migration.
 */
describe("migration backfill-offer-status-history-lba-5429", () => {
  useMongo()

  const updated_at = new Date("2026-03-12T08:30:00.000Z")

  const lbaOffer = (partner_job_id: string, overrides = {}) =>
    generateJobsPartnersOfferPrivate({
      partner_job_id,
      partner_label: JOBPARTNERS_LABEL.OFFRES_EMPLOI_LBA,
      offer_status_history: [],
      updated_at,
      ...overrides,
    })

  it("reconstitue une trace sur les offres LBA closes sans historique, et ne touche à rien d'autre", async () => {
    const existingEntry = {
      date: new Date("2026-02-01T00:00:00.000Z"),
      status: JOB_STATUS_ENGLISH.ANNULEE,
      reason: "offre expirée (date dépassée)",
      granted_by: "expire-jobs-partners",
    }

    await getDbCollection("jobs_partners").insertMany([
      // motif connu : recopié tel quel
      lbaOffer("avec-motif", { offer_status: JOB_STATUS_ENGLISH.ANNULEE, job_status_comment: "Je ne reçois pas de candidature" }),
      // aucun motif n'a jamais été enregistré
      lbaOffer("sans-motif", { offer_status: JOB_STATUS_ENGLISH.ANNULEE, job_status_comment: null }),
      // pourvue : même chemin de clôture, la mesure d'impact la plus utile du lot
      lbaOffer("pourvue", { offer_status: JOB_STATUS_ENGLISH.POURVUE, job_status_comment: "J'ai pourvu l'offre avec La bonne alternance" }),
      // déjà tracée : ne doit pas être écrasée
      lbaOffer("deja-tracee", { offer_status: JOB_STATUS_ENGLISH.ANNULEE, offer_status_history: [existingEntry] }),
      // encore ouverte : hors périmètre
      lbaOffer("active", { offer_status: JOB_STATUS_ENGLISH.ACTIVE }),
      // autre partenaire : hors périmètre
      generateJobsPartnersOfferPrivate({
        partner_job_id: "autre-partenaire",
        partner_label: JOBPARTNERS_LABEL.HELLOWORK,
        offer_status: JOB_STATUS_ENGLISH.ANNULEE,
        offer_status_history: [],
      }),
    ])

    await up()

    const byId = new Map((await getDbCollection("jobs_partners").find({}).toArray()).map((j) => [j.partner_job_id, j]))

    expect
      .soft(byId.get("avec-motif")?.offer_status_history)
      .toEqual([
        { date: updated_at, status: JOB_STATUS_ENGLISH.ANNULEE, reason: "Je ne reçois pas de candidature", granted_by: "20260915143000-backfill-offer-status-history-lba-5429" },
      ])
    expect.soft(byId.get("sans-motif")?.offer_status_history[0]).toMatchObject({
      status: JOB_STATUS_ENGLISH.ANNULEE,
      reason: "motif non enregistré (clôture antérieure au correctif #5429)",
    })
    expect.soft(byId.get("pourvue")?.offer_status_history[0]).toMatchObject({
      status: JOB_STATUS_ENGLISH.POURVUE,
      reason: "J'ai pourvu l'offre avec La bonne alternance",
    })
    expect.soft(byId.get("deja-tracee")?.offer_status_history).toEqual([existingEntry])
    expect.soft(byId.get("active")?.offer_status_history).toEqual([])
    expect.soft(byId.get("autre-partenaire")?.offer_status_history).toEqual([])
  })

  it("ne réécrit pas updated_at, qui sert de date à la trace", async () => {
    await getDbCollection("jobs_partners").insertOne(lbaOffer("offre", { offer_status: JOB_STATUS_ENGLISH.ANNULEE, job_status_comment: null }))

    await up()

    const job = await getDbCollection("jobs_partners").findOne({ partner_job_id: "offre" })
    expect.soft(job?.updated_at).toEqual(updated_at)
  })

  describe('requalification du motif "supprimée du flux source"', () => {
    const fluxRemoval = {
      date: new Date("2026-06-05T02:15:00.000Z"),
      status: JOB_STATUS_ENGLISH.ANNULEE,
      reason: "supprimée du flux source",
      granted_by: "cancel-removed-jobs-partners",
    }

    it("requalifie les entrées fautives des offres LBA, y compris celles réactivées depuis", async () => {
      const reactivation = {
        date: new Date("2026-06-11T14:35:00.000Z"),
        status: JOB_STATUS_ENGLISH.ACTIVE,
        reason: "réactivation suite à désactivation erronée du flux source",
        granted_by: "20260611143504-restore-jobs-partners-offres-emploi-lba",
      }

      await getDbCollection("jobs_partners").insertMany([
        lbaOffer("restee-close", { offer_status: JOB_STATUS_ENGLISH.ANNULEE, offer_status_history: [fluxRemoval] }),
        // réactivée par #4813 : l'entrée fautive est toujours là, à côté de la réactivation
        lbaOffer("reactivee", { offer_status: JOB_STATUS_ENGLISH.ACTIVE, offer_status_history: [fluxRemoval, reactivation] }),
      ])

      await up()

      const byId = new Map((await getDbCollection("jobs_partners").find({}).toArray()).map((j) => [j.partner_job_id, j]))

      expect.soft(byId.get("restee-close")?.offer_status_history).toEqual([{ ...fluxRemoval, reason: "bug du 06 2026" }])
      expect.soft(byId.get("reactivee")?.offer_status_history).toEqual([{ ...fluxRemoval, reason: "bug du 06 2026" }, reactivation])
    })

    it("ne touche ni aux autres motifs ni aux autres partenaires", async () => {
      const expiration = {
        date: new Date("2026-06-05T02:15:00.000Z"),
        status: JOB_STATUS_ENGLISH.ANNULEE,
        reason: "offre expirée (date dépassée)",
        granted_by: "expire-jobs-partners",
      }

      await getDbCollection("jobs_partners").insertMany([
        // motif légitime sur une offre LBA
        lbaOffer("autre-motif", { offer_status: JOB_STATUS_ENGLISH.ANNULEE, offer_status_history: [expiration] }),
        // même motif, mais partenaire traité par flux : il y est légitime
        generateJobsPartnersOfferPrivate({
          partner_job_id: "flux",
          partner_label: JOBPARTNERS_LABEL.HELLOWORK,
          offer_status: JOB_STATUS_ENGLISH.ANNULEE,
          offer_status_history: [fluxRemoval],
        }),
      ])

      await up()

      const byId = new Map((await getDbCollection("jobs_partners").find({}).toArray()).map((j) => [j.partner_job_id, j]))

      expect.soft(byId.get("autre-motif")?.offer_status_history).toEqual([expiration])
      expect.soft(byId.get("flux")?.offer_status_history).toEqual([fluxRemoval])
    })

    it("est idempotente", async () => {
      await getDbCollection("jobs_partners").insertOne(lbaOffer("offre", { offer_status: JOB_STATUS_ENGLISH.ANNULEE, offer_status_history: [fluxRemoval] }))

      await up()
      await up()

      const job = await getDbCollection("jobs_partners").findOne({ partner_job_id: "offre" })
      expect.soft(job?.offer_status_history).toEqual([{ ...fluxRemoval, reason: "bug du 06 2026" }])
    })
  })

  it("est idempotente : un second passage ne rajoute pas de trace", async () => {
    await getDbCollection("jobs_partners").insertOne(lbaOffer("offre", { offer_status: JOB_STATUS_ENGLISH.ANNULEE, job_status_comment: "Autre" }))

    await up()
    await up()

    const job = await getDbCollection("jobs_partners").findOne({ partner_job_id: "offre" })
    expect.soft(job?.offer_status_history).toHaveLength(1)
  })
})
