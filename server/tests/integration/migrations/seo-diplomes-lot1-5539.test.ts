import { useMongo } from "@tests/utils/mongo.test.utils"
import { ObjectId } from "mongodb"
import { beforeAll, describe, expect, it } from "vitest"
import { getDbCollection } from "@/common/utils/mongodb-utils"
import { diplomesData, SECRETAIRE_MEDICALE_ROMES, up } from "@/migrations/20260925100000-seo-diplomes-lot1-5539"

/**
 * Ce test vit sous tests/ et non à côté de la migration : le runner liste tous les `.js` du
 * dossier migrations compilé, et `dist` contient les fichiers de test — un `*.test.ts` colocalisé
 * serait donc ramassé comme une migration.
 */
describe("migration seo-diplomes-lot1-5539", () => {
  useMongo()

  const LOT1_SLUGS = [
    "cap-esthetique",
    "cap-coiffure",
    "cap-cuisine",
    "cap-patissier",
    "cap-electricien",
    "bac-pro-melec",
    "bac-pro-ciel",
    "bac-pro-mcv",
    "bac-pro-assp",
    "titre-pro-advf",
  ]

  const formation = (cle: string, intitule_long: string, diplome: string, overrides = {}) => ({
    _id: new ObjectId(),
    cle_ministere_educatif: cle,
    intitule_long,
    diplome,
    catalogue_published: true,
    etablissement_formateur_entreprise_raison_sociale: `CFA ${cle}`,
    etablissement_formateur_code_postal: "75001",
    etablissement_formateur_localite: "Paris",
    ...overrides,
  })

  // Le validateur de collection exige tous les champs du catalogue : seuls ceux lus par updateSeoDiplome sont posés ici.
  const insertFormations = async (formations: ReturnType<typeof formation>[]) =>
    getDbCollection("formationcatalogues").insertMany(formations as never[], { bypassDocumentValidation: true })

  const existingDiplome = (slug: string, overrides = {}) => ({
    _id: new ObjectId(),
    slug,
    titre: slug,
    sousTitre: slug,
    intituleLongFormation: "SECRETAIRE MEDICAL",
    romes: ["D1401", "M1609"],
    kpis: { duration: "12 mois", entreprises: 0, offres: 0, salaire: "751€-980€" },
    description: { text: "texte existant", objectifs: [] },
    programme: { text: "programme existant", sections: { enseignements_generaux: [], enseignements_professionnels: [], competences_developpees: [] } },
    ecoles: [],
    metiers: { text: "métiers existants", liste: [] },
    cards: [],
    created_at: new Date("2026-04-27T00:00:00.000Z"),
    updated_at: new Date("2026-04-27T00:00:00.000Z"),
    ...overrides,
  })

  const findBySlug = async (slug: string) => getDbCollection("seo_diplomes").findOne({ slug })

  it("crée les 10 pages du lot avec leur contenu éditorial et leurs KPI calculables", async () => {
    await up()

    const diplomes = await getDbCollection("seo_diplomes").find({}).toArray()
    expect(diplomes.map((d) => d.slug).sort()).toEqual([...LOT1_SLUGS].sort())

    for (const diplome of diplomes) {
      expect.soft(diplome.description.text.length, diplome.slug).toBeGreaterThan(200)
      expect.soft(diplome.description.objectifs, diplome.slug).toHaveLength(5)
      expect.soft(diplome.programme.sections.enseignements_generaux, diplome.slug).toHaveLength(4)
      expect.soft(diplome.programme.sections.enseignements_professionnels, diplome.slug).toHaveLength(5)
      expect.soft(diplome.programme.sections.competences_developpees, diplome.slug).toHaveLength(5)
      expect.soft(diplome.romes.length, diplome.slug).toBeGreaterThan(0)
      expect.soft(diplome.kpis, diplome.slug).toMatchObject({ entreprises: 0, offres: 0, salaire: "504€ - 1 867€" })
    }
  })

  it("filtre les écoles d'une page CAP sur le type de diplôme (homonymes bac pro et BP écartés)", async () => {
    await insertFormations([
      formation("cap-publie", "CUISINE", "CERTIFICAT D'APTITUDE PROFESSIONNELLE"),
      formation("cap-non-publie", "CUISINE", "CERTIFICAT D'APTITUDE PROFESSIONNELLE", { catalogue_published: false }),
      formation("bac-pro-homonyme", "CUISINE", "BAC PROFESSIONNEL"),
      formation("bp-homonyme", "ARTS DE LA CUISINE", "BREVET PROFESSIONNEL"),
    ])

    await up()

    const capCuisine = await findBySlug("cap-cuisine")
    expect(capCuisine?.ecoles.map((e) => e.formationClefMinistereEducatif)).toEqual(["cap-publie"])
  })

  it("filtre les écoles d'une page bac pro sur le type de diplôme (BTS homonyme écarté)", async () => {
    await insertFormations([
      formation("bac-pro-ciel", "CYBERSECURITE, INFORMATIQUE ET RESEAUX, ELECTRONIQUE", "BAC PROFESSIONNEL"),
      formation("bts-ciel", "CYBERSECURITE, INFORMATIQUE ET RESEAUX, ELECTRONIQUE, OPTION A INFORMATIQUE ET RESEAUX", "BREVET DE TECHNICIEN SUPERIEUR"),
    ])

    await up()

    const bacProCiel = await findBySlug("bac-pro-ciel")
    expect(bacProCiel?.ecoles.map((e) => e.formationClefMinistereEducatif)).toEqual(["bac-pro-ciel"])
  })

  it("n'applique aucun filtre de diplôme sans diplomeFormation (titre pro ADVF et pages existantes)", async () => {
    await getDbCollection("seo_diplomes").insertOne(existingDiplome("bts-sam", { intituleLongFormation: "SUPPORT A L'ACTION MANAGERIALE", romes: ["M1604"] }), {
      bypassDocumentValidation: true,
    })
    await insertFormations([
      formation("advf", "ASSISTANT DE VIE AUX FAMILLES (TP)", "TH DE NIV 5 MINISTERE DU TRAVAIL - AFPA"),
      formation("bts-sam", "SUPPORT A L'ACTION MANAGERIALE", "BREVET DE TECHNICIEN SUPERIEUR"),
    ])

    await up()

    expect.soft((await findBySlug("titre-pro-advf"))?.ecoles.map((e) => e.formationClefMinistereEducatif)).toEqual(["advf"])
    expect.soft((await findBySlug("bts-sam"))?.ecoles.map((e) => e.formationClefMinistereEducatif)).toEqual(["bts-sam"])
  })

  it("corrige les codes ROME de la page secrétaire médicale sans toucher à son contenu", async () => {
    await getDbCollection("seo_diplomes").insertOne(existingDiplome("titre-pro-secretaire-medicale"), { bypassDocumentValidation: true })

    await up()

    const secretaireMedicale = await findBySlug("titre-pro-secretaire-medicale")
    expect.soft(secretaireMedicale?.romes).toEqual(["M1609"])
    expect.soft(secretaireMedicale?.description.text).toBe("texte existant")
    expect.soft(secretaireMedicale?.kpis.salaire).toBe("751€-980€")
  })

  it("est rejouable : aucun doublon, identifiant et date de création conservés", async () => {
    await up()
    const first = await findBySlug("cap-coiffure")

    await up()

    expect.soft(await getDbCollection("seo_diplomes").countDocuments({ slug: { $in: LOT1_SLUGS } })).toBe(LOT1_SLUGS.length)
    const second = await findBySlug("cap-coiffure")
    expect.soft(second?._id).toEqual(first?._id)
    expect.soft(second?.created_at).toEqual(first?.created_at)
  })
})

