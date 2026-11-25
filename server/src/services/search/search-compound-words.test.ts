import { readFileSync } from "node:fs"
import { useMongo } from "@tests/utils/mongo.test.utils"
import { LBA_ITEM_TYPE } from "shared/constants/lbaitem"
import { generateSearchItemFixture } from "shared/fixtures/search-items.fixture"
import { beforeAll, describe, expect, it } from "vitest"
import { getStaticFilePath } from "@/common/utils/get-static-file-path"
import { createSearchIndexes, getDbCollection } from "@/common/utils/mongodb-utils"
import { type SearchMode, searchItems } from "@/services/search/search.service"
import { compoundSpellingVariants, WELDED_COMPOUND_PREFIXES, withCompoundSpellingVariants } from "@/services/search/search-compound-words"
import { getSearchCorpusCollection } from "@/services/search/search-items.service"

const variantsOf = (q: string, term: string) => compoundSpellingVariants(q).get(term)

// Un cas par élément savant retenu : graphie soudée attestée dans le référentiel ROME, titre écrit à trait d'union.
const PREFIX_CASES = [
  { prefix: "aero", welded: "aéroportuaire", hyphenTitle: "Agent d'escale aéro-portuaire" },
  { prefix: "agro", welded: "agroalimentaire", hyphenTitle: "Opérateur agro-alimentaire" },
  { prefix: "audio", welded: "audioprothésiste", hyphenTitle: "Assistant audio-prothésiste" },
  { prefix: "bio", welded: "biomédical", hyphenTitle: "Technicien bio-médical" },
  { prefix: "eco", welded: "écotourisme", hyphenTitle: "Guide éco-tourisme" },
  { prefix: "electro", welded: "électroménager", hyphenTitle: "Vendeur électro-ménager" },
  { prefix: "geo", welded: "géotechnicien", hyphenTitle: "Géo-technicien de chantier" },
  { prefix: "hydro", welded: "hydrothérapie", hyphenTitle: "Agent d'hydro-thérapie" },
  { prefix: "medico", welded: "médicotechnique", hyphenTitle: "Assistant médico-technique" },
  { prefix: "pharmaco", welded: "pharmacovigilance", hyphenTitle: "Chargé de pharmaco-vigilance" },
  { prefix: "photo", welded: "photovoltaïque", hyphenTitle: "Installateur photo-voltaïque" },
  { prefix: "psycho", welded: "psychomotricien", hyphenTitle: "Psycho-motricien" },
  { prefix: "radio", welded: "radioprotection", hyphenTitle: "Technicien radio-protection" },
  { prefix: "socio", welded: "socioculturel", hyphenTitle: "Animateur socio-culturel" },
]

describe("compoundSpellingVariants — faux positifs", () => {
  it.each(["médicament", "médical", "sociologie", "sociologue", "psychologue", "psychose", "paramédical", "école", "automobile", "sociétés"])(
    "ne coupe pas « %s », qui n'est pas un composé soudé",
    (q) => {
      expect(variantsOf(q, q)).toBeUndefined()
    }
  )

  it("ne coupe pas un préfixe employé seul", () => {
    expect(compoundSpellingVariants("médico").size).toBe(0)
  })

  it("ne soude pas deux mots séparés par une espace quand le premier n'est pas un élément savant", () => {
    expect(compoundSpellingVariants("assistant social").size).toBe(0)
  })

  it("ne soude pas un élément savant suivi d'un mot court (mot vide, suffixe)", () => {
    expect(compoundSpellingVariants("socio et sport").get("socio")).toBeUndefined()
  })

  it("« secrétaire » et « secrétaire médical » : aucune variante, la clause de couverture reste identique", () => {
    expect(compoundSpellingVariants("secrétaire").size).toBe(0)
    expect(compoundSpellingVariants("secrétaire médical").size).toBe(0)
    const clause = { text: { query: "secrétaire", path: "title" } }
    expect(withCompoundSpellingVariants(clause, "title", 7, undefined)).toBe(clause)
  })

  it("ne soude pas deux mots séparés par une ponctuation autre que le trait d'union", () => {
    expect(compoundSpellingVariants("médico/social").size).toBe(0)
    expect(compoundSpellingVariants("secrétaire, médical").size).toBe(0)
  })
})

