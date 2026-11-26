import { afterEach, describe, expect, it, vi } from "vitest"

import { MATOMO_EVENTS, pushMatomoEvent } from "./matomo-utils"

const config = vi.hoisted(() => ({ env: "local" }))
vi.mock("@/config.public", () => ({ publicConfig: config }))

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

describe("pushMatomoEvent, affichage en console", () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  const push = (env: string) => {
    config.env = env
    vi.stubGlobal("window", {})
    const info = vi.spyOn(console, "info").mockImplementation(() => undefined)
    const event = { event: MATOMO_EVENTS.APPLICATIONS_LIST_VIEWED, user_type: "entreprise" }
    pushMatomoEvent(event)
    return { info, event }
  }

  it.each(["local", "preview"])("affiche l'événement en %s, où aucun conteneur ne l'envoie", (env) => {
    const { info, event } = push(env)

    expect(info).toHaveBeenCalledWith("[matomo] applications_list_viewed", event)
  })

  it.each(["recette", "pentest", "production"])("n'affiche rien en %s", (env) => {
    expect(push(env).info).not.toHaveBeenCalled()
  })
})