/**
 * Les pages diplôme sont décrites à deux endroits tenus à la main : la migration (contenu en base) et
 * ui/.../diplome_data.tsx (hub, footer, plan du site, sitemap). Un écart passe inaperçu : les ROME de la
 * page secrétaire médicale sont restés faux plusieurs mois côté base. Ce test fait échouer la CI dès que
 * les deux sources divergent.
 */
describe("cohérence entre la migration seo-diplomes-lot1-5539 et diplome_data.tsx", () => {
  type IDiplomeData = { slug: string; titre: string; intituleLongFormation: string; romes: string[] }
  let uiBySlug: Map<string, IDiplomeData>

  beforeAll(async () => {
    // Import dynamique : le tsconfig server n'active pas `jsx` et refuse donc un import statique du `.tsx`
    // du workspace ui ; vitest, lui, le charge sans difficulté.
    const uiDataPath = `${import.meta.dirname}/../../../../ui/app/(editorial)/alternance/_components/diplome_data.tsx`
    const { diplomeData } = (await import(uiDataPath)) as { diplomeData: IDiplomeData[] }
    uiBySlug = new Map(diplomeData.map((d) => [d.slug, d]))
  })

  it.each(diplomesData.map((d) => [d.slug, d] as const))("%s est identique dans les deux sources", (slug, diplome) => {
    const ui = uiBySlug.get(slug)
    expect(ui, `${slug} absent de diplome_data.tsx`).toBeDefined()
    expect.soft(ui?.titre).toBe(diplome.titre)
    expect.soft(ui?.intituleLongFormation).toBe(diplome.intituleLongFormation)
    expect.soft(ui?.romes).toEqual(diplome.romes)
  })

  it("les codes ROME de la page secrétaire médicale sont identiques dans les deux sources", () => {
    expect(uiBySlug.get("titre-pro-secretaire-medicale")?.romes).toEqual(SECRETAIRE_MEDICALE_ROMES)
  })
})
