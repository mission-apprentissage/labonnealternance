import { afterEach, describe, expect, it, vi } from "vitest"
import { readModerationQueueState, toModerationQueueQuery, writeModerationQueueState } from "./moderation-queue-state"

const stubSessionStorage = (initial: Record<string, string> = {}) => {
  const store = new Map(Object.entries(initial))
  vi.stubGlobal("window", {
    sessionStorage: { getItem: (key: string) => store.get(key) ?? null, setItem: (key: string, value: string) => store.set(key, value) },
  })
  return store
}

const STATE = {
  conformity: ["non_conforme" as const],
  account_status: [],
  account_type: [],
  opco: [],
  search: "contact@mail.com",
  sort: "recruiter" as const,
  order: "asc" as const,
  offset: 50,
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe("état de la file de modération", () => {
  it("relit l'état écrit pour le même type d'utilisateur seulement", () => {
    stubSessionStorage()

    writeModerationQueueState("ADMIN", STATE)

    expect(readModerationQueueState("ADMIN")).toEqual(STATE)
    expect(readModerationQueueState("OPCO")).toBeNull()
  })

  it.each([
    ["JSON illisible", "{"],
    ["valeur hors énumération", JSON.stringify({ ...STATE, conformity: ["conforme"] })],
    ["page manquante", JSON.stringify({ ...STATE, offset: undefined })],
    ["page négative", JSON.stringify({ ...STATE, offset: -50 })],
  ])("ignore un état invalide : %s", (_, raw) => {
    stubSessionStorage({ "lba:moderation-queue:ADMIN": raw })

    expect(readModerationQueueState("ADMIN")).toBeNull()
  })

  it("ne lève pas quand le stockage est indisponible", () => {
    vi.stubGlobal("window", {
      sessionStorage: {
        getItem: () => {
          throw new Error("SecurityError")
        },
        setItem: () => {
          throw new Error("QuotaExceededError")
        },
      },
    })

    expect(() => writeModerationQueueState("ADMIN", STATE)).not.toThrow()
    expect(readModerationQueueState("ADMIN")).toBeNull()
  })

  it("n'envoie pas à l'API les filtres vides", () => {
    expect(toModerationQueueQuery({ ...STATE, conformity: [], search: "" })).toEqual({
      conformity: undefined,
      account_status: undefined,
      account_type: undefined,
      opco: undefined,
      search: undefined,
      sort: "recruiter",
      order: "asc",
    })
  })
})
