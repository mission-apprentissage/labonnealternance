import { expect, it, vi } from "vitest"
import * as mocked from "./mocked"

vi.mock("./mocked", { spy: true })

it("autospy après une factory", () => {
  expect(mocked.CONSTANT).toBe(3_500)
  expect(mocked.notify()).toBe("réel")
  expect(vi.isMockFunction(mocked.notify)).toBe(true)
})