describe("compoundSpellingVariants — cas nominaux", () => {
  it("soudé → trait d'union : la coupe garde les accents de la saisie", () => {
    expect(variantsOf("médicosocial", "médicosocial")).toEqual({ phrases: ["médico social"], welded: [] })
    expect(variantsOf("socioéducatif", "socioéducatif")).toEqual({ phrases: ["socio éducatif"], welded: [] })
    expect(variantsOf("psychomotricien", "psychomotricien")).toEqual({ phrases: ["psycho motricien"], welded: [] })
    expect(variantsOf("électroménager", "électroménager")).toEqual({ phrases: ["électro ménager"], welded: [] })
  })

  it.each(PREFIX_CASES)("coupe $welded après $prefix", ({ welded }) => {
    const phrases = variantsOf(welded, welded)?.phrases ?? []
    expect(phrases).toHaveLength(1)
    expect(phrases[0].replace(" ", "")).toBe(welded)
  })

  it("appellation ROME 4 de l'incident : chaque graphie soudée a sa coupe", () => {
    const variants = compoundSpellingVariants("Secrétaire médicosocial / Secrétaire médicosociale")
    expect(variants.get("médicosocial")?.phrases).toEqual(["médico social"])
    expect(variants.get("médicosociale")?.phrases).toEqual(["médico sociale"])
    expect(variants.get("secrétaire")).toBeUndefined()
  })

  it("trait d'union → soudé : la forme soudée couvre les deux moitiés", () => {
    const variants = compoundSpellingVariants("secrétaire médico-social")
    expect(variants.get("médico")).toEqual({ phrases: [], welded: ["médicosocial"] })
    expect(variants.get("social")).toEqual({ phrases: [], welded: ["médicosocial"] })
  })

  it("espace → soudé quand le premier mot est un élément savant", () => {
    expect(variantsOf("socio éducatif", "éducatif")).toEqual({ phrases: [], welded: ["socioéducatif"] })
  })

  it("trait d'union hors éléments savants : la forme soudée est proposée aussi (« e-commerce »)", () => {
    expect(variantsOf("e-commerce", "commerce")).toEqual({ phrases: [], welded: ["ecommerce"] })
  })
})

describe("WELDED_COMPOUND_PREFIXES", () => {
  // Chaque élément doit être attesté soudé dans le référentiel ROME du dépôt : un élément ajouté
  // sans attestation (« auto », « para ») couperait des mots courants sans composé à retrouver.
  it("chaque élément est attesté soudé dans un libellé du référentiel ROME", () => {
    const fold = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase()
    const words = new Set(fold(readFileSync(getStaticFilePath("referentiel/unix_referentiel_code_rome_v460_utf8.csv"), "utf8")).match(/[a-z]+/g))
    const unattested = WELDED_COMPOUND_PREFIXES.filter((prefix) => ![...words].some((word) => word.startsWith(prefix) && word.length - prefix.length >= 6))
    expect(unattested).toEqual([])
  })

  it("chaque élément a son cas dans PREFIX_CASES", () => {
    expect(PREFIX_CASES.map(({ prefix }) => prefix).sort()).toEqual([...WELDED_COMPOUND_PREFIXES].sort())
  })
})

/**
 * Contre mongot (sidecar MongoDB Search), comme search-result.test.ts : gated, hors CI.
 *   SEARCH_RELEVANCE_TESTS=true yarn vitest run src/services/search/search-compound-words.test.ts
 */
const RUN_RELEVANCE = process.env.SEARCH_RELEVANCE_TESTS === "true"

