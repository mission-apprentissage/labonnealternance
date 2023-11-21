import dayjs from "dayjs"
import { describe, expect, it } from "vitest"

import { ZJobStartDateCreate } from "."

describe("job.model", () => {
  describe("job_start_date field", () => {
    describe("during the day", () => {
      const zJobStartDate = ZJobStartDateCreate(dayjs("2023-11-21T15:22:21.515+0100").toDate())
      it("should pass", () => {
        expect(zJobStartDate.safeParse("2023-11-21").success).toBe(true)
        expect(zJobStartDate.safeParse("2023-11-22").success).toBe(true)
      })
      it("should fail", () => {
        expect(zJobStartDate.safeParse("2023-11-19").success).toBe(false)
        expect(zJobStartDate.safeParse("2023-11-20").success).toBe(false)
      })
    })
    describe("at midnight in Paris", () => {
      const zJobStartDate = ZJobStartDateCreate(dayjs("2023-11-21T00:00:00.000+0100").toDate())
      it("should pass", () => {
        expect(zJobStartDate.safeParse("2023-11-21").success).toBe(true)
        expect(zJobStartDate.safeParse("2023-11-22").success).toBe(true)
      })
      it("should fail", () => {
        expect(zJobStartDate.safeParse("2023-11-19").success).toBe(false)
        expect(zJobStartDate.safeParse("2023-11-20").success).toBe(false)
      })
    })
    describe("at 1am Paris", () => {
      const zJobStartDate = ZJobStartDateCreate(dayjs("2023-11-21T01:00:00.000+0100").toDate())
      it("should pass", () => {
        expect(zJobStartDate.safeParse("2023-11-21").success).toBe(true)
        expect(zJobStartDate.safeParse("2023-11-22").success).toBe(true)
      })
      it("should fail", () => {
        expect(zJobStartDate.safeParse("2023-11-19").success).toBe(false)
        expect(zJobStartDate.safeParse("2023-11-20").success).toBe(false)
      })
    })
    describe("at 23pm Paris", () => {
      const zJobStartDate = ZJobStartDateCreate(dayjs("2023-11-21T23:00:00.000+0100").toDate())
      it("should pass", () => {
        expect(zJobStartDate.safeParse("2023-11-21").success).toBe(true)
        expect(zJobStartDate.safeParse("2023-11-22").success).toBe(true)
      })
      it("should fail", () => {
        expect(zJobStartDate.safeParse("2023-11-19").success).toBe(false)
        expect(zJobStartDate.safeParse("2023-11-20").success).toBe(false)
      })
    })
  })
})
