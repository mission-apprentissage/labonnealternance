import { describe, expect, it } from "vitest"

import { applyLegacySearchParams, hasExploitableSearch, parseSearchUrlFromParam, resolveSearchParamsFromUrl } from "./search-url-compat.js"

const translate = (qs: string) => Object.fromEntries(applyLegacySearchParams(new URLSearchParams(qs)).entries())

describe("applyLegacySearchParams", () => {
  describe("cas qui NE doivent RIEN traduire", () => {
    it("laisse une URL déjà au format du nouveau moteur intacte", () => {
      expect(translate("q=Boulanger&lieu_label=Paris&latitude=48.85&longitude=2.35&mode=formations")).toEqual({
        q: "Boulanger",
        lieu_label: "Paris",
        latitude: "48.85",
        longitude: "2.35",
        mode: "formations",
      })
    })

    it("ne pose pas de q pour un job_name vide ou fait d'espaces", () => {
      expect(translate("romes=K2101&job_name=+++")).toEqual({})
    })

    it("ne pose pas de géo à partir d'une seule coordonnée", () => {
      expect(translate("lat=48.85")).toEqual({})
      expect(translate("lon=2.35")).toEqual({})
    })

    it("ne pose pas de géo pour des coordonnées non numériques", () => {
      expect(translate("lat=abc&lon=def")).toEqual({})
    })

    it("ne traduit pas romes seul : sans job_name il n'y a pas de libellé métier", () => {
      expect(translate("romes=K2101,D1102")).toEqual({})
    })

    it("ignore diploma=INDIFFERENT et les valeurs hors référentiel", () => {
      expect(translate("diploma=INDIFFERENT")).toEqual({})
      expect(translate("diploma=42+(inconnu)")).toEqual({})
    })

    it("n'infère pas de mode quand aucun display* n'est exprimé", () => {
      expect(translate("job_name=Boulanger")).toEqual({ q: "Boulanger" })
    })

    it("laisse primer les paramètres du nouveau moteur sur leurs équivalents legacy", () => {
      // URL mixte réelle : /recherche-formation?job_name=… redirigé par next.config.mjs, qui
      // pose mode=formations tout en conservant la query legacy d'origine.
      expect(translate("mode=formations&q=Pâtissier&job_name=Boulanger&displayFormations=true&latitude=1&longitude=2&lat=48.85&lon=2.35")).toEqual({
        mode: "formations",
        q: "Pâtissier",
        latitude: "1",
        longitude: "2",
      })
    })
  })

  describe("traduction", () => {
    it("traduit une URL legacy complète", () => {
      expect(
        translate("job_name=Boulanger&romes=D1102&lat=48.85&lon=2.35&address=Paris+75001&radius=30&diploma=3+(CAP...)&displayFormations=true&displayEntreprises=false")
      ).toEqual({
        q: "Boulanger",
        latitude: "48.85",
        longitude: "2.35",
        lieu_label: "Paris 75001",
        radius: "30",
        level: "CAP, BEP (Infrabac)",
        mode: "emplois_formation",
        is_algo_company: "false",
      })
    })

    it("traduit scrollToRecruteursLba en filtre « entreprises à contacter »", () => {
      expect(translate("job_name=Boulanger&scrollToRecruteursLba=true")).toEqual({ q: "Boulanger", is_algo_company: "true" })
    })

    it("conserve les utm et le caller, retire les paramètres legacy sans équivalent", () => {
      expect(translate("job_name=Boulanger&romes=D1102&opco=akto&rncp=RNCP123&displayFilters=false&activeItems=x&utm_source=lba-brevo&caller=1jeune1solution")).toEqual({
        q: "Boulanger",
        utm_source: "lba-brevo",
        caller: "1jeune1solution",
      })
    })
  })
})

