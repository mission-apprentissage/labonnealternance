import { MongoServerError } from "mongodb"
import { describe, expect, it, vi } from "vitest"

import { sentryCaptureException } from "@/common/utils/sentry-utils"
import { isTransientSearchCancellation, retryOnTransientSearchCancellation } from "@/services/search/search-transient-retry"

vi.mock("@/common/utils/sentry-utils")

const callbackCanceledError = () => new MongoServerError({ ok: 0, errmsg: "Callback canceled", code: 90, codeName: "CallbackCanceled" })

describe("isTransientSearchCancellation", () => {
  it("matches a MongoServerError CallbackCanceled (code 90)", () => {
    expect(isTransientSearchCancellation(callbackCanceledError())).toBe(true)
  })

  it("does NOT match another MongoServerError (near-miss)", () => {
    const other = new MongoServerError({ ok: 0, errmsg: "Remote error from mongot", code: 6, codeName: "HostUnreachable" })
    expect(isTransientSearchCancellation(other)).toBe(false)
  })

  it("does NOT match a plain Error mentioning cancellation (near-miss)", () => {
    expect(isTransientSearchCancellation(new Error("Callback canceled"))).toBe(false)
  })
})

describe("retryOnTransientSearchCancellation", () => {
  it("returns the result without retry nor capture on success", async () => {
    const run = vi.fn().mockResolvedValue("ok")
    await expect(retryOnTransientSearchCancellation(run, { q: "boulanger" })).resolves.toBe("ok")
    expect(run).toHaveBeenCalledTimes(1)
    expect(sentryCaptureException).not.toHaveBeenCalled()
  })

  it("retries once on CallbackCanceled and captures a warning", async () => {
    const run = vi.fn().mockRejectedValueOnce(callbackCanceledError()).mockResolvedValueOnce("ok")
    await expect(retryOnTransientSearchCancellation(run, { q: "boulanger" })).resolves.toBe("ok")
    expect(run).toHaveBeenCalledTimes(2)
    expect(sentryCaptureException).toHaveBeenCalledTimes(1)
    expect(vi.mocked(sentryCaptureException).mock.calls[0][1]).toMatchObject({ level: "warning", extra: { q: "boulanger", fallback: "search-transient-retry" } })
  })

  it("propagates the second error when the retry fails too", async () => {
    const run = vi.fn().mockRejectedValue(callbackCanceledError())
    await expect(retryOnTransientSearchCancellation(run, { q: "boulanger" })).rejects.toThrow("Callback canceled")
    expect(run).toHaveBeenCalledTimes(2)
  })

  it("does NOT retry a non-transient error (thrown as-is, no capture)", async () => {
    const run = vi.fn().mockRejectedValue(new Error("maxClauseCount is set to 1024"))
    await expect(retryOnTransientSearchCancellation(run, { q: "boulanger" })).rejects.toThrow("maxClauseCount")
    expect(run).toHaveBeenCalledTimes(1)
    expect(sentryCaptureException).not.toHaveBeenCalled()
  })
})
