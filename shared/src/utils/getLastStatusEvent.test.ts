import { describe, expect, it } from "vitest"

import { getLastStatusEvent } from "./getLastStatusEvent.js"

describe("getLastStatusEvent", () => {
  it("sort events by date", () => {
    expect(
      getLastStatusEvent([
        {
          date: new Date(5),
          status: "A",
        },
        {
          date: new Date(3),
          status: "B",
        },
        {
          date: new Date(4),
          status: "C",
        },
      ])?.status
    ).toEqual("A")
  })
})
