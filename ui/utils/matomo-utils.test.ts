import { describe, expect, it } from "vitest"

import { MATOMO_EVENTS, pushMatomoEvent } from "./matomo-utils"

describe("pushMatomoEvent", () => {
  // Vérifié par `yarn typecheck` : une directive @ts-expect-error devenue inutile fait échouer tsc.
  it("n'accepte que les valeurs de MATOMO_EVENTS", () => {
    // @ts-expect-error chaîne hors de MATOMO_EVENTS
    const literal = () => pushMatomoEvent({ event: "filter_handi_changed" })
    // @ts-expect-error string non restreinte
    const wide = () => pushMatomoEvent({ event: "search_launched" as string })
    const valid = () => pushMatomoEvent({ event: MATOMO_EVENTS.SEARCH_LAUNCHED })

    expect([literal, wide, valid]).toHaveLength(3)
  })
})
