import { expect, test } from "@playwright/test"
import { footerId, zoneScopedId } from "@/app/_components/zone-ids"

// RGAA 9.1 à 9.3 : un h1 avec ou sans requête, le footer posé par le layout hors du main, les
// résultats en liste avec des titres de carte en h2.
test.describe("recherche — structure de la page", () => {
  for (const url of ["/recherche?mode=emplois", "/recherche?mode=emplois&q=Boulanger"]) {
    test(`${url} : un seul h1 et le footer hors du main`, async ({ page }) => {
      await page.goto(url)
      await expect(page.locator("h1")).toHaveCount(1)
      await expect(page.locator(`#${footerId("recherche")}`)).toHaveCount(1)
      await expect(page.locator("main footer")).toHaveCount(0)
    })
  }

  test("les résultats sont des li dont le titre est un h2", async ({ page }) => {
    await page.goto("/recherche?mode=emplois")
    const results = page.locator(`#${zoneScopedId("recherche", "search-content-container")}`)
    await expect(results.locator("ul.fr-raw-list > li h2.fr-card__title").first()).toBeVisible()
  })
})
