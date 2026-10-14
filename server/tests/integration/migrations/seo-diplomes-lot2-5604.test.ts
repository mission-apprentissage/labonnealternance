import { useMongo } from "@tests/utils/mongo.test.utils"
import { ObjectId } from "mongodb"
import { beforeAll, describe, expect, it } from "vitest"
import { getDbCollection } from "@/common/utils/mongodb-utils"
import { diplomesData, up } from "@/migrations/20260929100000-seo-diplomes-lot2-5604"

/**
 * Ce test vit sous tests/ et non à côté de la migration : le runner liste tous les `.js` du
 * dossier migrations compilé, et `dist` contient les fichiers de test — un `*.test.ts` colocalisé
 * serait donc ramassé comme une migration.
 */
describe("migration seo-diplomes-lot2-5604", () => {
  useMongo()

  const LOT2_SLUGS = [
    "cap-boucher",
    "cap-monteur-installations-sanitaires",
    "capa-jardinier-paysagiste",
    "cap-psr",
    "cap-boulanger",
    "bac-pro-agora",
    "cap-fleuriste",
    "bac-pro-tci",
    "cap-epc",
    "bac-pro-mspc",
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

  const findBySlug = async (slug: string) => getDbCollection("seo_diplomes").findOne({ slug })
  const ecolesOf = async (slug: string) => (await findBySlug(slug))?.ecoles.map((e) => e.formationClefMinistereEducatif)

  it("crée les 10 pages du lot avec leur contenu éditorial et leurs KPI calculables", async () => {
    await up()

    const diplomes = await getDbCollection("seo_diplomes").find({}).toArray()
    expect(diplomes.map((d) => d.slug).sort()).toEqual([...LOT2_SLUGS].sort())

    for (const diplome of diplomes) {
      expect.soft(diplome.description.text.length, diplome.slug).toBeGreaterThan(200)
      expect.soft(diplome.description.objectifs, diplome.slug).toHaveLength(5)
      expect.soft(diplome.programme.sections.enseignements_generaux, diplome.slug).toHaveLength(4)
      expect.soft(diplome.programme.sections.enseignements_professionnels, diplome.slug).toHaveLength(5)
      expect.soft(diplome.programme.sections.competences_developpees, diplome.slug).toHaveLength(5)
      expect.soft(diplome.romes.length, diplome.slug).toBeGreaterThan(0)
      expect.soft(diplome.diplomeFormation, diplome.slug).toBeTruthy()
      expect.soft(diplome.kpis, diplome.slug).toMatchObject({ entreprises: 0, offres: 0, salaire: "504€ - 1 867€" })
    }
  })

  it("filtre les écoles d'une page CAP sur le type de diplôme (BP, CS et bac pro homonymes écartés)", async () => {
    await insertFormations([
      formation("cap-boulanger", "BOULANGER", "CERTIFICAT D'APTITUDE PROFESSIONNELLE"),
      formation("bp-boulanger", "BOULANGER", "BREVET PROFESSIONNEL"),
      formation("bac-pro-boulanger", "BOULANGER-PÂTISSIER", "BAC PROFESSIONNEL"),
      formation("cap-boucher", "BOUCHER", "CERTIFICAT D'APTITUDE PROFESSIONNELLE"),
      formation("bp-boucher", "BOUCHER", "BREVET PROFESSIONNEL"),
    ])

    await up()

    expect.soft(await ecolesOf("cap-boulanger")).toEqual(["cap-boulanger"])
    expect.soft(await ecolesOf("cap-boucher")).toEqual(["cap-boucher"])
  })

  it("filtre les écoles du CAP agricole sur son propre type de diplôme", async () => {
    await insertFormations([
      formation("capa-paysagiste", "JARDINIER PAYSAGISTE (CAPA)", "CERTIFICAT D'APTITUDE PROFESSIONNELLE AGRICOLE"),
      formation("autre-diplome", "JARDINIER PAYSAGISTE", "TH DE NIV 5 MINISTERE DU TRAVAIL - AFPA"),
    ])

    await up()

    expect(await ecolesOf("capa-jardinier-paysagiste")).toEqual(["capa-paysagiste"])
  })

  it("filtre les écoles d'une page bac pro sur le type de diplôme", async () => {
    await insertFormations([
      formation("bac-pro-tci", "TECHNICIEN EN CHAUDRONNERIE INDUSTRIELLE", "BAC PROFESSIONNEL"),
      formation("bac-pro-tci-non-publie", "TECHNICIEN EN CHAUDRONNERIE INDUSTRIELLE", "BAC PROFESSIONNEL", { catalogue_published: false }),
      formation("autre-tci", "TECHNICIEN EN CHAUDRONNERIE INDUSTRIELLE", "TH DE NIV 4 MINISTERE DU TRAVAIL - AFPA"),
    ])

    await up()

    expect(await ecolesOf("bac-pro-tci")).toEqual(["bac-pro-tci"])
  })

  it("est rejouable : aucun doublon, identifiant et date de création conservés", async () => {
    await up()
    const first = await findBySlug("cap-boucher")

    await up()

    expect.soft(await getDbCollection("seo_diplomes").countDocuments({ slug: { $in: LOT2_SLUGS } })).toBe(LOT2_SLUGS.length)
    const second = await findBySlug("cap-boucher")
    expect.soft(second?._id).toEqual(first?._id)
    expect.soft(second?.created_at).toEqual(first?.created_at)
  })
})

/**
 * Les pages diplôme sont décrites à deux endroits tenus à la main : la migration (contenu en base) et
 * ui/.../diplome_data.tsx (hub, footer, plan du site, sitemap). Ce test fait échouer la CI dès que les
 * deux sources divergent pour une page du lot.
 */
describe("cohérence entre la migration seo-diplomes-lot2-5604 et diplome_data.tsx", () => {
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
})
