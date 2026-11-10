import { captureException, captureMessage } from "@sentry/node"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { logger } from "@/common/logger"
import { manageApiError } from "./error-manager"
import { trackApiCall } from "./send-tracking-event"

// logger est un Proxy : vi.spyOn ne peut pas l'instrumenter
vi.mock("@/common/logger", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/common/logger")>()),
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}))

vi.mock("./send-tracking-event", () => ({ trackApiCall: vi.fn() }))

vi.mock("@sentry/node", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@sentry/node")>()),
  captureException: vi.fn(),
  captureMessage: vi.fn(),
}))

describe("manageApiError", () => {
  let consoleError: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined)
  })

  afterEach(() => {
    expect(consoleError).not.toHaveBeenCalled()
    expect(captureException).not.toHaveBeenCalled()
    expect(captureMessage).not.toHaveBeenCalled()
    vi.restoreAllMocks()
  })

  it("journalise une erreur S3 via le logger, sans l'objet erreur brut", async () => {
    const error = Object.assign(new Error("Access Denied"), { status: 403, data: { bucket: "applications", key: "cv-123.pdf" } })

    const result = await manageApiError({ error, api_path: "applicationV2", caller: "partenaire", errorTitle: "error_sending_application" })

    expect(result).toEqual({ result: "error", error: "error", message: "Access Denied", status: 403 })
    expect(trackApiCall).toHaveBeenCalledWith({ caller: "partenaire", api_path: "applicationV2", response: "Error" })
    expect(logger.error).toHaveBeenCalledTimes(1)
    expect(logger.error).toHaveBeenCalledWith(
      { errorTitle: "error_sending_application", api_path: "applicationV2", caller: "partenaire", status: 403, message: "Access Denied" },
      "error_sending_application"
    )
  })

  it("reprend le statut HTTP d'une erreur avec réponse", async () => {
    const error = Object.assign(new Error("Request failed"), { response: { status: 502, statusText: "Bad Gateway" } })

    const result = await manageApiError({ error, api_path: "applicationV2", caller: "partenaire", errorTitle: "error_sending_application" })

    expect(result).toEqual({ result: "error", error: "Bad Gateway", message: "Request failed", status: 502, statusText: "Bad Gateway" })
    expect(logger.error).toHaveBeenCalledWith(expect.objectContaining({ status: 502, message: "Request failed" }), "error_sending_application")
  })

  it("ne trace pas l'appel sans caller", async () => {
    const result = await manageApiError({ error: new Error("boom"), api_path: "applicationV2", errorTitle: "error_sending_application" })

    expect(result).toEqual({ result: "error", error: "error", message: "boom" })
    expect(trackApiCall).not.toHaveBeenCalled()
    expect(logger.error).toHaveBeenCalledWith(
      { errorTitle: "error_sending_application", api_path: "applicationV2", caller: undefined, status: undefined, message: "boom" },
      "error_sending_application"
    )
  })
})
