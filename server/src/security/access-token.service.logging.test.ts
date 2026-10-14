import { inspect } from "node:util"
import jwt from "jsonwebtoken"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import config from "@/config"
import { verifyJwtToken } from "./access-token.service"

const loggerMock = vi.hoisted(() => ({ trace: vi.fn(), debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn(), fatal: vi.fn() }))

vi.mock("@/common/logger", async (importOriginal) => ({ ...(await importOriginal<typeof import("@/common/logger")>()), logger: loggerMock }))

const EMAIL = "jeanne@exemple.fr"
const base64url = (value: string) => Buffer.from(value).toString("base64url")

const tokenSignedByAnotherKey = jwt.sign({ identity: { type: "candidat", email: EMAIL }, email: EMAIL, sub: EMAIL, scopes: [] }, "cle-fictive-differente", {
  issuer: config.publicUrl,
})
const tokenWithUnreadablePayload = `${base64url(JSON.stringify({ alg: "HS256", typ: "JWT" }))}.${base64url(EMAIL)}.signature`

describe("verifyJwtToken : jeton refusé", () => {
  let consoleSpies: ReturnType<typeof vi.spyOn>[]

  beforeEach(() => {
    consoleSpies = (["log", "info", "warn", "error", "debug"] as const).map((method) => vi.spyOn(console, method).mockImplementation(() => undefined))
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  const expectNothingLoggedFrom = (token: string) => {
    const logged = inspect(
      [...Object.values(loggerMock), ...consoleSpies].flatMap((fn) => fn.mock.calls),
      { depth: null, breakLength: Infinity, maxStringLength: Infinity }
    )
    for (const secret of [token, token.split(".")[1], EMAIL]) {
      expect(logged).not.toContain(secret)
    }
  }

  it("signé avec une autre clé : logge la raison sans le jeton ni l'e-mail", () => {
    expect(() => verifyJwtToken(tokenSignedByAnotherKey)).toThrow("Forbidden")

    expect(loggerMock.warn).toHaveBeenCalledExactlyOnceWith({ jwtError: { name: "JsonWebTokenError", message: "invalid signature" } }, "invalid jwt token")
    expectNothingLoggedFrom(tokenSignedByAnotherKey)
  })

  it("au payload illisible : logge le type d'erreur sans son message, qui cite le payload", () => {
    expect(() => jwt.verify(tokenWithUnreadablePayload, config.auth.user.jwtSecret)).toThrow(EMAIL)

    expect(() => verifyJwtToken(tokenWithUnreadablePayload)).toThrow("Forbidden")

    expect(loggerMock.warn).toHaveBeenCalledExactlyOnceWith({ jwtError: { name: "SyntaxError", message: undefined } }, "invalid jwt token")
    expectNothingLoggedFrom(tokenWithUnreadablePayload)
  })
})
