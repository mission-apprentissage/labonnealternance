import { useMongo } from "@tests/utils/mongo.test.utils"
import { ObjectId } from "mongodb"
import { generateJobsPartnersOfferPrivate } from "shared/fixtures/job-partners.fixture"
import { JOB_STATUS_ENGLISH } from "shared/models/index"
import { JOBPARTNERS_LABEL } from "shared/models/jobs-partners.model"
import type { IJobsPartnersModeration, IJobsPartnersModerationFinding, IModerationCategory } from "shared/models/jobs-partners-moderation.model"
import { describe, expect, it } from "vitest"
import { getDbCollection } from "@/common/utils/mongodb-utils"
import { up } from "@/migrations/20261104180000-off-platform-only-pending-moderations-5843"

const finding = (category: IModerationCategory, verbatim: string | null = "CV par e-mail à emxxx@xxx.fr"): IJobsPartnersModerationFinding => ({
  champ: "job_description",
  category,
  severity: "doute",
  verbatim,
})

// Test hors du dossier migrations : cf. normalize-naf-jobs-partners.test.ts
describe("migration off-platform-only-pending-moderations-5843", () => {
  useMongo()

  const saveOffer = async (partner_job_id: string, overrides: Parameters<typeof generateJobsPartnersOfferPrivate>[0] = {}) => {
    const offer = generateJobsPartnersOfferPrivate({
      partner_job_id,
      partner_label: JOBPARTNERS_LABEL.OFFRES_EMPLOI_LBA,
      offer_status: JOB_STATUS_ENGLISH.EN_ATTENTE,
      offer_moderation_verdict: "a_verifier",
      offer_moderation_status: "ok",
      offer_moderation_review: null,
      ...overrides,
    })
    await getDbCollection("jobs_partners").insertOne(offer)
    return offer._id
  }

  const saveModeration = async (job_id: ObjectId, findings: IJobsPartnersModerationFinding[], created_at = new Date("2026-11-01T10:00:00Z")) => {
    const moderation: IJobsPartnersModeration = {
      _id: new ObjectId(),
      job_id,
      trigger: "creation",
      verdict: "a_verifier",
      status: "ok",
      findings,
      original_text: null,
      masked_text: null,
      prompt_version: "1.3.0",
      model: "mistral-large-2512",
      duration_ms: 1000,
      review: null,
      created_at,
    }
    await getDbCollection("jobs_partners_moderations").insertOne(moderation)
  }

  const verdictOf = async (partner_job_id: string) => (await getDbCollection("jobs_partners").findOne({ partner_job_id }))?.offer_moderation_verdict

  it("passe conforme une offre en attente du compte dont la dernière classification ne relève que la candidature hors plateforme", async () => {
    const jobId = await saveOffer("en-attente")
    await saveModeration(jobId, [finding("candidature_hors_plateforme"), finding("candidature_hors_plateforme")])

    await up()

    expect(await verdictOf("en-attente")).toBe("conforme")
    expect(await getDbCollection("jobs_partners").findOne({ _id: jobId })).toMatchObject({ offer_status: JOB_STATUS_ENGLISH.EN_ATTENTE })
    expect(await getDbCollection("jobs_partners_moderations").findOne({ job_id: jobId })).toMatchObject({ verdict: "a_verifier", findings: [{}, {}] })
  })

  it("reprend les offres publiées ou en modération restées à vérifier", async () => {
    for (const [id, offer_status] of [
      ["publiee", JOB_STATUS_ENGLISH.ACTIVE],
      ["en-moderation", JOB_STATUS_ENGLISH.EN_MODERATION],
    ] as const) {
      await saveModeration(await saveOffer(id, { offer_status }), [finding("candidature_hors_plateforme")])
    }

    await up()

    expect.soft(await verdictOf("publiee")).toBe("conforme")
    expect.soft(await verdictOf("en-moderation")).toBe("conforme")
  })

  it("garde à vérifier une offre en attente avec un autre finding, une dernière classification différente, sans finding, un pseudo ou un extrait purgé", async () => {
    const withOther = await saveOffer("avec-autre")
    await saveModeration(withOther, [finding("candidature_hors_plateforme"), finding("mineurs")])

    const withCharter = await saveOffer("avec-charte")
    await saveModeration(withCharter, [finding("candidature_hors_plateforme"), finding("experience_exigee")])

    const olderOnly = await saveOffer("ancienne-seulement")
    await saveModeration(olderOnly, [finding("candidature_hors_plateforme")], new Date("2026-10-01T10:00:00Z"))
    await saveModeration(olderOnly, [finding("teletravail_integral")], new Date("2026-10-15T10:00:00Z"))

    const withoutFinding = await saveOffer("sans-finding")
    await saveModeration(withoutFinding, [])

    await saveOffer("sans-classification")

    const withHandle = await saveOffer("pseudo")
    await saveModeration(withHandle, [finding("candidature_hors_plateforme", "Retrouvez-nous sur insta : @recrut_alternance_2026")])

    const purged = await saveOffer("purgee")
    await saveModeration(purged, [finding("candidature_hors_plateforme", null)])

    await up()

    for (const id of ["avec-autre", "avec-charte", "ancienne-seulement", "sans-finding", "sans-classification", "pseudo", "purgee"]) {
      expect.soft(await verdictOf(id), id).toBe("a_verifier")
    }
  })

  it("ne touche ni une offre close, ni une offre déjà tranchée, non conforme, indisponible ou d'un autre partenaire", async () => {
    const offers = {
      expiree: await saveOffer("expiree", { offer_status: JOB_STATUS_ENGLISH.ANNULEE }),
      pourvue: await saveOffer("pourvue", { offer_status: JOB_STATUS_ENGLISH.POURVUE }),
      tranchee: await saveOffer("tranchee", { offer_moderation_review: "validee" }),
      "non-conforme": await saveOffer("non-conforme", { offer_moderation_verdict: "non_conforme" }),
      indisponible: await saveOffer("indisponible", { offer_moderation_status: "indisponible" }),
      hellowork: await saveOffer("hellowork", { partner_label: JOBPARTNERS_LABEL.HELLOWORK }),
    }
    for (const jobId of Object.values(offers)) {
      await saveModeration(jobId, [finding("candidature_hors_plateforme")])
    }

    await up()

    for (const id of ["expiree", "pourvue", "tranchee", "indisponible", "hellowork"]) {
      expect.soft(await verdictOf(id), id).toBe("a_verifier")
    }
    expect.soft(await verdictOf("non-conforme")).toBe("non_conforme")
  })
})
