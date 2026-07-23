import { describe, expect, it } from "vitest"

import { getRobotsMetadata } from "./robots.utils"

describe("getRobotsMetadata", () => {
  it("autorise l'indexation quand disableRobots est absent (production)", () => {
    expect(getRobotsMetadata(undefined)).toEqual({ index: true, follow: true })
    expect(getRobotsMetadata(false)).toEqual({ index: true, follow: true })
  })

  it("bloque l'indexation quand disableRobots est vrai (recette/preview/local/pentest)", () => {
    expect(getRobotsMetadata(true)).toEqual({ index: false, follow: false })
  })
})
