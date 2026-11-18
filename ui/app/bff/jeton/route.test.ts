import { randomBytes } from "node:crypto"
import { solveChallenge } from "altcha-lib"
import { deriveKey } from "altcha-lib/algorithms/pbkdf2"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("server-only", () => ({}))

const { issueChallenge } = await import("../_lib/search-token-issuer")
const { POST } = await import("./route")

const post = (body: unknown) => POST(new Request("https://labonnealternance.test/bff/jeton", { method: "POST", body: JSON.stringify(body) }))

beforeEach(() => vi.stubEnv("LBA_SEARCH_TOKEN_KEYS", `k1:${randomBytes(32).toString("base64")}`))
afterEach(() => vi.unstubAllEnvs())

describe("POST /bff/jeton", () => {
  it("refuse une solution invalide sans poser de cookie", async () => {
    const challenge = await issueChallenge(new Date())
    const response = await post({ challenge, solution: { counter: 0, derivedKey: "00" } })
    expect(response.status).toBe(400)
    expect(response.headers.get("set-cookie")).toBeNull()
  })

  it("renvoie le jeton dans le corps et dans un cookie partitionné, sans cache", async () => {
    const challenge = await issueChallenge(new Date())
    const solution = await solveChallenge({ challenge, deriveKey })
    const response = await post({ challenge, solution })

    expect(response.status).toBe(200)
    expect(response.headers.get("cache-control")).toBe("no-store")
    const { token } = await response.json()
    expect(token).toMatch(/^v1\.k1\.\d+\.[0-9a-f]{32}\./)
    const cookie = response.headers.get("set-cookie") ?? ""
    expect(cookie).toContain(`lba_st=${token}`)
    expect(cookie).toMatch(/HttpOnly/i)
    expect(cookie).toMatch(/Partitioned/i)
    expect(cookie).toMatch(/SameSite=none/i)
    expect(cookie).toMatch(/Path=\/bff/)
  })
})
