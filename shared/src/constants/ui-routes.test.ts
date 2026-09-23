import { describe, expect, it } from "vitest"
// @ts-expect-error script de build en .mjs, sans types
import { buildSortedRoutePatterns } from "../../../ui/scripts/generate-ui-routes.mjs"
import { UI_ROUTE_PATTERNS } from "./ui-routes.js"

describe("UI_ROUTE_PATTERNS", () => {
  it("est à jour avec l'arborescence de ui/app", async () => {
    const actual: string[] = await buildSortedRoutePatterns()

    expect(UI_ROUTE_PATTERNS, "La liste des pages de l'UI a changé : lance `yarn generate:ui-routes` et commite shared/src/constants/ui-routes.ts").toEqual(actual)
  })
})
