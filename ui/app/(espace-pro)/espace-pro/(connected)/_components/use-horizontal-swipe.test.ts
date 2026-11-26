import { describe, expect, it } from "vitest"
import { getSwipeDirection } from "./use-horizontal-swipe"

const start = { x: 200, y: 300 }

describe("getSwipeDirection", () => {
  it("reconnaît un glissement horizontal vers la gauche ou la droite", () => {
    expect(getSwipeDirection(start, { x: 100, y: 310 })).toBe("left")
    expect(getSwipeDirection(start, { x: 300, y: 290 })).toBe("right")
  })

  it("ignore un glissement trop court", () => {
    expect(getSwipeDirection(start, { x: 150, y: 300 })).toBeNull()
  })

  it("ignore un geste surtout vertical, qui fait défiler la page", () => {
    expect(getSwipeDirection(start, { x: 120, y: 360 })).toBeNull()
  })
})
