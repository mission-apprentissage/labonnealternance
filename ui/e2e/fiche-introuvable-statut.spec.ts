import { expect, test } from "@playwright/test"

// Les fiches streament : seul le proxy renvoie un vrai 404 (cf. isFicheIntrouvable). Cas conclus sans appel
// d'API, pour ne pas dépendre de la base locale.
test.describe("fiche introuvable — statut HTTP 404", () => {
  for (const path of [
    "/emploi/type-inconnu-e2e/000000000000000000000000/x",
    "/emploi/offres_emploi_lba/pas-un-objectid-e2e/x",
    "/emploi/offres_emploi_partenaires/pas-un-objectid-e2e/x",
  ]) {
    test(path, async ({ request }) => {
      const response = await request.get(path)

      expect(response.status()).toBe(404)
      expect(await response.text()).toContain("Page non trouvée")
    })
  }
})
