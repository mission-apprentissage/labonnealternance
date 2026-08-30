import { describe, expect, it } from "vitest"

import { buildRecherchePageParams, IRechercheMode, parseRecherchePageParams, resolveRecherchePageParams, toURLSearchParams } from "./recherche.route.utils"

/**
 * Ce module a perdu ses schémas zod (le type `IRecherchePageParams` est désormais explicite) :
 * ces tests remplacent la validation qui était jusqu'ici portée par zod. Les cas qui doivent
 * répondre *faux* passent en premier — c'est là que la réécriture peut régresser sans que rien
 * ne le signale.
 */
describe("parseRecherchePageParams", () => {
  it("retourne null sans searchParams", () => {
    expect(parseRecherchePageParams(null, IRechercheMode.DEFAULT)).toBeNull()
  })

  it("applique les valeurs par défaut sur une URL nue", () => {
    const params = parseRecherchePageParams(new URLSearchParams(""), IRechercheMode.DEFAULT)
    expect(params).toMatchObject({
      romes: [],
      geo: null,
      radius: 30,
      diploma: null,
      displayEntreprises: true,
      displayFormations: true,
      displayFilters: true,
    })
  })

  it("ignore une géo incomplète (address seule, sans lat/lon)", () => {
    const params = parseRecherchePageParams(new URLSearchParams("address=Lyon"), IRechercheMode.DEFAULT)
    expect(params.geo).toBeNull()
  })

  it("rejette un diploma hors référentiel", () => {
    expect(parseRecherchePageParams(new URLSearchParams("diploma=42+(Inexistant)"), IRechercheMode.DEFAULT).diploma).toBeNull()
  })

  it("force les toggles d'affichage en mode formations-only", () => {
    const params = parseRecherchePageParams(new URLSearchParams("displayEntreprises=true&displayFilters=true"), IRechercheMode.FORMATIONS_ONLY)
    expect(params).toMatchObject({ displayEntreprises: false, displayFormations: true, displayFilters: false })
  })

  it("fait un round-trip avec buildRecherchePageParams", () => {
    const query = buildRecherchePageParams(
      {
        romes: ["M1805"],
        geo: { address: "Lyon", latitude: 45.75, longitude: 4.85 },
        radius: 60,
        job_name: "Data analyst",
      },
      IRechercheMode.DEFAULT
    )
    expect(parseRecherchePageParams(new URLSearchParams(query), IRechercheMode.DEFAULT)).toMatchObject({
      romes: ["M1805"],
      geo: { address: "Lyon", latitude: 45.75, longitude: 4.85 },
      radius: 60,
      job_name: "Data analyst",
    })
  })
})

/**
 * Résolution du contexte de recherche d'une fiche détail. Les cas où `?from=` ne doit PAS être
 * pris en compte passent en premier : un `from` accepté à tort remplacerait le métier et le lieu
 * réels par ceux d'une URL forgée ou étrangère, et ces valeurs partent en base avec la
 * candidature (`job_searched_by_user`) puis dans les mails recruteur.
 *
 * `from` est percent-encodé dans les vraies URL de fiche (buildHitDetailUrl) et décodé par
 * URLSearchParams : les tests l'encodent de même, sinon ses `&` internes seraient lus comme des
 * paramètres de l'URL de la fiche et le cas testé ne serait pas celui qu'on croit.
 */
