import { beforeEach, describe, expect, it, vi } from "vitest"

import { JOB_STATUS_ENGLISH } from "../job.model"
import { IJobsPartnersWritableApiInput, ZJobsPartnersWritableApi } from "../jobsPartners.model"

describe("ZJobsPartnersWritableApi", () => {
  const now = new Date("2024-06-18T14:30:00.000Z")
  const oneMinuteAgo = new Date("2024-06-18T14:29:00.000Z")
  const inOneMinute = new Date("2024-06-18T14:31:00.000Z")
  const oneHourAgo = new Date("2024-06-18T13:30:00.000Z")
  const inOneHour = new Date("2024-06-18T15:30:00.000Z")

  const data: IJobsPartnersWritableApiInput = {
    offer_title: "Apprentis en développement web",
    offer_rome_codes: ["M1602"],
    offer_description: "Envie de devenir développeur web ? Rejoignez-nous !",

    apply_email: "mail@mail.com",

    workplace_address_label: "address",
    workplace_siret: "39837261500128",
  }

  beforeEach(async () => {
    // Do not mock nextTick
    vi.useFakeTimers({ toFake: ["Date"] })
    vi.setSystemTime(now)

    return () => {
      vi.useRealTimers()
    }
  })

  describe("contract_start", () => {
    it("should be optional", () => {
      const result = ZJobsPartnersWritableApi.safeParse({
        ...data,
      })

      expect(result.success).toBe(true)
      expect(result.data?.contract_start).toBe(null)
    })
    it("should be required ISO 8601 date string", () => {
      const result = ZJobsPartnersWritableApi.safeParse({
        ...data,
        contract_start: "2024-09-01",
      })

      expect(result.success).toBe(false)
      expect(result.error?.format()).toEqual({
        _errors: [],
        contract_start: {
          _errors: ["Expected ISO 8601 date string"],
        },
      })
    })

    it("should allow date in past", () => {
      const result = ZJobsPartnersWritableApi.safeParse({
        ...data,
        contract_start: oneHourAgo.toJSON(),
      })

      expect(result.success).toBe(true)
      expect(result.data?.contract_start).toEqual(oneHourAgo)
    })

    it("should allow date in future", () => {
      const result = ZJobsPartnersWritableApi.safeParse({
        ...data,
        contract_start: inOneHour.toJSON(),
      })

      expect(result.success).toBe(true)
      expect(result.data?.contract_start).toEqual(inOneHour)
    })
  })

  describe("offer_status", () => {
    it("should be optional", () => {
      const result = ZJobsPartnersWritableApi.safeParse({
        ...data,
      })

      expect(result.success).toBe(true)
      expect(result.data?.offer_status).toBe(JOB_STATUS_ENGLISH.ACTIVE)
    })
  })

  describe("offer_creation", () => {
    // Fallback is handled in jobOpportinityService
    it("should allow null", () => {
      const result = ZJobsPartnersWritableApi.safeParse({
        ...data,
        offer_creation: null,
      })

      expect(result.success).toBe(true)
      expect(result.data?.offer_creation).toEqual(null)
    })

    it("should be required ISO 8601 date string", () => {
      const result = ZJobsPartnersWritableApi.safeParse({
        ...data,
        offer_creation: "2024-09-01",
      })

      expect(result.success).toBe(false)
      expect(result.error?.format()).toEqual({
        _errors: [],
        offer_creation: {
          _errors: ["Expected ISO 8601 date string"],
        },
      })
    })

    it("should allow date in past", () => {
      const result = ZJobsPartnersWritableApi.safeParse({
        ...data,
        offer_creation: oneHourAgo.toJSON(),
      })

      expect(result.success).toBe(true)
      expect(result.data?.offer_creation).toEqual(oneHourAgo)
    })

    it("should not allow date in future", () => {
      const result = ZJobsPartnersWritableApi.safeParse({
        ...data,
        offer_creation: inOneHour.toJSON(),
      })

      expect(result.success).toBe(false)
      expect(result.error?.format()).toEqual({
        _errors: [],
        offer_creation: {
          _errors: ["Creation date cannot be in the future"],
        },
      })
    })

    it("should tolerate time clock sync", () => {
      const result = ZJobsPartnersWritableApi.safeParse({
        ...data,
        offer_creation: inOneMinute.toJSON(),
      })

      expect(result.success).toBe(true)
      expect(result.data?.offer_creation).toEqual(inOneMinute)
    })
  })

  describe("offer_expiration", () => {
    // Fallback is handled in jobOpportinityService
    it("should allow null", () => {
      const result = ZJobsPartnersWritableApi.safeParse({
        ...data,
        offer_expiration: null,
      })

      expect(result.success).toBe(true)
      expect(result.data?.offer_expiration).toEqual(null)
    })

    it("should be required ISO 8601 date string", () => {
      const result = ZJobsPartnersWritableApi.safeParse({
        ...data,
        offer_expiration: "2024-09-01",
      })

      expect(result.success).toBe(false)
      expect(result.error?.format()).toEqual({
        _errors: [],
        offer_expiration: {
          _errors: ["Expected ISO 8601 date string"],
        },
      })
    })

    it("should not allow date in future", () => {
      const result = ZJobsPartnersWritableApi.safeParse({
        ...data,
        offer_expiration: inOneHour.toJSON(),
      })

      expect(result.success).toBe(true)
      expect(result.data?.offer_expiration).toEqual(inOneHour)
    })

    it("should not allow date in past", () => {
      const result = ZJobsPartnersWritableApi.safeParse({
        ...data,
        offer_expiration: oneHourAgo.toJSON(),
      })

      expect(result.success).toBe(false)
      expect(result.error?.format()).toEqual({
        _errors: [],
        offer_expiration: {
          _errors: ["Expiration date cannot be in the past"],
        },
      })
    })

    it("should tolerate time clock sync", () => {
      const result = ZJobsPartnersWritableApi.safeParse({
        ...data,
        offer_expiration: oneMinuteAgo.toJSON(),
      })

      expect(result.success).toBe(true)
      expect(result.data?.offer_expiration).toEqual(oneMinuteAgo)
    })
  })
})
