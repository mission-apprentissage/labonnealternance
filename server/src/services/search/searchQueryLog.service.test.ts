import { describe, expect, it } from "vitest"

import { containsPii, normalizeQuery } from "./searchQueryLog.service"

describe("searchQueryLog.service", () => {
  describe("containsPii", () => {
    it.each([
      ["jean.dupont@gmail.com", true],
      ["contact test@entreprise.fr merci", true],
      ["0612345678", true],
      ["06 12 34 56 78", true],
      ["+33 6 12 34 56 78", true],
      ["12345678901234", true], // SIRET
      ["1 85 05 78 006 048", true], // NIR avec séparateurs
    ])("détecte les PII : %s", (q, expected) => {
      expect(containsPii(q)).toBe(expected)
    })

    it.each([
      ["plombier", false],
      ["BTS MCO", false],
      ["développeur web", false],
      ["bac pro commerce", false],
      ["vendeur 75011", false], // 5 chiffres (code postal) : autorisé
      ["CAP pâtisserie niveau 3", false],
    ])("laisse passer les recherches légitimes : %s", (q, expected) => {
      expect(containsPii(q)).toBe(expected)
    })
  })

  describe("normalizeQuery", () => {
    it("normalise accents et casse", () => {
      expect(normalizeQuery("Développeur Web")).toBe("developpeur web")
    })

    it("retire les stopwords grammaticaux et domaine", () => {
      expect(normalizeQuery("chargé de déploiement")).toBe("charge deploiement")
      expect(normalizeQuery("Apprenti cadreur / Monteur H/F")).toBe("cadreur monteur")
    })

    it("déduplique les doublets masculin/féminin des intitulés ROME", () => {
      expect(normalizeQuery("Cuisinier / Cuisinière à domicile")).toBe("cuisinier domicile")
      expect(normalizeQuery("Moniteur éducateur / Monitrice éducatrice")).toBe("moniteur educateur")
    })

    it("produit la même clé pour des variantes équivalentes (agrégation)", () => {
      expect(normalizeQuery("PLOMBIER")).toBe(normalizeQuery("plombier"))
      expect(normalizeQuery("pâtissier")).toBe(normalizeQuery("patissier"))
    })

    it("renvoie une chaîne vide si la requête ne contient que des stopwords", () => {
      expect(normalizeQuery("de la en")).toBe("")
    })
  })
})
