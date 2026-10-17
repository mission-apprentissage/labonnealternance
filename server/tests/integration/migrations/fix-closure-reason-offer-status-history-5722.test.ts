import { useMongo } from "@tests/utils/mongo.test.utils"
import { JOB_STATUS_ENGLISH } from "shared"
import { generateJobsPartnersOfferPrivate } from "shared/fixtures/job-partners.fixture"
import { JOBPARTNERS_LABEL } from "shared/models/jobs-partners.model"
import { describe, expect, it } from "vitest"
import { getDbCollection } from "@/common/utils/mongodb-utils"
import { up } from "@/migrations/20261014120000-fix-closure-reason-offer-status-history-5722"

// Test sous tests/ et non à côté de la migration : cf. backfill-offer-status-history-lba-5429.test.ts
describe("migration fix-closure-reason-offer-status-history-5722", () => {
  useMongo()

  const updated_at = new Date("2026-10-01T08:30:00.000Z")
  const RECRUTEUR = "clôture par le recruteur depuis l'espace pro"
  const CFA = "clôture par le CFA délégataire depuis l'espace pro"
  const ADMIN = "clôture par un administrateur depuis l'espace pro"
  const MAIL = "action du recruteur depuis un mail"

  const entry = (granted_by: string, reason: string, status = JOB_STATUS_ENGLISH.ANNULEE, date = new Date("2026-09-30T10:00:00.000Z")) => ({ date, status, reason, granted_by })

  const lbaOffer = (partner_job_id: string, overrides = {}) =>
    generateJobsPartnersOfferPrivate({
      partner_job_id,
      partner_label: JOBPARTNERS_LABEL.OFFRES_EMPLOI_LBA,
      offer_status: JOB_STATUS_ENGLISH.ANNULEE,
      updated_at,
      ...overrides,
    })

  const readAll = async () => new Map((await getDbCollection("jobs_partners").find({}).toArray()).map((j) => [j.partner_job_id, j]))

  describe("volet 1 — clôtures depuis l'espace pro hors administrateur", () => {
    it.each(["clôture par l'OPCO depuis l'espace pro", "clôture depuis l'espace pro (acteur indéterminé)"])("traite aussi « %s »", async (origin) => {
      await getDbCollection("jobs_partners").insertOne(
        lbaOffer("offre", { job_status_comment: "Je ne suis plus en recherche", offer_status_history: [entry(origin, "Je ne suis plus en recherche")] })
      )

      await up()
      const offer = (await readAll()).get("offre")

      expect.soft(offer?.offer_status_history).toEqual([entry(origin, "Désactivation manuelle")])
      expect.soft(offer?.job_status_comment).toBe("Je ne suis plus en recherche")
    })

    it("remplace le motif par « Désactivation manuelle » et le garde dans job_status_comment", async () => {
      await getDbCollection("jobs_partners").insertMany([
        lbaOffer("recruteur", { job_status_comment: "Je ne suis plus en recherche", offer_status_history: [entry(RECRUTEUR, "Je ne suis plus en recherche")] }),
        lbaOffer("cfa", {
          offer_status: JOB_STATUS_ENGLISH.POURVUE,
          job_status_comment: "J'ai pourvu l'offre avec La bonne alternance",
          offer_status_history: [entry(CFA, "J'ai pourvu l'offre avec La bonne alternance", JOB_STATUS_ENGLISH.POURVUE)],
        }),
      ])

      await up()
      const byId = await readAll()

      expect.soft(byId.get("recruteur")?.offer_status_history).toEqual([entry(RECRUTEUR, "Désactivation manuelle")])
      expect.soft(byId.get("recruteur")?.job_status_comment).toBe("Je ne suis plus en recherche")
      expect.soft(byId.get("recruteur")?.updated_at).toEqual(updated_at)
      expect.soft(byId.get("cfa")?.offer_status_history).toEqual([entry(CFA, "Désactivation manuelle", JOB_STATUS_ENGLISH.POURVUE)])
      expect.soft(byId.get("cfa")?.job_status_comment).toBe("J'ai pourvu l'offre avec La bonne alternance")
    })

    it("recopie dans job_status_comment le motif de la dernière clôture humaine", async () => {
      await getDbCollection("jobs_partners").insertMany([
        lbaOffer("comment-absent", { job_status_comment: null, offer_status_history: [entry(RECRUTEUR, "Autre")] }),
        // annulée depuis l'espace pro puis déclarée pourvue par mail : le motif du mail est le dernier
        lbaOffer("puis-mail", {
          offer_status: JOB_STATUS_ENGLISH.POURVUE,
          job_status_comment: "J'ai pourvu l'offre sans l'aide de La bonne alternance",
          offer_status_history: [
            entry(RECRUTEUR, "Je ne reçois pas de candidature"),
            entry(MAIL, "J'ai pourvu l'offre sans l'aide de La bonne alternance", JOB_STATUS_ENGLISH.POURVUE, new Date("2026-10-02T10:00:00.000Z")),
          ],
        }),
        // provideOffre n'écrit pas job_status_comment : le motif reste celui de la modale
        lbaOffer("puis-pourvue-en-un-clic", {
          offer_status: JOB_STATUS_ENGLISH.POURVUE,
          job_status_comment: "Je ne reçois pas de candidature",
          offer_status_history: [
            entry(CFA, "Je ne reçois pas de candidature"),
            entry(MAIL, "offre déclarée pourvue par le recruteur", JOB_STATUS_ENGLISH.POURVUE, new Date("2026-10-02T10:00:00.000Z")),
          ],
        }),
        // la route v2 d'annulation n'écrit pas job_status_comment non plus
        lbaOffer("puis-annulee-en-un-clic", {
          job_status_comment: null,
          offer_status_history: [
            entry(RECRUTEUR, "J'ai pourvu l'offre avec La bonne alternance", JOB_STATUS_ENGLISH.POURVUE),
            entry(MAIL, "offre annulée par le recruteur", JOB_STATUS_ENGLISH.ANNULEE, new Date("2026-10-02T10:00:00.000Z")),
          ],
        }),
      ])

      await up()
      const byId = await readAll()

      expect.soft(byId.get("puis-annulee-en-un-clic")?.job_status_comment).toBe("J'ai pourvu l'offre avec La bonne alternance")
      expect.soft(byId.get("comment-absent")?.job_status_comment).toBe("Autre")
      expect.soft(byId.get("puis-mail")?.job_status_comment).toBe("J'ai pourvu l'offre sans l'aide de La bonne alternance")
      expect.soft(byId.get("puis-mail")?.offer_status_history[0].reason).toBe("Désactivation manuelle")
      expect.soft(byId.get("puis-pourvue-en-un-clic")?.job_status_comment).toBe("Je ne reçois pas de candidature")
    })

    it("ne touche ni les autres origines ni les autres partenaires", async () => {
      const untouched = [
        entry("expire-jobs-partners", "offre expirée (date dépassée)", JOB_STATUS_ENGLISH.ANNULEE, new Date("2026-09-28T02:00:00.000Z")),
        entry("20260915143000-backfill-offer-status-history-lba-5429", "Désactivation manuelle"),
      ]
      await getDbCollection("jobs_partners").insertMany([
        lbaOffer("hors-perimetre", { job_status_comment: "Autre", offer_status_history: untouched }),
        generateJobsPartnersOfferPrivate({
          partner_job_id: "autre-partenaire",
          partner_label: JOBPARTNERS_LABEL.HELLOWORK,
          offer_status: JOB_STATUS_ENGLISH.ANNULEE,
          offer_status_history: [entry(RECRUTEUR, "Je ne suis plus en recherche")],
        }),
      ])

      await up()
      const byId = await readAll()

      expect.soft(byId.get("hors-perimetre")?.offer_status_history).toEqual(untouched)
      expect.soft(byId.get("hors-perimetre")?.job_status_comment).toBe("Autre")
      expect.soft(byId.get("autre-partenaire")?.offer_status_history).toEqual([entry(RECRUTEUR, "Je ne suis plus en recherche")])
    })

    it("est idempotent", async () => {
      await getDbCollection("jobs_partners").insertOne(
        lbaOffer("recruteur", { job_status_comment: "Je ne suis plus en recherche", offer_status_history: [entry(RECRUTEUR, "Je ne suis plus en recherche")] })
      )

      await up()
      const afterFirstRun = await readAll()
      await up()

      expect(await readAll()).toEqual(afterFirstRun)
    })
  })

  describe("volet 2 — clôtures admin depuis l'espace pro", () => {
    it("remplace le motif par « Action admin » et le garde dans job_status_comment", async () => {
      await getDbCollection("jobs_partners").insertOne(
        lbaOffer("admin", {
          job_status_comment: "Autre",
          job_status_comment_precision: "doublon",
          offer_status_history: [entry(ADMIN, "Autre")],
        })
      )

      await up()
      const admin = (await readAll()).get("admin")

      expect.soft(admin?.offer_status_history).toEqual([entry(ADMIN, "Action admin")])
      expect.soft(admin?.job_status_comment).toBe("Autre")
      expect.soft(admin?.job_status_comment_precision).toBe("doublon")
      expect.soft(admin?.updated_at).toEqual(updated_at)
    })

    it("garde le motif de l'admin quand il a repris une offre clôturée par le recruteur", async () => {
      await getDbCollection("jobs_partners").insertOne(
        lbaOffer("recruteur-puis-admin", {
          offer_status: JOB_STATUS_ENGLISH.POURVUE,
          job_status_comment: "J'ai pourvu l'offre avec La bonne alternance",
          offer_status_history: [
            entry(RECRUTEUR, "Je ne suis plus en recherche"),
            entry(ADMIN, "J'ai pourvu l'offre avec La bonne alternance", JOB_STATUS_ENGLISH.POURVUE, new Date("2026-10-02T10:00:00.000Z")),
          ],
        })
      )

      await up()
      const offer = (await readAll()).get("recruteur-puis-admin")

      expect.soft(offer?.offer_status_history.map(({ reason }) => reason)).toEqual(["Désactivation manuelle", "Action admin"])
      expect.soft(offer?.job_status_comment).toBe("J'ai pourvu l'offre avec La bonne alternance")
    })
  })

  describe("volet 3 — réponses du recruteur par mail", () => {
    const expiration = entry("expire-jobs-partners", "offre expirée (date dépassée)", JOB_STATUS_ENGLISH.ANNULEE, new Date("2026-09-28T02:00:00.000Z"))

    it("remplace le motif par « Réponse recruteur par mail » sans toucher la clôture automatique", async () => {
      await getDbCollection("jobs_partners").insertOne(
        lbaOffer("mail", {
          offer_status: JOB_STATUS_ENGLISH.POURVUE,
          job_status_comment: "J'ai pourvu l'offre avec La bonne alternance",
          offer_status_history: [expiration, entry(MAIL, "J'ai pourvu l'offre avec La bonne alternance", JOB_STATUS_ENGLISH.POURVUE)],
        })
      )

      await up()
      const offer = (await readAll()).get("mail")

      expect.soft(offer?.offer_status_history).toEqual([expiration, entry(MAIL, "Réponse recruteur par mail", JOB_STATUS_ENGLISH.POURVUE)])
      expect.soft(offer?.job_status_comment).toBe("J'ai pourvu l'offre avec La bonne alternance")
    })

    it.each(["offre déclarée pourvue par le recruteur", "offre annulée par le recruteur"])("laisse « %s », qui ne porte pas de motif", async (reason) => {
      const history = [expiration, entry(MAIL, reason, JOB_STATUS_ENGLISH.POURVUE)]
      await getDbCollection("jobs_partners").insertOne(
        lbaOffer("sans-motif", { offer_status: JOB_STATUS_ENGLISH.POURVUE, job_status_comment: null, offer_status_history: history })
      )

      await up()
      const offer = (await readAll()).get("sans-motif")

      expect.soft(offer?.offer_status_history).toEqual(history)
      expect.soft(offer?.job_status_comment).toBeNull()
    })
  })
})
