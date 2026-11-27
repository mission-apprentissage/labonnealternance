import { expect, it, vi } from "vitest"
import { notify } from "./mocked"

vi.mock("./mocked", () => ({ notify: vi.fn() }))

it("factory", () => {
  expect(vi.isMockFunction(notify)).toBe(true)
})
