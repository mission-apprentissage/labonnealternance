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
  // L'assertion vise le titre de la fiche, à l'intérieur du landmark, et non le landmark lui-même :
  // celui-ci est rendu par le layout de segment (ui/app/(candidat)/emploi/layout.tsx) dès l'entrée
  // dans la route, avant même que la donnée arrive — l'attendre ne prouverait rien sur la navigation.
  //
  // `use cache: private` (voir plan de migration, Étape 3bis) ne survit qu'en mémoire navigateur :
  // il rend les navigations CLIENT (clic + prefetch) instantanées, mais pas un rechargement complet
  // (MPA/reload), qui repart toujours d'un cache vide. Le test doit donc simuler un vrai clic depuis
  // une page de résultats, pas un `page.reload()`.
  // Pas de filtre texte : le premier résultat du tri par défaut suffit (pas d'assertion sur son contenu).

  test("cliquer sur un résultat de recherche vers une fiche offre est instantané", async ({ page }) => {
    await page.goto("/recherche?mode=emplois")
    const offerLink = page.locator("a[href^='/emploi/']").first()
    await expect(offerLink).toBeVisible()
    // Attente déterministe (plutôt qu'un délai fixe) : le survol déclenche/confirme le prefetch
    // du lien, puis on attend la fin des requêtes réseau associées avant d'entrer en mode instant().
    await offerLink.hover()
    await page.waitForLoadState("networkidle")

    await instant(page, async () => {
      await offerLink.click()
      await expect(page.locator("main").getByRole("heading", { level: 3 }).first()).toBeVisible()
    })
  })

  test("cliquer sur un résultat de recherche vers une fiche formation est instantané", async ({ page }) => {
    await page.goto("/recherche?mode=formations")
    const formationLink = page.locator("a[href^='/formation/']").first()
    await expect(formationLink).toBeVisible()
    await formationLink.hover()
    await page.waitForLoadState("networkidle")

    await instant(page, async () => {
      await formationLink.click()
      await expect(page.locator("main").getByRole("heading", { level: 3 }).first()).toBeVisible()
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

// Le cache de navigation garde la route précédente montée dans un `<Activity mode="hidden">` :
// deux ossatures coexistent dans le document dès qu'une navigation change de layout. Quand elles
// partagent leurs id, le JS du DSFR câble le bouton du menu burger visible sur la modale de la
// copie masquée et le menu ne s'ouvre plus (issue #5439). Voir ui/app/_components/zone-ids.ts.
test.describe("identifiants de zone — cache de navigation", () => {
  test("le menu burger s'ouvre encore après une navigation qui change de layout", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await page.goto("/salaire-alternant")

    // Ouvrir puis fermer depuis la zone de départ : c'est la séquence qui exposait le défaut.
    await page.getByRole("button", { name: "Menu" }).click()
    await expect(page.locator("#header-menu-modal-header-links-landing")).toHaveClass(/fr-modal--opened/)
    await page.locator("#header-links-landing-mobile-overlay-button-close").click()

    // Traversée de layout : (landing-pages) → (home).
    await page.getByRole("link", { name: "Accueil - La bonne alternance" }).click()
    await expect(page).toHaveURL("/")

    await page.getByRole("button", { name: "Menu" }).click()
    await expect(page.locator("#header-menu-modal-header-links-home")).toHaveClass(/fr-modal--opened/)
    await expect(page.locator("#header-menu-modal-header-links-home").getByRole("link", { name: "Connexion" })).toBeVisible()
  })
})
