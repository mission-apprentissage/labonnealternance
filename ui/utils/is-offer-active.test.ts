import type { ILbaItemPartnerJobJson } from "shared"
import { LBA_ITEM_TYPE } from "shared/constants/lbaitem"
import { describe, expect, it } from "vitest"

import { isOfferActive } from "./is-offer-active"

const DAY_MS = 24 * 60 * 60 * 1000

function offre(status: string, jobExpirationDate: string | null) {
  return { ideaType: LBA_ITEM_TYPE.OFFRES_EMPLOI_LBA, job: { status, jobExpirationDate } } as unknown as ILbaItemPartnerJobJson
}

describe("isOfferActive", () => {
  it("une offre active non expirée est active", () => {
    expect(isOfferActive(offre("Active", new Date(Date.now() + 30 * DAY_MS).toISOString()))).toBe(true)
  })

  it("une offre active expirée depuis plus de 24 h n'est plus active", () => {
    expect(isOfferActive(offre("Active", new Date(Date.now() - 2 * DAY_MS).toISOString()))).toBe(false)
  })

  it("une offre pourvue n'est pas active", () => {
    expect(isOfferActive(offre("Pourvue", null))).toBe(false)
  })
})
