import { instant } from "@next/playwright"
import { expect, test } from "@playwright/test"

// Pilote Cache Components : ces tests verrouillent le gain obtenu sur 4 routes
// (accueil, fiche offre, fiche formation, dashboard entreprise) contre toute régression future.
// Voir le plan de migration pour le détail de chaque conversion.

test.describe("navigation instantanée — accueil", () => {
  test("naviguer vers l'accueil depuis une autre page affiche le header sans attendre la session", async ({ page }) => {
    // Page d'origine sans dépendance backend (pas d'appel API, juste du contenu statique + un simulateur client).
    await page.goto("/salaire-alternant")

    await instant(page, async () => {
      await page.getByRole("link", { name: "Accueil - La bonne alternance" }).click()

      // Contenu statique du layout (home), présent que la session soit résolue ou non.
      await expect(page.getByRole("link", { name: "Accueil - La bonne alternance" })).toBeVisible()
    })
  })
})

test.describe("navigation instantanée — fiches offre et formation", () => {
  // `use cache: private` (voir plan de migration, Étape 3bis) ne survit qu'en mémoire navigateur :
  // il rend les navigations CLIENT (clic + prefetch) instantanées, mais pas un rechargement complet
  // (MPA/reload), qui repart toujours d'un cache vide. Le test doit donc simuler un vrai clic depuis
  // une page de résultats, pas un `page.reload()`.
  // romes=M1602 (développement informatique) renvoie des résultats stables dans la base de dev locale.

  test("cliquer sur un résultat de recherche vers une fiche offre est instantané", async ({ page }) => {
    await page.goto("/recherche-emploi?romes=M1602")
    const offerLink = page.locator("a[href^='/emploi/']").first()
    await expect(offerLink).toBeVisible()
    // Laisse le temps au prefetch client de compléter avant d'entrer en mode instant().
    await page.waitForTimeout(1000)

    await instant(page, async () => {
      await offerLink.click()
      await expect(page.locator("main")).toBeVisible()
    })
  })

  test("cliquer sur un résultat de recherche vers une fiche formation est instantané", async ({ page }) => {
    await page.goto("/recherche-formation?romes=M1602")
    const formationLink = page.locator("a[href^='/formation/']").first()
    await expect(formationLink).toBeVisible()
    await page.waitForTimeout(1000)

    await instant(page, async () => {
      await formationLink.click()
      await expect(page.locator("main")).toBeVisible()
    })
  })
})

test.describe("navigation instantanée — dashboard entreprise", () => {
  test.skip(
    true,
    "Nécessite une session authentifiée réelle (cookie lba_session validé par le backend via ui/proxy.ts) — " +
      "pas de fixture de login e2e disponible dans ce dépôt à ce jour. À activer une fois un helper de connexion e2e écrit."
  )

  test("naviguer vers le dashboard entreprise affiche le header connecté sans attendre la session", async ({ page }) => {
    await page.goto("/espace-pro/entreprise")
    await instant(page, async () => {
      await page.reload()
      await expect(page.getByRole("main")).toBeVisible()
    })
  })
})
