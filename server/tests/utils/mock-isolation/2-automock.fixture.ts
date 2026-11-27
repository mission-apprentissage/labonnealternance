import { expect, it, vi } from "vitest"
import * as mocked from "./mocked"

vi.mock("./mocked")

it("automock après une factory", () => {
  expect(mocked.CONSTANT).toBe(3_500)
  expect(vi.isMockFunction(mocked.notify)).toBe(true)
})
