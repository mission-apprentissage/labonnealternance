import { describe, expect, it } from "vitest"

import { ACCOUNT_OFFER_CONFORMITIES } from "../models/jobs-partners-moderation.model.js"
import { MODERATION_SEARCH_CONFORMITY } from "./jobs-partners-moderation.routes.js"

describe("ordre de gravité de la conformité (#5757)", () => {
  it("est le même pour les offres et pour les listes de comptes", () => {
    expect([...MODERATION_SEARCH_CONFORMITY]).toEqual(ACCOUNT_OFFER_CONFORMITIES.filter((conformity) => conformity !== "aucune_offre"))
  })
})