describe("hasExploitableSearch", () => {
  it("refuse une recherche sans métier ni lieu", () => {
    expect(hasExploitableSearch(new URLSearchParams("radius=30&utm_source=lba"))).toBe(false)
    expect(hasExploitableSearch(new URLSearchParams("q=+"))).toBe(false)
    expect(hasExploitableSearch(new URLSearchParams("latitude=48.85"))).toBe(false)
  })

  it("accepte un métier seul ou un lieu seul", () => {
    expect(hasExploitableSearch(new URLSearchParams("q=Boulanger"))).toBe(true)
    expect(hasExploitableSearch(new URLSearchParams("latitude=48.85&longitude=2.35"))).toBe(true)
  })
})

describe("parseSearchUrlFromParam", () => {
  it("rejette tout ce qui n'est pas la page de résultats interne", () => {
    expect(parseSearchUrlFromParam(null)).toBeNull()
    expect(parseSearchUrlFromParam("")).toBeNull()
    expect(parseSearchUrlFromParam("https://evil.example/recherche?q=x")).toBeNull()
    expect(parseSearchUrlFromParam("//evil.example/recherche")).toBeNull()
    expect(parseSearchUrlFromParam("/\\evil.example/recherche")).toBeNull()
    expect(parseSearchUrlFromParam("/emploi/offres_emploi_lba/1/x")).toBeNull()
  })

  it("rejette les chemins qui ressemblent à la page de résultats sans en être", () => {
    // Préfixe voisin : sa query est au format legacy, la lire comme du nouveau format
    // ferait passer `job_name` pour un paramètre compris — il ne l'est pas.
    expect(parseSearchUrlFromParam("/recherche-formation?job_name=Boulanger")).toBeNull()
    expect(parseSearchUrlFromParam("/recherche-emploi")).toBeNull()
    // Remontée d'arborescence : le routeur normaliserait vers un chemin interne quelconque.
    expect(parseSearchUrlFromParam("/recherche/../espace-pro/administration")).toBeNull()
    expect(parseSearchUrlFromParam("/recherche/")).toBeNull()
  })

  it("accepte la page de résultats nue, avec query ou avec ancre", () => {
    expect(parseSearchUrlFromParam("/recherche")).not.toBeNull()
    expect(parseSearchUrlFromParam("/recherche?q=a")).not.toBeNull()
    expect(parseSearchUrlFromParam("/recherche#resultats")).not.toBeNull()
  })

  it("lit la query d'un from valide", () => {
    expect(Object.fromEntries(parseSearchUrlFromParam("/recherche?q=Boulanger&mode=formations")!.entries())).toEqual({ q: "Boulanger", mode: "formations" })
  })
})

describe("resolveSearchParamsFromUrl", () => {
  const BASE = "https://labonnealternance.apprentissage.beta.gouv.fr"

  it("rejoue la recherche portée par ?from= sur une fiche détail du nouveau moteur", () => {
    const url = new URL(`${BASE}/emploi/offres_emploi_lba/abc/boulanger?from=%2Frecherche%3Fq%3DBoulanger%26lieu_label%3DParis%26latitude%3D48.85%26longitude%3D2.35`)
    expect(Object.fromEntries(resolveSearchParamsFromUrl(url)!.entries())).toEqual({
      q: "Boulanger",
      lieu_label: "Paris",
      latitude: "48.85",
      longitude: "2.35",
    })
  })

  it("traduit une URL de recherche legacy historique", () => {
    const url = new URL(`${BASE}/recherche?romes=D1102&job_name=Boulanger&lat=48.85&lon=2.35&address=Paris`)
    expect(Object.fromEntries(resolveSearchParamsFromUrl(url)!.entries())).toEqual({
      q: "Boulanger",
      latitude: "48.85",
      longitude: "2.35",
      lieu_label: "Paris",
    })
  })

  it("renvoie null quand la fiche détail n'a aucun contexte de recherche", () => {
    expect(resolveSearchParamsFromUrl(new URL(`${BASE}/emploi/offres_emploi_lba/abc/boulanger?utm_source=lba`))).toBeNull()
  })

  it("renvoie null pour un from forgé vers un domaine externe", () => {
    expect(resolveSearchParamsFromUrl(new URL(`${BASE}/emploi/offres_emploi_lba/abc/x?from=https%3A%2F%2Fevil.example%2Frecherche%3Fq%3Dx`))).toBeNull()
  })
})
