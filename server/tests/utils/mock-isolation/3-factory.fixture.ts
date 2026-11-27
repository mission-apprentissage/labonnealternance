import { expect, it, vi } from "vitest"
import { notify } from "./mocked"

vi.mock("./mocked", () => ({ notify: vi.fn(() => "factory") }))

it("factory après un automock", () => {
  expect(notify()).toBe("factory")
})
