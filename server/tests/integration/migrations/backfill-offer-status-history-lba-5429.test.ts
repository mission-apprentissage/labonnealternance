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
  const GRANTED_BY = "20260915143000-backfill-offer-status-history-lba-5429"

  const lbaOffer = (partner_job_id: string, overrides = {}) =>
    generateJobsPartnersOfferPrivate({
      partner_job_id,
      partner_label: JOBPARTNERS_LABEL.OFFRES_EMPLOI_LBA,
      offer_status_history: [],
      job_status_comment: null,
      updated_at,
      ...overrides,
    })

  const readAll = async () => new Map((await getDbCollection("jobs_partners").find({}).toArray()).map((j) => [j.partner_job_id, j]))

  describe("volet 1 — offres closes sans motif ni historique", () => {
    it("pose un libellé explicite plutôt que de laisser un historique vide", async () => {
      await getDbCollection("jobs_partners").insertMany([
        lbaOffer("annulee", { offer_status: JOB_STATUS_ENGLISH.ANNULEE }),
        lbaOffer("pourvue", { offer_status: JOB_STATUS_ENGLISH.POURVUE }),
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
      const byId = await readAll()

      expect
        .soft(byId.get("annulee")?.offer_status_history)
        .toEqual([{ date: updated_at, status: JOB_STATUS_ENGLISH.ANNULEE, reason: "motif non enregistré (clôture antérieure au correctif #5429)", granted_by: GRANTED_BY }])
      expect.soft(byId.get("pourvue")?.offer_status_history[0]).toMatchObject({ status: JOB_STATUS_ENGLISH.POURVUE })
      expect.soft(byId.get("active")?.offer_status_history).toEqual([])
      expect.soft(byId.get("autre-partenaire")?.offer_status_history).toEqual([])
    })

    it("laisse les offres avec un motif au volet 3", async () => {
      await getDbCollection("jobs_partners").insertOne(lbaOffer("avec-motif", { offer_status: JOB_STATUS_ENGLISH.ANNULEE, job_status_comment: "Je ne reçois pas de candidature" }))

      await up()
      const byId = await readAll()

      // une seule entrée, celle du volet 3 — pas de doublon entre les deux volets
      expect
        .soft(byId.get("avec-motif")?.offer_status_history)
        .toEqual([{ date: updated_at, status: JOB_STATUS_ENGLISH.ANNULEE, reason: "Désactivation manuelle", granted_by: GRANTED_BY }])
    })
  })

  describe("volet 2 — requalification du motif « supprimée du flux source »", () => {
    const fluxRemoval = {
      date: new Date("2026-06-05T02:15:00.000Z"),
      status: JOB_STATUS_ENGLISH.ANNULEE,
      reason: "supprimée du flux source",
      granted_by: "cancel-removed-jobs-partners",
    }

    it("requalifie les entrées fautives, y compris sur les offres réactivées depuis", async () => {
      const reactivation = {
        date: new Date("2026-06-11T14:35:00.000Z"),
        status: JOB_STATUS_ENGLISH.ACTIVE,
        reason: "réactivation suite à désactivation erronée du flux source",
        granted_by: "20260611143504-restore-jobs-partners-offres-emploi-lba",
      }

      await getDbCollection("jobs_partners").insertMany([
        lbaOffer("restee-close", { offer_status: JOB_STATUS_ENGLISH.ANNULEE, offer_status_history: [fluxRemoval] }),
        lbaOffer("reactivee", { offer_status: JOB_STATUS_ENGLISH.ACTIVE, offer_status_history: [fluxRemoval, reactivation] }),
      ])

      await up()
      const byId = await readAll()

      expect.soft(byId.get("restee-close")?.offer_status_history).toEqual([{ ...fluxRemoval, reason: "bug du 06 2026" }])
      expect.soft(byId.get("reactivee")?.offer_status_history).toEqual([{ ...fluxRemoval, reason: "bug du 06 2026" }, reactivation])
    })

    it("épargne une entrée postérieure au run fautif", async () => {
      // cancelRemovedJobsPartners tourne toujours et pose ce motif légitimement : au-delà de la
      // borne de juillet 2026, ce n'est plus le bug, et requalifier effacerait la vraie cause.
      const posterieure = { ...fluxRemoval, date: new Date("2026-08-20T03:00:00.000Z") }
      await getDbCollection("jobs_partners").insertMany([
        lbaOffer("avant-borne", { offer_status: JOB_STATUS_ENGLISH.ANNULEE, offer_status_history: [fluxRemoval] }),
        lbaOffer("apres-borne", { offer_status: JOB_STATUS_ENGLISH.ANNULEE, offer_status_history: [posterieure] }),
        lbaOffer("les-deux", { offer_status: JOB_STATUS_ENGLISH.ANNULEE, offer_status_history: [fluxRemoval, posterieure] }),
      ])

      await up()
      const byId = await readAll()

      expect.soft(byId.get("avant-borne")?.offer_status_history).toEqual([{ ...fluxRemoval, reason: "bug du 06 2026" }])
      expect.soft(byId.get("apres-borne")?.offer_status_history).toEqual([posterieure])
      // Sur une même offre, seule l'entrée antérieure à la borne bascule.
      expect.soft(byId.get("les-deux")?.offer_status_history).toEqual([{ ...fluxRemoval, reason: "bug du 06 2026" }, posterieure])
    })

    it("ne touche ni aux autres motifs ni aux autres partenaires", async () => {
      const expiration = {
        date: new Date("2026-06-05T02:15:00.000Z"),
        status: JOB_STATUS_ENGLISH.ANNULEE,
        reason: "offre expirée (date dépassée)",
        granted_by: "expire-jobs-partners",
      }

      await getDbCollection("jobs_partners").insertMany([
        lbaOffer("autre-motif", { offer_status: JOB_STATUS_ENGLISH.ANNULEE, offer_status_history: [expiration] }),
        generateJobsPartnersOfferPrivate({
          partner_job_id: "flux",
          partner_label: JOBPARTNERS_LABEL.HELLOWORK,
          offer_status: JOB_STATUS_ENGLISH.ANNULEE,
          offer_status_history: [fluxRemoval],
        }),
      ])

      await up()
      const byId = await readAll()

      expect.soft(byId.get("autre-motif")?.offer_status_history).toEqual([expiration])
      expect.soft(byId.get("flux")?.offer_status_history).toEqual([fluxRemoval])
    })
  })

  describe("volet 3 — reprise de stock des clôtures manuelles", () => {
    it("trace les offres closes portant un motif, avec le statut du document et la date de updated_at", async () => {
      await getDbCollection("jobs_partners").insertMany([
        lbaOffer("annulee", { offer_status: JOB_STATUS_ENGLISH.ANNULEE, job_status_comment: "Je ne suis plus en recherche" }),
        lbaOffer("pourvue", { offer_status: JOB_STATUS_ENGLISH.POURVUE, job_status_comment: "J'ai pourvu l'offre avec La bonne alternance" }),
      ])

      await up()
      const byId = await readAll()

      expect
        .soft(byId.get("annulee")?.offer_status_history)
        .toEqual([{ date: updated_at, status: JOB_STATUS_ENGLISH.ANNULEE, reason: "Désactivation manuelle", granted_by: GRANTED_BY }])
      expect
        .soft(byId.get("pourvue")?.offer_status_history)
        .toEqual([{ date: updated_at, status: JOB_STATUS_ENGLISH.POURVUE, reason: "Désactivation manuelle", granted_by: GRANTED_BY }])
      // le motif d'origine reste lisible dans son champ dédié
      expect.soft(byId.get("pourvue")?.job_status_comment).toBe("J'ai pourvu l'offre avec La bonne alternance")
    })

    it("ajoute la trace sans écraser un historique déjà présent", async () => {
      const expiration = {
        date: new Date("2026-05-01T00:00:00.000Z"),
        status: JOB_STATUS_ENGLISH.ANNULEE,
        reason: "offre expirée (date dépassée)",
        granted_by: "expire-jobs-partners",
      }
      await getDbCollection("jobs_partners").insertOne(
        lbaOffer("offre", { offer_status: JOB_STATUS_ENGLISH.ANNULEE, job_status_comment: "Autre", offer_status_history: [expiration] })
      )

      await up()
      const byId = await readAll()

      expect
        .soft(byId.get("offre")?.offer_status_history)
        .toEqual([expiration, { date: updated_at, status: JOB_STATUS_ENGLISH.ANNULEE, reason: "Désactivation manuelle", granted_by: GRANTED_BY }])
    })

    it("n'ajoute rien si l'entrée correspondante existe déjà", async () => {
      const existing = { date: new Date("2026-04-01T00:00:00.000Z"), status: JOB_STATUS_ENGLISH.ANNULEE, reason: "Désactivation manuelle", granted_by: "un-autre-passage" }
      await getDbCollection("jobs_partners").insertOne(
        lbaOffer("offre", { offer_status: JOB_STATUS_ENGLISH.ANNULEE, job_status_comment: "Autre", offer_status_history: [existing] })
      )

      await up()
      const byId = await readAll()

      expect.soft(byId.get("offre")?.offer_status_history).toEqual([existing])
    })

    it("distingue les statuts : une trace Pourvue ne dispense pas d'une trace Cancelled", async () => {
      // l'offre a été déclarée pourvue puis annulée : seule la trace du statut courant manque
      const pourvue = { date: new Date("2026-04-01T00:00:00.000Z"), status: JOB_STATUS_ENGLISH.POURVUE, reason: "Désactivation manuelle", granted_by: "un-autre-passage" }
      await getDbCollection("jobs_partners").insertOne(
        lbaOffer("offre", { offer_status: JOB_STATUS_ENGLISH.ANNULEE, job_status_comment: "Autre", offer_status_history: [pourvue] })
      )

      await up()
      const byId = await readAll()

      expect
        .soft(byId.get("offre")?.offer_status_history)
        .toEqual([pourvue, { date: updated_at, status: JOB_STATUS_ENGLISH.ANNULEE, reason: "Désactivation manuelle", granted_by: GRANTED_BY }])
    })

    it("ignore les offres actives et les motifs vides", async () => {
      await getDbCollection("jobs_partners").insertMany([
        lbaOffer("active", { offer_status: JOB_STATUS_ENGLISH.ACTIVE, job_status_comment: "Autre" }),
        lbaOffer("motif-vide", { offer_status: JOB_STATUS_ENGLISH.ANNULEE, job_status_comment: "" }),
      ])

      await up()
      const byId = await readAll()

      expect.soft(byId.get("active")?.offer_status_history).toEqual([])
      // motif vide : relève du volet 1, pas du volet 3
      expect.soft(byId.get("motif-vide")?.offer_status_history[0]?.reason).toBe("motif non enregistré (clôture antérieure au correctif #5429)")
    })
  })

  it("est idempotente sur les trois volets", async () => {
    await getDbCollection("jobs_partners").insertMany([
      lbaOffer("sans-motif", { offer_status: JOB_STATUS_ENGLISH.ANNULEE }),
      lbaOffer("avec-motif", { offer_status: JOB_STATUS_ENGLISH.POURVUE, job_status_comment: "Autre" }),
      lbaOffer("flux", {
        offer_status: JOB_STATUS_ENGLISH.ANNULEE,
        offer_status_history: [{ date: updated_at, status: JOB_STATUS_ENGLISH.ANNULEE, reason: "supprimée du flux source", granted_by: "cancel-removed-jobs-partners" }],
      }),
    ])

    await up()
    const afterFirst = await readAll()
    await up()
    const afterSecond = await readAll()

    for (const id of ["sans-motif", "avec-motif", "flux"]) {
      expect.soft(afterSecond.get(id)?.offer_status_history).toEqual(afterFirst.get(id)?.offer_status_history)
    }
  })

  it("traite aussi les offres anciennes qui ne passent plus la validation de schéma", async () => {
    // Hors production, jobs_partners est en validationAction error : un document qui ne respecte plus le
    // schéma courant fait échouer toute mise à jour, même sans rapport avec le champ fautif (code 121).
    const withoutApplyUrl = (doc: ReturnType<typeof lbaOffer>) => {
      const { apply_url: _, ...rest } = doc
      return rest as typeof doc
    }
    const legacyDocs = [
      withoutApplyUrl(lbaOffer("sans-motif", { offer_status: JOB_STATUS_ENGLISH.ANNULEE })),
      withoutApplyUrl(
        lbaOffer("flux", {
          offer_status_history: [
            { date: new Date("2026-06-10T00:00:00.000Z"), status: JOB_STATUS_ENGLISH.ANNULEE, reason: "supprimée du flux source", granted_by: "cancel-removed-jobs-partners" },
          ],
        })
      ),
      withoutApplyUrl(lbaOffer("avec-motif", { offer_status: JOB_STATUS_ENGLISH.ANNULEE, job_status_comment: "Je ne reçois pas de candidature" })),
    ]
    const collection = getDbCollection("jobs_partners")

    // Garde-fou anti-vacuité : sans ce refus, le test ne prouve rien.
    await expect(collection.insertOne(legacyDocs[0])).rejects.toMatchObject({ code: 121 })
    await collection.insertMany(legacyDocs, { bypassDocumentValidation: true })

    await up()
    const byId = await readAll()

    expect.soft(byId.get("sans-motif")?.offer_status_history).toHaveLength(1)
    expect.soft(byId.get("flux")?.offer_status_history[0]?.reason).toBe("bug du 06 2026")
    expect.soft(byId.get("avec-motif")?.offer_status_history).toMatchObject([{ reason: "Désactivation manuelle" }])
  })
})
