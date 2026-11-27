import { expect, it, vi } from "vitest"
import * as mocked from "./mocked"

it("sans vi.mock : le module réel", () => {
  expect(mocked.notify()).toBe("réel")
  expect(vi.isMockFunction(mocked.notify)).toBe(false)
})
