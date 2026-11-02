import { JOB_STATUS } from "shared"
import { describe, expect, it } from "vitest"
import { awaitsModerationDecision } from "./moderation.types"

describe("awaitsModerationDecision", () => {
  it.each(["a_verifier", "non_conforme"] as const)("retient une offre en ligne %s sans décision", (verdict) => {
    expect(awaitsModerationDecision(JOB_STATUS.ACTIVE, { offer_moderation_verdict: verdict, offer_moderation_review: null })).toBe(true)
  })

  it.each([
    ["conforme", { offer_moderation_verdict: "conforme", offer_moderation_review: null }],
    ["déjà validée", { offer_moderation_verdict: "non_conforme", offer_moderation_review: "validee" }],
    ["jamais analysée", { offer_moderation_verdict: null, offer_moderation_review: null }],
  ] as const)("écarte une offre en ligne %s", (_, summary) => {
    expect(awaitsModerationDecision(JOB_STATUS.ACTIVE, summary)).toBe(false)
  })

  it("écarte une offre hors du périmètre de modération, sans résumé", () => {
    expect(awaitsModerationDecision(JOB_STATUS.ACTIVE, undefined)).toBe(false)
  })

  it("écarte une offre en attente du compte : elle n'est pas dans la file", () => {
    expect(awaitsModerationDecision(JOB_STATUS.EN_ATTENTE, { offer_moderation_verdict: "a_verifier", offer_moderation_review: null })).toBe(false)
  })
})
