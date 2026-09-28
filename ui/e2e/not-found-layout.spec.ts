import { expect, test } from "@playwright/test"
import { footerId, mainId } from "@/app/_components/zone-ids"

// Issue #5547 : notFound() rendait le layout de zone (en-tête, main, pied de page) en double,
// imbriqué dans celui du root not-found.tsx. Verrouille l'unicité du main et du pied de page sur
// une 404 éditoriale et une 404 d'offre (le header du DSFR porte deux fois son id par construction,
// cf. PublicHeader, et n'est donc pas un indicateur fiable ici).

test.describe("404 déclenchées par notFound() — ossature unique", () => {
  test("une 404 éditoriale (métier inexistant) n'affiche qu'une seule ossature", async ({ page }) => {
    await page.goto("/metiers/slug-inexistant-e2e")
    await expect(page.getByRole("heading", { name: "404" })).toBeVisible()
    // La duplication corrigée par cette issue apparaît après coup, une fois l'hydratation du
    // client terminée (reconciliation React du HTTPAccessFallbackBoundary) : le réseau retombe
    // idle une fois ce remaniement joué.
    await page.waitForLoadState("networkidle")

    await expect(page.locator(`#${mainId("editorial")}`)).toHaveCount(1)
    await expect(page.locator(`#${footerId("editorial")}`)).toHaveCount(1)
  })

  test("une 404 d'offre n'affiche qu'une seule ossature", async ({ page }) => {
    await page.goto("/emploi/matcha/000000000000000000000000/offre-inexistante-e2e")
    await expect(page.getByRole("heading", { name: "404" })).toBeVisible()
    await page.waitForLoadState("networkidle")

    await expect(page.locator(`#${mainId("detail-emploi")}`)).toHaveCount(1)
    await expect(page.locator(`#${footerId("detail-emploi")}`)).toHaveCount(1)
  })
})