const CORPUS = [
  // emplois : les deux graphies, et les pièges qui ne partagent qu'une moitié du composé.
  generateSearchItemFixture({
    url_id: "offre-secretaire-medico-sociale",
    title: "Secrétaire médico-sociale",
    description: "Accueil des patients et gestion des dossiers.",
    keywords: ["secrétariat"],
    rome_labels: ["Secrétariat"],
  }),
  generateSearchItemFixture({
    url_id: "offre-assistant-medicosocial",
    title: "Assistant médicosocial",
    description: "Accompagnement des usagers.",
    keywords: ["accompagnement"],
    rome_labels: ["Accompagnement"],
  }),
  generateSearchItemFixture({
    url_id: "offre-etablissements-medico-sociaux",
    title: "Agent de service en établissements médico-sociaux",
    description: "Entretien des locaux.",
    keywords: ["entretien"],
    rome_labels: ["Nettoyage de locaux"],
  }),
  generateSearchItemFixture({
    url_id: "offre-educateur-socioeducatif",
    title: "Éducateur socioéducatif",
    description: "Suivi éducatif de jeunes.",
    keywords: ["éducation"],
    rome_labels: ["Éducation spécialisée"],
  }),
  generateSearchItemFixture({
    url_id: "offre-psychomotricien",
    title: "Psychomotricien",
    description: "Rééducation psychomotrice.",
    keywords: ["rééducation"],
    rome_labels: ["Rééducation"],
  }),
  generateSearchItemFixture({
    url_id: "piege-secretaire-medicale",
    title: "Secrétaire médicale",
    description: "Accueil des patients.",
    keywords: ["secrétariat"],
    rome_labels: ["Secrétariat"],
  }),
  generateSearchItemFixture({
    url_id: "piege-assistant-social",
    title: "Assistant social",
    description: "Accompagnement social des familles.",
    keywords: ["social"],
    rome_labels: ["Action sociale"],
  }),
  // Porte dérobée keywords : en mono-terme, keywords ne couvre que les recruteurs (cf.
  // buildTermCoverageClause), alternatives comprises.
  generateSearchItemFixture({
    url_id: "piege-keyword-medico-social",
    title: "Agent d'accueil",
    description: "Accueil du public.",
    keywords: ["médico-social"],
    rome_labels: ["Accueil"],
  }),
  generateSearchItemFixture({
    url_id: "recruteur-keyword-medico-social",
    type_filter_label: "Candidature spontanée",
    sub_type: LBA_ITEM_TYPE.RECRUTEURS_LBA,
    is_algo_company: true,
    title: "Résidence Les Tilleuls",
    description: "",
    keywords: ["médico-social"],
    rome_labels: ["Accueil"],
  }),
  // emplois_formation
  generateSearchItemFixture({
    url_id: "offre-cfa-secretaire-medico-social",
    type_filter_label: "Offres d'emploi postées par des écoles",
    title: "Secrétaire médico-social avec formation incluse",
    description: "Contrat d'apprentissage associé à une formation au CFA.",
    keywords: ["secrétariat"],
    rome_labels: ["Secrétariat"],
    is_formation_included: true,
  }),
  generateSearchItemFixture({
    url_id: "offre-cfa-educateur-socioeducatif",
    type_filter_label: "Offres d'emploi postées par des écoles",
    title: "Éducateur socioéducatif avec formation incluse",
    description: "Contrat d'apprentissage associé à une formation au CFA.",
    keywords: ["éducation"],
    rome_labels: ["Éducation spécialisée"],
    is_formation_included: true,
  }),
  // formations
  generateSearchItemFixture({
    url_id: "formation-secretaire-medico-social",
    type: "formation",
    type_filter_label: "Formation",
    sub_type: "formation",
    title: "Titre professionnel secrétaire assistant médico-social",
    description: "Formation en alternance.",
    keywords: ["secrétariat"],
    rome_labels: ["Secrétariat"],
    is_formation_included: null,
  }),
  generateSearchItemFixture({
    url_id: "formation-moniteur-socioeducatif",
    type: "formation",
    type_filter_label: "Formation",
    sub_type: "formation",
    title: "Diplôme d'État de moniteur socioéducatif",
    description: "Formation en alternance.",
    keywords: ["éducation"],
    rome_labels: ["Éducation spécialisée"],
    is_formation_included: null,
  }),
  ...PREFIX_CASES.map(({ prefix, hyphenTitle }) =>
    generateSearchItemFixture({ url_id: `prefixe-${prefix}`, title: hyphenTitle, description: "", keywords: [], rome_labels: ["Divers"] })
  ),
]

async function seedCorpus() {
  for (const doc of CORPUS) await getDbCollection(getSearchCorpusCollection(doc)).insertOne(doc)
}

