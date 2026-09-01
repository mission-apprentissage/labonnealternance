import { describe, expect, it } from "vitest"

import { PAGES } from "@/utils/routes.utils"
import { IRechercheMode, parseRecherchePageParams } from "./recherche.route.utils"
import { buildRecruteursLbaSearchUrl, parseSearchPageParamsWithLegacy } from "./search-legacy-utils"

const BASE = "https://labonnealternance.apprentissage.beta.gouv.fr"

describe("parseSearchPageParamsWithLegacy", () => {
  it("interprète une URL legacy indexée (job_name + géo + diplôme)", () => {
    const params = parseSearchPageParamsWithLegacy(new URLSearchParams("job_name=Boulanger&romes=D1102&lat=48.85&lon=2.35&address=Paris+75001&radius=30&diploma=3+(CAP...)"))
    expect(params.q).toBe("Boulanger")
    expect(params.lieu_label).toBe("Paris 75001")
    expect(params.latitude).toBe(48.85)
    expect(params.longitude).toBe(2.35)
    expect(params.radius).toBe(30)
    expect(params.level).toEqual(["CAP, BEP (Infrabac)"])
  })

  it("laisse intacte une URL du nouveau moteur", () => {
    const params = parseSearchPageParamsWithLegacy(new URLSearchParams("q=Pâtissier&mode=formations&contract_type=Apprentissage"))
    expect(params.q).toBe("Pâtissier")
    expect(params.mode).toBe("formations")
    expect(params.contract_type).toEqual(["Apprentissage"])
  })

  it("ne fabrique pas de recherche à partir d'une URL sans intention", () => {
    const params = parseSearchPageParamsWithLegacy(new URLSearchParams("romes=K2101&utm_source=lba"))
    expect(params.q).toBeUndefined()
    expect(params.latitude).toBeUndefined()
    expect(params.mode).toBe("emplois")
  })
})

describe("buildRecruteursLbaSearchUrl", () => {
  it("rejoue la recherche du ?from= en cochant « entreprises à contacter »", () => {
    const from = encodeURIComponent("/recherche?q=Boulanger&lieu_label=Paris&latitude=48.85&longitude=2.35")
    const url = new URL(`http://localhost${buildRecruteursLbaSearchUrl(`${BASE}/emploi/offres_emploi_lba/abc/boulanger?from=${from}`)!}`)
    expect(url.pathname).toBe("/recherche")
    expect(url.searchParams.get("q")).toBe("Boulanger")
    expect(url.searchParams.get("lieu_label")).toBe("Paris")
    expect(url.searchParams.getAll("is_algo_company")).toEqual(["true"])
  })

  it("traduit une fiche ouverte depuis un lien legacy", () => {
    const url = new URL(`http://localhost${buildRecruteursLbaSearchUrl(`${BASE}/recherche?job_name=Boulanger&romes=D1102`)!}`)
    expect(url.searchParams.get("q")).toBe("Boulanger")
    expect(url.searchParams.getAll("is_algo_company")).toEqual(["true"])
  })

  it("renvoie null sans contexte de recherche : le CTA doit rester inactif", () => {
    expect(buildRecruteursLbaSearchUrl(`${BASE}/emploi/offres_emploi_lba/abc/boulanger?utm_source=lba`)).toBeNull()
    expect(buildRecruteursLbaSearchUrl("pas-une-url")).toBeNull()
  })

  it("refuse un ?from= pointant hors du site", () => {
    expect(buildRecruteursLbaSearchUrl(`${BASE}/emploi/offres_emploi_lba/abc/x?from=${encodeURIComponent("https://evil.example/recherche?q=x")}`)).toBeNull()
  })
})

// Repli du bouton « fermer » des fiches détail ouvertes HORS moteur (lien partagé, entrée SEO,
// lien d'un email d'avant la bascule) : la fiche ne porte pas de `?from=`, le call-site reconstruit
// donc une URL de recherche au format legacy via PAGES.dynamic.recherche. Ce test ferme la boucle
// aller-retour — c'est elle qui casse si l'un des deux bouts change de vocabulaire.
describe("retour à la recherche depuis une fiche détail sans ?from=", () => {
  it("restitue le métier, le lieu et le rayon d'une fiche ouverte depuis un lien legacy", () => {
    const detailUrl = new URLSearchParams("job_name=Boulanger&romes=D1102&lat=48.85&lon=2.35&address=Paris+75001&radius=30")
    const rechercheParams = parseRecherchePageParams(detailUrl, IRechercheMode.DEFAULT)

    const closePath = PAGES.dynamic.recherche(rechercheParams).getPath()
    const params = parseSearchPageParamsWithLegacy(new URLSearchParams(closePath.split("?")[1] ?? ""))

    expect(params.q).toBe("Boulanger")
    expect(params.lieu_label).toBe("Paris 75001")
    expect(params.latitude).toBe(48.85)
    expect(params.longitude).toBe(2.35)
    expect(params.radius).toBe(30)
  })

  it("retombe sur la recherche nue quand la fiche ne porte aucun contexte (lien d'email transactionnel)", () => {
    const rechercheParams = parseRecherchePageParams(new URLSearchParams("utm_source=lba&utm_medium=email"), IRechercheMode.DEFAULT)

    const closePath = PAGES.dynamic.recherche(rechercheParams).getPath()
    const params = parseSearchPageParamsWithLegacy(new URLSearchParams(closePath.split("?")[1] ?? ""))

    expect(params.q).toBeUndefined()
    expect(params.latitude).toBeUndefined()
  })
})
