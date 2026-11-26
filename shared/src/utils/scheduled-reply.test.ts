import { describe, expect, it } from "vitest"
import { getScheduledReplySendDate } from "./scheduled-reply.js"

describe("getScheduledReplySendDate", () => {
  it("retient le premier passage du cron après le délai de 30 minutes", () => {
    expect(getScheduledReplySendDate("2026-11-25T17:41:20.000Z")).toEqual(new Date("2026-11-25T18:20:00.000Z"))
  })

  it("garde un délai qui tombe pile sur un passage du cron", () => {
    expect(getScheduledReplySendDate(new Date("2026-11-25T17:40:00.000Z"))).toEqual(new Date("2026-11-25T18:10:00.000Z"))
  })
})
