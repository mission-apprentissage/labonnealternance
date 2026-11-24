import { expect, test } from "@playwright/test"

// Une rafale de frappes sans délai ne doit ni lever l'erreur React #185 (Maximum update depth
// exceeded) ni perdre de frappe (#5937, cf. POPPER_SLOT_PROPS dans SearchBar).
const SAISIE = "abcdefghij".repeat(10)

for (const champ of ["Que recherchez-vous ?", "Lieu"]) {
  test(`recherche — saisie rapide sans erreur dans « ${champ} »`, async ({ page }) => {
    const pageErrors: Error[] = []
    page.on("pageerror", (error) => pageErrors.push(error))

    await page.goto("/recherche?q=Coiffure")
    const input = page.getByRole("combobox", { name: champ }).first()
    await input.click()
    await page.keyboard.press("ControlOrMeta+A")
    await page.keyboard.type(SAISIE, { delay: 0 })

    await expect(input).toHaveValue(SAISIE)
    expect(pageErrors).toEqual([])
  })
}