describe("resolveRecherchePageParams", () => {
  const legacy = "job_name=Boulanger&lat=45.75&lon=4.85&address=Lyon&radius=60"
  const withFrom = (from: string, prefix = "") => new URLSearchParams(`${prefix}${prefix ? "&" : ""}from=${encodeURIComponent(from)}`)

  describe("`from` ignoré → repli sur les paramètres legacy", () => {
    it("sans `from` du tout", () => {
      expect(resolveRecherchePageParams(new URLSearchParams(legacy), IRechercheMode.DEFAULT)).toMatchObject({
        job_name: "Boulanger",
        geo: { address: "Lyon", latitude: 45.75, longitude: 4.85 },
        radius: 60,
      })
    })

    it("`from` absolu externe, même si son chemin contient /recherche", () => {
      const params = resolveRecherchePageParams(withFrom("https://evil.example/recherche?q=Piraté", legacy), IRechercheMode.DEFAULT)
      expect(params.job_name).toBe("Boulanger")
      expect(params.geo).toMatchObject({ address: "Lyon", latitude: 45.75, longitude: 4.85 })
    })

    it("`from` pointant sur un autre chemin interne", () => {
      expect(resolveRecherchePageParams(withFrom("/emploi/partner/abc/titre?q=Piraté", legacy), IRechercheMode.DEFAULT).job_name).toBe("Boulanger")
    })

    // Le garde vient de `isInternalSearchUrl` (shared). Ces deux cas vérifient que le résolveur
    // en hérite bien, et non qu'il refait la validation dans son coin.
    it("`from` sur un chemin voisin de /recherche (near-miss de préfixe)", () => {
      expect(resolveRecherchePageParams(withFrom("/recherchez-moi?q=Piraté", legacy), IRechercheMode.DEFAULT).job_name).toBe("Boulanger")
    })

    it("`from` remontant l'arborescence depuis /recherche", () => {
      expect(resolveRecherchePageParams(withFrom("/recherche/../espace-pro/administration?q=Piraté", legacy), IRechercheMode.DEFAULT).job_name).toBe("Boulanger")
    })

    it("`from` répété : aucune des deux valeurs ne fait autorité", () => {
      const search = toURLSearchParams({ job_name: "Boulanger", from: ["/recherche?q=Premier", "/recherche?q=Second"] })
      expect(resolveRecherchePageParams(search, IRechercheMode.DEFAULT).job_name).toBe("Boulanger")
    })
  })

  describe("`from` valide", () => {
    it("prend le métier, le lieu et le rayon de la recherche d'origine", () => {
      expect(
        resolveRecherchePageParams(withFrom("/recherche?q=Développeur web&lieu_label=Nantes 44000&latitude=47.21&longitude=-1.55&radius=45"), IRechercheMode.DEFAULT)
      ).toMatchObject({
        job_name: "Développeur web",
        geo: { address: "Nantes 44000", latitude: 47.21, longitude: -1.55 },
        radius: 45,
      })
    })

    it("fait autorité en bloc : un `from` sans métier n'hérite pas du job_name legacy", () => {
      const params = resolveRecherchePageParams(withFrom("/recherche?latitude=47.21&longitude=-1.55", legacy), IRechercheMode.DEFAULT)
      expect(params.job_name).toBeNull()
      expect(params.geo).toMatchObject({ latitude: 47.21, longitude: -1.55 })
    })

    it("fait autorité en bloc : un `from` sans géo n'hérite pas de la géo legacy", () => {
      expect(resolveRecherchePageParams(withFrom("/recherche?q=Plombier", legacy), IRechercheMode.DEFAULT)).toMatchObject({ job_name: "Plombier", geo: null })
    })

    it("ignore une coordonnée orpheline (latitude sans longitude)", () => {
      expect(resolveRecherchePageParams(withFrom("/recherche?q=Plombier&latitude=47.21"), IRechercheMode.DEFAULT).geo).toBeNull()
    })

    it("applique le rayon par défaut du nouveau moteur (20), pas celui du legacy (30)", () => {
      expect(resolveRecherchePageParams(withFrom("/recherche?q=Plombier"), IRechercheMode.DEFAULT).radius).toBe(20)
    })

    it("laisse intacts les champs qui ne décrivent pas la recherche (romes, diploma, toggles)", () => {
      const params = resolveRecherchePageParams(withFrom("/recherche?q=Plombier", "romes=M1805&diploma=4 (BAC...)&displayFormations=false"), IRechercheMode.DEFAULT)
      expect(params).toMatchObject({ romes: ["M1805"], diploma: "4 (BAC...)", displayFormations: false })
    })
  })
})

/**
 * `new URLSearchParams(record)` aplatit un paramètre répété en une chaîne jointe par des
 * virgules : la valeur produite n'est portée par aucun des liens d'origine, et les gardes en
 * aval la valident comme une valeur unique. Les cas répétés passent donc en premier.
 */
describe("toURLSearchParams", () => {
  it("conserve les valeurs répétées séparées, là où le constructeur natif les joint", () => {
    const record = { from: ["/recherche?q=a", "/recherche?q=b"] }
    expect(toURLSearchParams(record).getAll("from")).toEqual(["/recherche?q=a", "/recherche?q=b"])
    // Le comportement natif qu'on remplace, pour que le test échoue si quelqu'un y revient.
    expect(new URLSearchParams(record as unknown as Record<string, string>).getAll("from")).toEqual(["/recherche?q=a,/recherche?q=b"])
  })

  it("ignore les clés absentes et garde les valeurs simples", () => {
    expect(toURLSearchParams({ job_name: "Boulanger", diploma: undefined }).getAll("diploma")).toEqual([])
    expect(toURLSearchParams({ job_name: "Boulanger" }).get("job_name")).toBe("Boulanger")
  })

  it("préserve un tableau vide sans inventer de clé", () => {
    expect([...toURLSearchParams({ from: [] }).keys()]).toEqual([])
  })
})
