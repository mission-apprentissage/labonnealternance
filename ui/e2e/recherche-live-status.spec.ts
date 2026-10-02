import { expect, test } from "@playwright/test"

// RGAA 7.5 : le nombre de résultats est restitué par une seule zone role="status", commune aux
// arbres desktop et mobile de la page (cf. SearchPageClient), et vidée pendant chaque requête.
const COUNTER = /^(\d+ résultats?|Aucun résultat)$/

test.describe("recherche — compteur de résultats annoncé", () => {
  test("une seule zone status porte le nombre de résultats sur desktop", async ({ page }) => {
    await page.goto("/recherche?mode=emplois")
    await expect(page.getByRole("status").filter({ hasText: COUNTER })).toHaveCount(1)
  })

  test("une seule zone status porte le nombre de résultats sur mobile", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await page.goto("/recherche?mode=emplois")
    await expect(page.getByRole("status").filter({ hasText: COUNTER })).toHaveCount(1)
  })
})
