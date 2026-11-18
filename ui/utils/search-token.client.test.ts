import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const { solveChallenge } = vi.hoisted(() => ({ solveChallenge: vi.fn() }))
vi.mock("altcha-lib", () => ({ solveChallenge }))
vi.mock("altcha-lib/algorithms/web/pbkdf2", () => ({ deriveKey: vi.fn() }))

const json = (body: unknown, status = 200) => Response.json(body, { status })

describe("renewSearchToken", () => {
  const fetchMock = vi.fn<typeof fetch>()
  let client: typeof import("./search-token.client")
  let store: typeof import("./search-token.store")

  beforeEach(async () => {
    // pending et renewedAt sont des états de module : module neuf à chaque test.
    vi.resetModules()
    solveChallenge.mockReset().mockResolvedValue({ counter: 1, derivedKey: "aa" })
    fetchMock.mockReset().mockImplementation(async (_url, init) => (init?.method === "POST" ? json({ token: "T1" }) : json({ parameters: {}, signature: "s" })))
    vi.stubGlobal("fetch", fetchMock)
    client = await import("./search-token.client")
    store = await import("./search-token.store")
  })
  afterEach(() => vi.unstubAllGlobals())

  it("partage une seule preuve de travail entre trois refus simultanés", async () => {
    const startedAt = performance.now()
    await Promise.all([client.renewSearchToken(startedAt), client.renewSearchToken(startedAt), client.renewSearchToken(startedAt)])

    expect(solveChallenge).toHaveBeenCalledTimes(1)
    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(store.getSearchToken()).toBe("T1")
  })

  it("ne refait pas de preuve pour un refus antérieur au dernier renouvellement, en refait une pour un refus postérieur", async () => {
    const before = performance.now()
    await client.renewSearchToken(before)
    await client.renewSearchToken(before)
    expect(solveChallenge).toHaveBeenCalledTimes(1)

    await new Promise((resolve) => setTimeout(resolve, 5))
    await client.renewSearchToken(performance.now())
    expect(solveChallenge).toHaveBeenCalledTimes(2)
  })

  it("rejette quand le défi est refusé (429), puis retente au refus suivant", async () => {
    fetchMock.mockImplementationOnce(async () => json({}, 429))
    await expect(client.renewSearchToken(performance.now())).rejects.toThrow("défi indisponible (429)")
    expect(solveChallenge).not.toHaveBeenCalled()

    await client.renewSearchToken(performance.now())
    expect(solveChallenge).toHaveBeenCalledTimes(1)
    expect(store.getSearchToken()).toBe("T1")
  })

  it("rejette quand la preuve n'est pas résolue dans le délai", async () => {
    solveChallenge.mockResolvedValue(null)
    await expect(client.renewSearchToken(performance.now())).rejects.toThrow("preuve de travail non résolue dans le délai")
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })
})
