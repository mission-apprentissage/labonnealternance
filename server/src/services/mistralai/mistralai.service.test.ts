import { setTimeout as sleep } from "node:timers/promises"

import { describe, expect, it, vi } from "vitest"

import { sentryCaptureException } from "@/common/utils/sentry-utils"
import { sendMistralMessages } from "@/services/mistralai/mistralai.service"

const { completeMock } = vi.hoisted(() => ({ completeMock: vi.fn() }))

vi.mock("@mistralai/mistralai", () => ({
  Mistral: class {
    chat = { complete: completeMock }
  },
}))
vi.mock("node:timers/promises", () => ({ setTimeout: vi.fn().mockResolvedValue(undefined) }))
vi.mock("@/common/utils/sentry-utils")
vi.mock("@/common/logger", () => ({ logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() } }))
vi.mock("@/config", () => ({ default: { mistralai: { apiKey: "test-key" } } }))

const MESSAGES = [{ role: "user", content: "ping" }] as const

const rateLimitError = (headers?: Record<string, string>) =>
  Object.assign(new Error("API error occurred: Status 429"), { statusCode: 429, ...(headers ? { headers: new Headers(headers) } : {}) })
const successResponse = { choices: [{ message: { content: '{"pong":true}' } }] }

describe("sendMistralMessages — backoff sur 429", () => {
  it("returns the content directly on success (no sleep, no capture)", async () => {
    completeMock.mockResolvedValue(successResponse)
    await expect(sendMistralMessages({ messages: [...MESSAGES] })).resolves.toBe('{"pong":true}')
    expect(completeMock).toHaveBeenCalledTimes(1)
    expect(sleep).not.toHaveBeenCalled()
    expect(sentryCaptureException).not.toHaveBeenCalled()
  })

  it("retries with backoff on 429 then succeeds, without capturing", async () => {
    completeMock.mockRejectedValueOnce(rateLimitError()).mockRejectedValueOnce(rateLimitError()).mockResolvedValueOnce(successResponse)
    await expect(sendMistralMessages({ messages: [...MESSAGES] })).resolves.toBe('{"pong":true}')
    expect(completeMock).toHaveBeenCalledTimes(3)
    expect(vi.mocked(sleep).mock.calls.map(([ms]) => ms)).toEqual([2_000, 10_000])
    expect(sentryCaptureException).not.toHaveBeenCalled()
  })

  it("honors a numeric Retry-After header over the fixed delays", async () => {
    completeMock.mockRejectedValueOnce(rateLimitError({ "retry-after": "7" })).mockResolvedValueOnce(successResponse)
    await expect(sendMistralMessages({ messages: [...MESSAGES] })).resolves.toBe('{"pong":true}')
    expect(vi.mocked(sleep).mock.calls.map(([ms]) => ms)).toEqual([7_000])
  })

  it("caps an aberrant Retry-After at 120s", async () => {
    completeMock.mockRejectedValueOnce(rateLimitError({ "retry-after": "3600" })).mockResolvedValueOnce(successResponse)
    await expect(sendMistralMessages({ messages: [...MESSAGES] })).resolves.toBe('{"pong":true}')
    expect(vi.mocked(sleep).mock.calls.map(([ms]) => ms)).toEqual([120_000])
  })

  it("falls back to the fixed delays on a non-numeric Retry-After (near-miss: HTTP date)", async () => {
    completeMock.mockRejectedValueOnce(rateLimitError({ "retry-after": "Wed, 21 Aug 2026 09:00:00 GMT" })).mockResolvedValueOnce(successResponse)
    await expect(sendMistralMessages({ messages: [...MESSAGES] })).resolves.toBe('{"pong":true}')
    expect(vi.mocked(sleep).mock.calls.map(([ms]) => ms)).toEqual([2_000])
  })

  it("gives up after exhausting retries on persistent 429: null + single capture", async () => {
    completeMock.mockRejectedValue(rateLimitError())
    await expect(sendMistralMessages({ messages: [...MESSAGES] })).resolves.toBeNull()
    expect(completeMock).toHaveBeenCalledTimes(4)
    expect(sleep).toHaveBeenCalledTimes(3)
    expect(sentryCaptureException).toHaveBeenCalledTimes(1)
  })

  it("does NOT retry a non-429 error (near-miss: statusCode 500)", async () => {
    completeMock.mockRejectedValue(Object.assign(new Error("API error occurred: Status 500"), { statusCode: 500 }))
    await expect(sendMistralMessages({ messages: [...MESSAGES] })).resolves.toBeNull()
    expect(completeMock).toHaveBeenCalledTimes(1)
    expect(sleep).not.toHaveBeenCalled()
    expect(sentryCaptureException).toHaveBeenCalledTimes(1)
  })

  it("does NOT retry a thrown non-Error carrying statusCode 429 (near-miss)", async () => {
    completeMock.mockRejectedValue({ statusCode: 429 })
    await expect(sendMistralMessages({ messages: [...MESSAGES] })).resolves.toBeNull()
    expect(completeMock).toHaveBeenCalledTimes(1)
    expect(sleep).not.toHaveBeenCalled()
  })
})
