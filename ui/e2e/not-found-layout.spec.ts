import { expect, test } from "@playwright/test"
import { footerId, mainId } from "@/app/_components/zone-ids"

// Un notFound() levé sous un layout sans <Suspense> interne laisse une copie de l'ossature dans le DOM
// (#5547, cf. app/(editorial)/layout.tsx).

test.describe("404 déclenchées par notFound() — ossature unique", () => {
  test("une 404 éditoriale (métier inexistant) n'affiche qu'une seule ossature", async ({ page }) => {
    await page.goto("/metiers/slug-inexistant-e2e")
    await expect(page.getByRole("heading", { name: "404" })).toBeVisible()
    // Le rendu client de la 404 intervient après l'hydratation.
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

  test("une 404 d'opt-out RDVA (établissement inconnu) n'affiche qu'une seule ossature", async ({ page }) => {
    await page.goto("/optout/unsubscribe/000000000000000000000000?token=jeton-invalide-e2e")
    await expect(page.getByRole("heading", { name: "404" })).toBeVisible()
    await page.waitForLoadState("networkidle")

    await expect(page.locator(`#${mainId("rdva")}`)).toHaveCount(1)
    await expect(page.locator(`#${footerId("rdva")}`)).toHaveCount(1)
  })
})