const MODES = ["emplois", "emplois_formation", "formations"] as const

function search(q: string | undefined, mode: SearchMode = "emplois") {
  return searchItems({ q, mode, radius: 30, page: 0, hitsPerPage: 50 })
}

const ids = async (q: string, mode: SearchMode = "emplois") => (await search(q, mode)).hits.map((hit) => hit.url_id)

async function waitForSearchIndexSync(timeoutMs = 120_000) {
  const start = Date.now()
  for (;;) {
    try {
      const counts = await Promise.all(MODES.map((mode) => search(undefined, mode)))
      if (counts.reduce((total, { nbHits }) => total + nbHits, 0) >= CORPUS.length) return
    } catch {
      // index pas encore créé côté mongot → on réessaie
    }
    if (Date.now() - start > timeoutMs) throw new Error(`mongot n'a pas indexé les ${CORPUS.length} documents en ${timeoutMs}ms`)
    await new Promise((resolve) => setTimeout(resolve, 1_000))
  }
}

describe.runIf(RUN_RELEVANCE)("graphies soudée et à trait d'union — contre mongot", () => {
  useMongo(seedCorpus, "beforeAll")

  beforeAll(async () => {
    await createSearchIndexes()
    await waitForSearchIndexSync()
  }, 150_000)

  describe("faux positifs", () => {
    it("une seule moitié du composé ne suffit pas : « médicosocial » ne ramène ni l'assistant social ni la secrétaire médicale", async () => {
      const result = await ids("médicosocial")
      expect(result).not.toContain("piege-assistant-social")
      expect(result).not.toContain("piege-secretaire-medicale")
    })

    it("l'appellation de l'incident ne ramène pas la secrétaire médicale", async () => {
      expect(await ids("Secrétaire médicosocial / Secrétaire médicosociale")).not.toContain("piege-secretaire-medicale")
    })

    it("en mono-terme, la forme coupée ne couvre via keywords que les recruteurs", async () => {
      const result = await ids("médicosocial")
      expect(result).not.toContain("piege-keyword-medico-social")
      expect(result).toContain("recruteur-keyword-medico-social")
    })
  })

  describe("soudé → trait d'union", () => {
    it("emplois : l'appellation ROME 4 de l'incident retrouve l'offre à trait d'union", async () => {
      expect(await ids("Secrétaire médicosocial / Secrétaire médicosociale")).toContain("offre-secretaire-medico-sociale")
    })

    it("emplois : la flexion suit le stemmer (« médico-sociale », « médico-sociaux »)", async () => {
      const result = await ids("médicosocial")
      expect(result).toEqual(expect.arrayContaining(["offre-secretaire-medico-sociale", "offre-etablissements-medico-sociaux", "offre-assistant-medicosocial"]))
    })

    it("emplois_formation et formations : la forme soudée retrouve la forme à trait d'union", async () => {
      expect(await ids("secrétaire médicosocial", "emplois_formation")).toContain("offre-cfa-secretaire-medico-social")
      expect(await ids("secrétaire médicosocial", "formations")).toContain("formation-secretaire-medico-social")
    })
  })

  it.each(PREFIX_CASES)("emplois : $welded retrouve $hyphenTitle", async ({ prefix, welded }) => {
    expect(await ids(welded)).toContain(`prefixe-${prefix}`)
  })

  describe("trait d'union → soudé", () => {
    it("emplois : « médico-social » et « médico social » retrouvent l'offre soudée", async () => {
      expect(await ids("médico-social")).toContain("offre-assistant-medicosocial")
      expect(await ids("médico social")).toContain("offre-assistant-medicosocial")
    })

    it("emplois : « psycho-motricien » retrouve « Psychomotricien »", async () => {
      expect(await ids("psycho-motricien")).toContain("offre-psychomotricien")
    })

    it("les trois modes : « socio-éducatif » retrouve la forme soudée", async () => {
      expect(await ids("socio-éducatif")).toContain("offre-educateur-socioeducatif")
      expect(await ids("socio-éducatif", "emplois_formation")).toContain("offre-cfa-educateur-socioeducatif")
      expect(await ids("socio-éducatif", "formations")).toContain("formation-moniteur-socioeducatif")
    })
  })
})
