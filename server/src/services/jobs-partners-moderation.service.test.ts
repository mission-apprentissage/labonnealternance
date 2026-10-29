import { useMongo } from "@tests/utils/mongo.test.utils"
import { generateJobsPartnersOfferPrivate } from "shared/fixtures/job-partners.fixture"
import { JOBPARTNERS_LABEL } from "shared/models/jobs-partners.model"
import { describe, expect, it } from "vitest"

import { getDbCollection } from "@/common/utils/mongodb-utils"
import { getLatestModeration, type ITimedClassification, isBlockingClassification, recordClassification } from "./jobs-partners-moderation.service"

useMongo()

const classification = (overrides: Partial<ITimedClassification["result"]> = {}): ITimedClassification => ({
  result: { verdict: "conforme", findings: [], status: "ok", promptVersion: "1.3.0", model: "mistral-large-2512", ...overrides },
  durationMs: 1200,
})

describe("isBlockingClassification", () => {
  it.each([
    ["conforme", "ok", false],
    ["a_verifier", "ok", false],
    ["non_conforme", "ok", true],
    // Le classifieur en échec rend a_verifier : seul le statut distingue la panne d'un doute.
    ["a_verifier", "indisponible", true],
    ["conforme", "indisponible", true],
  ] as const)("%s / %s ⇒ bloquant : %s", (verdict, status, expected) => {
    expect(isBlockingClassification({ verdict, status })).toBe(expected)
  })
})

describe("recordClassification", () => {
  const saveOffer = async () => {
    const offer = generateJobsPartnersOfferPrivate({
      partner_label: JOBPARTNERS_LABEL.OFFRES_EMPLOI_LBA,
      offer_moderation_verdict: "non_conforme",
      offer_moderation_status: "ok",
      offer_moderation_review: "refusee",
    })
    await getDbCollection("jobs_partners").insertOne(offer)
    return offer
  }

  it("enregistre le texte transmis masqué, et remet la décision humaine à traiter sur l'offre", async () => {
    const offer = await saveOffer()

    await recordClassification({
      jobId: offer._id,
      trigger: "edition",
      classification: classification({ verdict: "a_verifier" }),
      texts: { job_description: "  Écrivez au 06 12 34 56 78  ", job_employer_description: null },
      originalText: { job_description: "Écrivez au 06 12 34 56 78", job_employer_description: null },
      updateOffer: true,
    })

    const moderation = await getLatestModeration(offer._id)
    expect(moderation).toMatchObject({ trigger: "edition", verdict: "a_verifier", status: "ok", duration_ms: 1200, review: null })
    expect(moderation?.masked_text?.job_description).not.toContain("06 12 34 56 78")
    expect(moderation?.masked_text?.job_employer_description).toBeNull()
    expect(await getDbCollection("jobs_partners").findOne({ _id: offer._id })).toMatchObject({
      offer_moderation_verdict: "a_verifier",
      offer_moderation_status: "ok",
      offer_moderation_review: null,
    })
  })

  it("laisse l'offre intacte sans updateOffer, et renvoie la classification la plus récente", async () => {
    const offer = await saveOffer()
    const texts = { job_description: "Texte", job_employer_description: null }

    await recordClassification({
      jobId: offer._id,
      trigger: "creation",
      classification: classification(),
      texts,
      originalText: texts,
      updateOffer: false,
      date: new Date("2026-10-01"),
    })
    await recordClassification({
      jobId: offer._id,
      trigger: "rejeu",
      classification: classification({ verdict: "a_verifier" }),
      texts,
      originalText: null,
      updateOffer: false,
      date: new Date("2026-10-02"),
    })

    expect(await getLatestModeration(offer._id)).toMatchObject({ trigger: "rejeu", original_text: null })
    expect(await getDbCollection("jobs_partners").findOne({ _id: offer._id })).toMatchObject({ offer_moderation_verdict: "non_conforme", offer_moderation_review: "refusee" })
  })
})
