import nock from "nock"
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest"

import { sentryCaptureException } from "@/common/utils/sentry-utils"
import config from "@/config"
import { validationOrganisation } from "./bal.service"

vi.mock("@/common/utils/sentry-utils")

const siret = "42476141900045"
const email = "contact@entreprise.exemple.fr"

const balUrl = new URL(config.bal.baseUrl)
const mockBal = () => nock(balUrl.origin).post(`${balUrl.pathname.replace(/\/$/, "")}/organisation/validation`, { email, siret })

describe("validationOrganisation", () => {
  beforeAll(() => {
    nock.disableNetConnect()
  })

  beforeEach(() => {
    nock.cleanAll()
    vi.mocked(sentryCaptureException).mockClear()
  })

  afterAll(() => {
    nock.cleanAll()
    nock.enableNetConnect()
  })

  it.each([
    ["valide, nouveau format", { status: "valid", is_valid: true, on: "email", sources: ["akto"] }, { status: "valid", on: "email", sources: ["akto"] }],
    [
      "valide, ancien format aux sources en majuscules",
      { is_valid: true, on: "domain", sources: ["DECA", "AKTO", "DECA"] },
      { status: "valid", on: "domain", sources: ["deca", "akto"] },
    ],
    ["valide, ancien format sans source ni correspondance", { is_valid: true, sources: [] }, { status: "valid", on: null, sources: [] }],
    ["refus, ancien format", { is_valid: false, is_company_email: true }, { status: "invalid" }],
    ["refus, nouveau format", { status: "invalid", is_valid: false, is_company_email: true }, { status: "invalid" }],
    [
      "indéterminé",
      { status: "indeterminate", is_valid: false, is_company_email: true, unavailable_sources: ["akto", "opco_ep"] },
      { status: "indeterminate", unavailableSources: ["akto", "opco_ep"] },
    ],
  ])("lit une réponse %s", async (_label, body, expected) => {
    mockBal().reply(200, body)

    expect(await validationOrganisation(siret, email)).toEqual(expected)
    expect(sentryCaptureException).not.toHaveBeenCalled()
  })

  it.each([
    ["un 500", (scope: nock.Interceptor) => scope.reply(500), "http_5xx", 500],
    ["un 401", (scope: nock.Interceptor) => scope.reply(401), "http_4xx", 401],
    ["une coupure réseau", (scope: nock.Interceptor) => scope.replyWithError(Object.assign(new Error("read ECONNRESET"), { code: "ECONNRESET" })), "network", undefined],
    ["un timeout", (scope: nock.Interceptor) => scope.replyWithError(Object.assign(new Error("timeout of 6000ms exceeded"), { code: "ECONNABORTED" })), "timeout", undefined],
    ["une réponse hors contrat", (scope: nock.Interceptor) => scope.reply(200, { valide: true }), "unexpected", undefined],
  ])("rend BAL indisponible sur %s, sans donnée personnelle envoyée à Sentry", async (_label, reply, outcome, httpStatus) => {
    reply(mockBal())

    expect(await validationOrganisation(siret, email)).toEqual({ status: "unavailable" })

    expect(sentryCaptureException).toHaveBeenCalledTimes(1)
    const [error, options] = vi.mocked(sentryCaptureException).mock.calls[0] ?? []
    expect(error).toBeInstanceOf(Error)
    expect(options).toMatchObject({ tags: { module: "validation", provider: "bal", outcome }, fingerprint: ["validation", "bal", outcome] })
    expect((options as { contexts?: { validation?: { http_status?: number } } } | undefined)?.contexts?.validation?.http_status).toBe(httpStatus)
    const sent = JSON.stringify({ message: (error as Error).message, ...Object.fromEntries(Object.entries(error as object)), options })
    expect(sent).not.toContain(email)
    expect(sent).not.toContain(siret)
  })
})
