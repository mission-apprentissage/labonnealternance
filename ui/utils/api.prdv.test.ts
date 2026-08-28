import { beforeEach, describe, expect, it, vi } from "vitest"

const captureException = vi.fn()
const apiGet = vi.fn()

vi.mock("@sentry/nextjs", () => ({ captureException }))

vi.mock("./api.utils", async (importOriginal) => {
  const mod = await importOriginal<typeof import("./api.utils")>()
  return { ...mod, apiGet }
})

const { getPrdvContext } = await import("./api")
const { ApiError } = await import("./api.utils")

const buildApiError = (statusCode: number) =>
  new ApiError({
    path: "/_private/appointment",
    params: {},
    querystring: {},
    requestHeaders: {},
    statusCode,
    message: "boom",
    name: "Api Error",
    responseHeaders: {},
    errorData: null,
  })

// Avec `cacheComponents`, un fetch non mis en cache pendant le prerender renvoie une promesse
// suspendue qui rejette quand le prerender s'interrompt. Next marque cette erreur du digest
// HANGING_PROMISE_REJECTION et attend qu'on la relaie ; capturée comme une erreur applicative,
// elle produisait un event Sentry par requête sur /rdva (LBA-UI-5CVZZZZZZG501).
const hangingPromiseRejection = () => Object.assign(new Error("During prerendering, fetch() rejects when the prerender is complete."), { digest: "HANGING_PROMISE_REJECTION" })

describe("getPrdvContext", () => {
  beforeEach(() => {
    captureException.mockClear()
    apiGet.mockReset()
  })

  it("relaie le rejet de prerender sans le remonter à Sentry", async () => {
    apiGet.mockRejectedValue(hangingPromiseRejection())

    const error = await getPrdvContext("cle", "lba").then(
      () => null,
      (e) => e
    )

    expect(error).toMatchObject({ digest: "HANGING_PROMISE_REJECTION" })
    expect(captureException).not.toHaveBeenCalled()
  })

  it("relaie aussi les erreurs de contrôle de Next (redirect, notFound)", async () => {
    apiGet.mockRejectedValue(Object.assign(new Error("NEXT_HTTP_ERROR_FALLBACK;404"), { digest: "NEXT_HTTP_ERROR_FALLBACK;404" }))

    await expect(getPrdvContext("cle", "lba")).rejects.toThrow()
    expect(captureException).not.toHaveBeenCalled()
  })

  it("remonte toujours une vraie erreur serveur à Sentry", async () => {
    apiGet.mockRejectedValue(buildApiError(500))

    await expect(getPrdvContext("cle", "lba")).rejects.toThrow()
    expect(captureException).toHaveBeenCalledTimes(1)
  })

  it("traite un 4xx comme une absence de contexte, sans event Sentry", async () => {
    apiGet.mockRejectedValue(buildApiError(404))

    await expect(getPrdvContext("cle", "lba")).resolves.toBeNull()
    expect(captureException).not.toHaveBeenCalled()
  })

  it("renvoie les données quand l'appel réussit", async () => {
    apiGet.mockResolvedValue({ cle_ministere_educatif: "cle" })

    await expect(getPrdvContext("cle", "lba")).resolves.toMatchObject({ cle_ministere_educatif: "cle" })
    expect(captureException).not.toHaveBeenCalled()
  })
})
