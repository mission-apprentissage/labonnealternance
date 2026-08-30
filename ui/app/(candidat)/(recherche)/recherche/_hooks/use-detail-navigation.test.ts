import { describe, expect, it } from "vitest"

import { computeNavigationTargets, getSearchUrlFromParam } from "./use-detail-navigation"

/**
 * `from` est réinjecté tel quel dans `router.push` par le hook : les cas REJETÉS passent en
 * premier — c'est ce garde qui empêche une redirection arbitraire via un lien forgé.
 */
describe("getSearchUrlFromParam", () => {
  describe("entrées rejetées", () => {
    it("rejette l'absence de paramètre", () => {
      expect(getSearchUrlFromParam(null)).toBeNull()
    })

    it("rejette une URL absolue externe, même si son chemin contient /recherche", () => {
      expect(getSearchUrlFromParam("https://evil.example/recherche?q=x")).toBeNull()
    })

    it("rejette une URL protocol-relative (//host)", () => {
      expect(getSearchUrlFromParam("//evil.example/recherche")).toBeNull()
    })

    it("rejette un autre chemin interne", () => {
      expect(getSearchUrlFromParam("/emploi/partner/abc/titre")).toBeNull()
    })

    it("rejette une chaîne vide", () => {
      expect(getSearchUrlFromParam("")).toBeNull()
    })

    it("rejette un chemin qui commence par /recherche sans être la page de résultats", () => {
      expect(getSearchUrlFromParam("/recherche-formation?job_name=Boulanger")).toBeNull()
      expect(getSearchUrlFromParam("/recherche-emploi")).toBeNull()
    })

    it("rejette une remontée d'arborescence, que le routeur normaliserait ailleurs", () => {
      expect(getSearchUrlFromParam("/recherche/../espace-pro/administration")).toBeNull()
    })
  })

  it("accepte l'URL de la page de résultats, avec ou sans query", () => {
    expect(getSearchUrlFromParam("/recherche")).toBe("/recherche")
    expect(getSearchUrlFromParam("/recherche?q=boulanger&mode=formations")).toBe("/recherche?q=boulanger&mode=formations")
  })
})

describe("computeNavigationTargets", () => {
  const hits = [{ url_id: "a" }, { url_id: "b" }, { url_id: "c" }]

  describe("pas de navigation possible", () => {
    it("liste vide → ni position ni flèches", () => {
      expect(computeNavigationTargets([], "a")).toEqual({ position: null, prevIndex: null, nextIndex: null })
    })

    it("liste vide sans item courant → ni position ni flèches", () => {
      expect(computeNavigationTargets([], null)).toEqual({ position: null, prevIndex: null, nextIndex: null })
    })

    it("item absent de la liste → ni position ni flèches (la fiche vient d'ailleurs)", () => {
      expect(computeNavigationTargets(hits, "inconnu")).toEqual({ position: null, prevIndex: null, nextIndex: null })
    })

    it("résultat unique → position mais pas de flèches", () => {
      expect(computeNavigationTargets([{ url_id: "a" }], "a")).toEqual({ position: 1, prevIndex: null, nextIndex: null })
    })
  })

  describe("item courant non identifié (currentUrlId null)", () => {
    // Convention héritée des liens partagés « recherche France entière » : on navigue depuis
    // le premier résultat, mais la position est null — l'item affiché n'est pas dans la liste.
    it("navigue depuis le premier résultat sans revendiquer de position", () => {
      expect(computeNavigationTargets(hits, null)).toEqual({ position: null, prevIndex: 2, nextIndex: 1 })
    })
  })

  describe("navigation circulaire", () => {
    it("au milieu : position et voisins directs", () => {
      expect(computeNavigationTargets(hits, "b")).toEqual({ position: 2, prevIndex: 0, nextIndex: 2 })
    })

    it("premier résultat : précédent boucle sur le dernier", () => {
      expect(computeNavigationTargets(hits, "a")).toEqual({ position: 1, prevIndex: 2, nextIndex: 1 })
    })

    it("dernier résultat : suivant boucle sur le premier", () => {
      expect(computeNavigationTargets(hits, "c")).toEqual({ position: 3, prevIndex: 1, nextIndex: 0 })
    })
  })

  it("tolère des hits sans url_id", () => {
    expect(computeNavigationTargets([{ url_id: null }, { url_id: "b" }, {}], "b")).toEqual({ position: 2, prevIndex: 0, nextIndex: 2 })
  })
})
