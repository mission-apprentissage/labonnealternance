import { useMongo } from "@tests/utils/mongo.test.utils"
import { ObjectId } from "mongodb"
import { generateAlgoliaFixture } from "shared/fixtures/algolia.fixture"
import { beforeAll, describe, expect, it } from "vitest"
import { createSearchIndexes, getDbCollection } from "@/common/utils/mongodbUtils"
import { searchAlgolia, suggestAlgolia } from "@/services/search/search.service"

/**
 * Tests de pertinence du moteur de recherche MongoDB Search ($search).
 *
 * Source : recette manuelle de l'équipe (30/06 → 13/07/2026), tableau Notion
 * "Tests sur la pertinence des résultats" :
 * https://app.notion.com/p/mission-apprentissage/37a0c88032c8803781c4dc1ae569491b
 * + short-list de référence (vue "jeu de tests", statuts "OK/KO - jeu de test") :
 * https://app.notion.com/p/mission-apprentissage/39c0c88032c8802088cec07afde2518a
 *
 * Le fichier est découpé en deux sections :
 *  1. "non-régression" : comportements validés OK en recette → ils doivent RESTER verts
 *     après toute modification du moteur (boosts, analyzers, synonymes, index...).
 *  2. "cibles d'amélioration" : comportements jugés KO / Mitigé en recette. Les tests
 *     décrivent le comportement CIBLE et sont marqués `it.fails` : ils sont verts tant
 *     que le défaut existe, et passent au rouge dès qu'une modification du moteur corrige
 *     le cas → il faut alors retirer le `.fails` pour promouvoir le test en non-régression.
 *
 * ⚠️ Ces tests nécessitent mongot (sidecar MongoDB Search) : ils tournent contre la stack
 * Docker locale (`yarn dev` / `yarn services:start`), PAS en CI. Ils sont donc gated :
 *
 *   SEARCH_RELEVANCE_TESTS=true yarn vitest run src/services/search/search-result.test.ts
 *
 * Le corpus est un jeu de données contrôlé (pas le seed) : chaque document est construit
 * pour reproduire un scénario précis remonté en recette, avec ses "pièges" (docs qui ne
 * doivent PAS remonter ou pas en tête). L'indexation mongot étant asynchrone, le corpus
 * est seedé une seule fois (beforeAll) puis on attend la synchro avant les assertions.
 */

const RUN_RELEVANCE = process.env.SEARCH_RELEVANCE_TESTS === "true"

const PARIS = { latitude: 48.8566, longitude: 2.3522 }

// Corpus contrôlé — url_id = clé stable utilisée dans les assertions.
const CORPUS = [
  // — maintenance : cible de la recherche avec faute "maintenace" (Marion, OK)
  generateAlgoliaFixture({
    url_id: "offre-maintenance",
    title: "Technicien de maintenance industrielle",
    description: "Interventions de maintenance préventive et corrective sur les lignes de production.",
    keywords: ["maintenance", "industrie"],
    rome_labels: ["Maintenance industrielle"],
    organization_name: "Industria",
  }),
  // — multi-mots "product manager" (Marion, KO) : le doc full-match...
  generateAlgoliaFixture({
    url_id: "offre-product-manager",
    title: "Product Manager",
    description: "Gestion de la roadmap produit et des priorités.",
    keywords: ["produit", "roadmap"],
    rome_labels: ["Management et gestion de produit"],
    organization_name: "StartupTech",
  }),
  // ...et ses pièges 1-terme ("product" seul / "manager" seul)
  generateAlgoliaFixture({
    url_id: "offre-product-designer",
    title: "Product Designer",
    description: "Conception d'interfaces utilisateur.",
    keywords: ["design"],
    rome_labels: ["Design d'interfaces"],
    organization_name: "StudioX",
  }),
  generateAlgoliaFixture({
    url_id: "offre-assistant-manager",
    title: "Assistant manager de rayon",
    description: "Encadrement d'équipe en grande distribution.",
    keywords: ["distribution"],
    rome_labels: ["Grande distribution"],
    organization_name: "HyperRetail",
    publication_date: new Date("2025-01-02T10:00:00.000Z"),
  }),
  // — priorité titre > description : "commerce" (Marion, Mitigé — un poste de dev
  //   pour un site e-commerce remontait en 1er devant les postes de commerce)
  generateAlgoliaFixture({
    url_id: "offre-conseiller-commerce",
    title: "Conseiller de vente en commerce",
    description: "Accueil et conseil client en boutique.",
    keywords: ["vente", "boutique"],
    rome_labels: ["Vente en habillement et accessoires de la personne"],
    organization_name: "ModeStore",
  }),
  generateAlgoliaFixture({
    url_id: "offre-dev-ecommerce",
    title: "Développeur web",
    description: "Développement d'un site de e-commerce pour un grand retailer.",
    keywords: ["javascript"],
    rome_labels: ["Développement informatique"],
    organization_name: "WebAgency",
  }),
  // — acronyme couvert par la collection de synonymes : "mco" (Marion, OK)
  generateAlgoliaFixture({
    url_id: "formation-mco",
    type: "formation",
    type_filter_label: "Formations",
    title: "BTS Management Commercial Opérationnel",
    description: "Formation en alternance au management commercial.",
    keywords: null,
    rome_labels: ["Management relation clientèle"],
    organization_name: "CFA Commerce",
  }),
  // — acronyme ambigu "esf" (Claire, KO — le fuzzy remontait des offres d'analyste ESG)
  generateAlgoliaFixture({
    url_id: "offre-esf",
    title: "Conseiller en économie sociale et familiale",
    description: "Accompagnement social des familles.",
    keywords: null,
    rome_labels: ["Action sociale"],
    organization_name: "AssoSociale",
  }),
  generateAlgoliaFixture({
    url_id: "offre-esg",
    title: "Analyste ESG",
    description: "Analyse extra-financière pour une banque.",
    keywords: null,
    rome_labels: ["Analyse financière"],
    organization_name: "BigBank",
  }),
  // — nom d'entreprise : "sncf" (Marion, OK) + piège mention en description
  generateAlgoliaFixture({
    url_id: "offre-sncf",
    title: "Technicien signalisation ferroviaire",
    description: "Entretien des installations de signalisation.",
    keywords: ["ferroviaire"],
    rome_labels: ["Signalisation ferroviaire"],
    organization_name: "SNCF Voyageurs",
  }),
  generateAlgoliaFixture({
    url_id: "offre-mention-sncf",
    title: "Chargé de partenariats",
    description: "Développement de partenariats avec la SNCF.",
    keywords: null,
    rome_labels: ["Développement commercial"],
    organization_name: "MobilityCo",
  }),
  // — métier simple : "plombier" (Claire, OK) + piège hors-sujet (Aurélie voyait des
  //   fleuristes remonter sur "plomberie au Mans")
  generateAlgoliaFixture({
    url_id: "offre-plombier",
    title: "Plombier / Plombière sanitaire",
    description: "Installation et dépannage sanitaire.",
    keywords: ["plomberie"],
    rome_labels: ["Installation d'équipements sanitaires et thermiques"],
    organization_name: "PlombExpress",
  }),
  generateAlgoliaFixture({
    url_id: "offre-fleuriste",
    title: "Fleuriste",
    description: "Composition florale en boutique.",
    keywords: null,
    rome_labels: ["Fleuriste"],
    organization_name: "FloraShop",
  }),
  // — intitulé métier multi-mots exact (Fadoua, OK)
  generateAlgoliaFixture({
    url_id: "offre-animateur",
    title: "Animateur socioculturel / Animatrice socioculturelle",
    description: "Animation d'ateliers pour un public jeune.",
    keywords: null,
    rome_labels: ["Animation socioculturelle"],
    organization_name: "AssoJeunesse",
  }),
  // — tri par date vs pertinence (Fadoua, KO — "assistant ressources humaines" + tri date
  //   remontait "Apprenti Boucher" en tête)
  generateAlgoliaFixture({
    url_id: "offre-rh",
    title: "Assistant ressources humaines",
    description: "Gestion administrative du personnel.",
    keywords: ["rh"],
    rome_labels: ["Assistanat en ressources humaines"],
    organization_name: "PeopleCorp",
    publication_date: new Date("2025-01-10T10:00:00.000Z"),
  }),
  generateAlgoliaFixture({
    url_id: "offre-boucher",
    title: "Apprenti Boucher",
    description: "Préparation des viandes et gestion des ressources du magasin.",
    keywords: null,
    rome_labels: ["Boucherie"],
    organization_name: "BoucherieDuCoin",
    publication_date: new Date("2025-06-01T10:00:00.000Z"),
  }),
  // — mot incomplet / abréviation : "compta" (Marion, KO), "elec" (Aurélie, Mitigé)
  generateAlgoliaFixture({
    url_id: "offre-comptable",
    title: "Assistant comptable",
    description: "Saisie comptable et rapprochements bancaires.",
    keywords: ["comptabilité"],
    rome_labels: ["Comptabilité"],
    organization_name: "FiduPlus",
    publication_date: new Date("2025-01-05T10:00:00.000Z"),
  }),
  // — nom de poste hors libellés d'offres : "vigile" (Marion, KO en prod — le mécanisme
  //   keywords doit permettre de le couvrir)
  generateAlgoliaFixture({
    url_id: "offre-securite",
    title: "Agent de sécurité",
    description: "Surveillance de site industriel.",
    keywords: ["vigile", "surveillance"],
    rome_labels: ["Sécurité et surveillance privées"],
    organization_name: "SecuriGard",
  }),
  // — intitulé exact long (Jérémy, KO : "Apprenti cadreur / Monteur H/F") + piège "monteur"
  generateAlgoliaFixture({
    url_id: "offre-cadreur",
    title: "Apprenti cadreur / Monteur H/F",
    description: "Tournage et montage vidéo.",
    keywords: ["vidéo", "montage"],
    rome_labels: ["Image cinématographique et télévisuelle"],
    organization_name: "ProdVideo",
  }),
  generateAlgoliaFixture({
    url_id: "offre-monteur-reseaux",
    title: "Monteur réseaux électriques",
    description: "Raccordements et travaux électriques.",
    keywords: null,
    rome_labels: ["Électricité bâtiment"],
    organization_name: "ElecRéseaux",
  }),
  // — multi-mots "chargé de déploiement" (Marion, KO — remontait "chargé de recrutement",
  //   "chargée de communication", "chargé d'accueil"...)
  generateAlgoliaFixture({
    url_id: "offre-deploiement",
    title: "Chargé de déploiement",
    description: "Déploiement d'outils informatiques chez les clients.",
    keywords: null,
    rome_labels: ["Déploiement de solutions informatiques"],
    organization_name: "ITServices",
  }),
  generateAlgoliaFixture({
    url_id: "offre-charge-recrutement",
    title: "Chargé de recrutement",
    description: "Sourcing et entretiens candidats.",
    keywords: null,
    rome_labels: ["Recrutement"],
    organization_name: "TalentHunt",
  }),
  generateAlgoliaFixture({
    url_id: "offre-charge-communication",
    title: "Chargée de communication",
    description: "Communication interne et externe.",
    keywords: null,
    rome_labels: ["Communication"],
    organization_name: "ComAgency",
  }),
  // — "zéro résultat honnête" (Fadoua, KO : "IMAGERIE MEDICALE ET RADIOLOGIE THERAPEUTIQUE"
  //   remontait des offres réglementaires / communication au lieu de 0 résultat)
  generateAlgoliaFixture({
    url_id: "offre-dispositifs-medicaux",
    title: "Assistant affaires réglementaires",
    description: "Dispositifs médicaux de diagnostic in vitro.",
    keywords: null,
    rome_labels: ["Affaires réglementaires"],
    organization_name: "MedRegul",
    publication_date: new Date("2025-01-03T10:00:00.000Z"),
  }),
  // — sélection d'une suggestion d'autocomplete : intitulé ROME complet avec doublet
  //   masculin/féminin (Aurélie, KO — "Cuisinier / Cuisinière à domicile" remontait des
  //   conducteurs PL ; même pattern : "Moniteur éducateur / Monitrice éducatrice",
  //   "Alternant Charpentier / Charpentière")
  generateAlgoliaFixture({
    url_id: "offre-cuisinier-domicile",
    title: "Cuisinier / Cuisinière à domicile",
    description: "Préparation de repas au domicile des clients.",
    keywords: ["cuisine"],
    rome_labels: ["Personnel polyvalent en restauration"],
    organization_name: "ChefChezVous",
  }),
  generateAlgoliaFixture({
    url_id: "offre-aide-domicile",
    title: "Aide à domicile",
    description: "Accompagnement de personnes âgées à leur domicile.",
    keywords: null,
    rome_labels: ["Services domestiques"],
    organization_name: "DomiServices",
  }),
  // — géo : tri par proximité (Aurélie : offres IDF avant Paris) et rayon
  generateAlgoliaFixture({
    url_id: "offre-versailles",
    title: "Vendeur en boulangerie",
    description: "Vente en boutique.",
    keywords: null,
    rome_labels: ["Vente alimentaire"],
    organization_name: "BoulangerieV",
    address: "Versailles",
    location: { type: "Point", coordinates: [2.1301, 48.8044] },
  }),
  generateAlgoliaFixture({
    url_id: "offre-marseille",
    title: "Serveur en restauration",
    description: "Service en salle.",
    keywords: null,
    rome_labels: ["Service en restauration"],
    organization_name: "RestoSud",
    address: "Marseille",
    location: { type: "Point", coordinates: [5.405, 43.282] },
  }),
]

// Groupes de synonymes minimaux pour reproduire les cas "acronymes" de la recette.
// NB : l'analyzer de la collection de synonymes est lucene.standard (pas de folding
// d'accents) → les entrées doivent être accentuées comme les documents.
const SYNONYMS = [
  { _id: new ObjectId(), mappingType: "equivalent" as const, synonyms: ["management commercial", "mco"] },
  { _id: new ObjectId(), mappingType: "equivalent" as const, synonyms: ["économie sociale et familiale", "esf"] },
]

async function seedCorpus() {
  await getDbCollection("algolia").insertMany(CORPUS)
  await getDbCollection("search_synonyms").insertMany(SYNONYMS)
}

// L'indexation mongot est asynchrone : on attend que le corpus complet soit visible
// via $search avant de lancer les assertions.
async function waitForSearchIndexSync(expected: number, timeoutMs = 120_000) {
  const start = Date.now()
  for (;;) {
    try {
      const { nbHits } = await search({ hitsPerPage: 1 })
      if (nbHits >= expected) return
    } catch {
      // index pas encore créé côté mongot → on réessaie
    }
    if (Date.now() - start > timeoutMs) {
      throw new Error(`mongot n'a pas indexé les ${expected} documents du corpus en ${timeoutMs}ms — la stack locale (mongodb + mongot) tourne-t-elle ?`)
    }
    await new Promise((resolve) => setTimeout(resolve, 1_000))
  }
}

type SearchParams = Parameters<typeof searchAlgolia>[0]

function search(params: Partial<SearchParams> = {}) {
  return searchAlgolia({ radius: 30, page: 0, hitsPerPage: 50, ...params })
}

type SearchResult = Awaited<ReturnType<typeof searchAlgolia>>

const ids = (result: SearchResult) => result.hits.map((h) => h.url_id)
const rankOf = (result: SearchResult, urlId: string) => ids(result).indexOf(urlId)

describe.runIf(RUN_RELEVANCE)("search-result — pertinence du moteur de recherche", () => {
  useMongo(seedCorpus, "beforeAll")

  beforeAll(async () => {
    await createSearchIndexes()
    await waitForSearchIndexSync(CORPUS.length)
  }, 150_000)

  // ──────────────────────────────────────────────────────────────────────────
  // 1. NON-RÉGRESSION — validés OK en recette, doivent rester verts.
  // ──────────────────────────────────────────────────────────────────────────
  describe("non-régression (OK en recette)", () => {
    it("corrige une faute d'orthographe : 'maintenace' → offres de maintenance [Marion]", async () => {
      const result = await search({ q: "maintenace" })

      expect(rankOf(result, "offre-maintenance")).toBe(0)
    })

    it("trouve un métier simple sans bruit hors-sujet : 'plombier' [Claire / Aurélie]", async () => {
      const result = await search({ q: "plombier" })

      expect(rankOf(result, "offre-plombier")).toBe(0)
      expect(ids(result)).not.toContain("offre-fleuriste")
    })

    it("nom d'entreprise : 'sncf' → les offres de l'employeur remontent [Marion]", async () => {
      const result = await search({ q: "sncf" })

      expect(ids(result)).toContain("offre-sncf")
    })

    it("acronyme couvert par les synonymes : 'mco' → BTS Management Commercial Opérationnel [Marion]", async () => {
      const result = await search({ q: "mco" })

      expect(ids(result)).toContain("formation-mco")
    })

    it("nom de poste couvert par les keywords : 'vigile' → agent de sécurité [Marion]", async () => {
      const result = await search({ q: "vigile" })

      expect(rankOf(result, "offre-securite")).toBe(0)
    })

    it("intitulé multi-mots exact : 'Animateur socioculturel / Animatrice socioculturelle' en tête [Fadoua]", async () => {
      const result = await search({ q: "Animateur socioculturel / Animatrice socioculturelle" })

      expect(rankOf(result, "offre-animateur")).toBe(0)
    })

    it("sélection d'autocomplete (intitulé ROME avec doublet M/F) : 'Cuisinier / Cuisinière à domicile' → l'offre exacte en tête [Aurélie]", async () => {
      const result = await search({ q: "Cuisinier / Cuisinière à domicile" })

      expect(rankOf(result, "offre-cuisinier-domicile")).toBe(0)
    })

    it("intitulé exact d'offre : 'Apprenti cadreur / Monteur H/F' → l'offre exacte en 1ère position [Jérémy]", async () => {
      const result = await search({ q: "Apprenti cadreur / Monteur H/F" })

      expect(rankOf(result, "offre-cadreur")).toBe(0)
    })

    it("multi-mots avec doc full-match : 'chargé de déploiement' en tête devant les 'chargé de …' [Marion]", async () => {
      const result = await search({ q: "chargé de déploiement" })

      expect(rankOf(result, "offre-deploiement")).toBe(0)
    })

    it("priorité au titre sur la description : 'commerce' → conseiller de vente avant le dev e-commerce [Marion]", async () => {
      const result = await search({ q: "commerce" })

      const conseiller = rankOf(result, "offre-conseiller-commerce")
      const devEcommerce = rankOf(result, "offre-dev-ecommerce")
      expect(conseiller).toBeGreaterThanOrEqual(0)
      expect(devEcommerce === -1 || conseiller < devEcommerce).toBe(true)
    })

    it("filtre par type : q='commerce' + type=formation → uniquement la formation MCO", async () => {
      const result = await search({ q: "commerce", type: "formation" })

      expect(ids(result)).toEqual(["formation-mco"])
    })

    it("filtre géo (rayon) : recherche à Paris rayon 30 km exclut Marseille et garde Versailles", async () => {
      const result = await search({ ...PARIS })

      expect(ids(result)).not.toContain("offre-marseille")
      expect(ids(result)).toContain("offre-versailles")
      expect(result.nbHits).toBe(CORPUS.length - 1)
    })

    it("tri par proximité : les documents remontent du plus proche au plus lointain [Aurélie]", async () => {
      const result = await search({ ...PARIS, radius: 1_000, sort: "proximity" })

      const resultIds = ids(result)
      // Marseille (~660 km) en dernier, Versailles (~17 km) juste avant — tous
      // les autres documents du corpus sont au centre de Paris.
      expect(resultIds.at(-1)).toBe("offre-marseille")
      expect(resultIds.at(-2)).toBe("offre-versailles")
    })

    it("calcule la distance quand une géolocalisation est fournie", async () => {
      const result = await search({ ...PARIS, q: "plombier" })

      const hit = result.hits.find((h) => h.url_id === "offre-plombier")
      expect(hit?.distance).toBeTypeOf("number")
    })

    it("pagine correctement (nbHits / nbPages)", async () => {
      const result = await search({ hitsPerPage: 5 })

      expect(result.nbHits).toBe(CORPUS.length)
      expect(result.nbPages).toBe(Math.ceil(CORPUS.length / 5))
      expect(result.hits).toHaveLength(5)
    })

    it("autocomplétion : 'compta' suggère l'intitulé comptable [Aurélie — suggestions jugées pertinentes]", async () => {
      const { suggestions } = await suggestAlgolia({ q: "compta", limit: 5 })

      expect(suggestions.some((s) => s.toLowerCase().includes("comptab"))).toBe(true)
    })

    it("autocomplétion : insensible aux accents ('develo' → Développeur web)", async () => {
      const { suggestions } = await suggestAlgolia({ q: "develo", limit: 5 })

      expect(suggestions.some((s) => s.toLowerCase().includes("développeur"))).toBe(true)
    })
  })

  // ──────────────────────────────────────────────────────────────────────────
  // 2. CIBLES D'AMÉLIORATION — KO / Mitigé en recette.
  // `it.fails` = le test décrit le comportement CIBLE et échoue aujourd'hui.
  // Quand une modification du moteur corrige le cas, vitest signale le test :
  // retirer alors le `.fails` pour le promouvoir en non-régression.
  // ──────────────────────────────────────────────────────────────────────────
  describe("cibles d'amélioration (KO / Mitigé en recette)", () => {
    it.fails("couverture multi-termes : 'product manager' ne remonte pas les docs ne matchant qu'un seul terme [Marion, KO]", async () => {
      const result = await search({ q: "product manager" })

      // Aujourd'hui : minimumShouldMatch=1 → 'Product Designer' et 'Assistant manager'
      // polluent les résultats. Cible : quand un document matche tous les termes,
      // les documents 1-terme ne doivent pas remonter (ou nettement après).
      expect(ids(result)).not.toContain("offre-product-designer")
      expect(ids(result)).not.toContain("offre-assistant-manager")
    })

    it.fails("couverture multi-termes : 'chargé de déploiement' ne remonte pas les autres 'chargé de …' [Marion, KO]", async () => {
      const result = await search({ q: "chargé de déploiement" })

      expect(ids(result)).not.toContain("offre-charge-recrutement")
      expect(ids(result)).not.toContain("offre-charge-communication")
    })

    it.fails("nom d'entreprise : l'offre de l'employeur avant les offres qui le mentionnent en description [Marion]", async () => {
      const result = await search({ q: "sncf" })

      // Aujourd'hui : la mention en description (boost 2, mais champ court → TF/IDF fort)
      // passe devant le match employeur (organization_name, boost 3). Cible : le match
      // sur l'employeur doit dominer les simples mentions.
      const employeur = rankOf(result, "offre-sncf")
      const mention = rankOf(result, "offre-mention-sncf")
      expect(employeur).toBeGreaterThanOrEqual(0)
      expect(mention === -1 || employeur < mention).toBe(true)
    })

    it.fails("acronyme ambigu : 'esf' privilégie le synonyme exact (économie sociale et familiale) sur le fuzzy 'ESG' [Claire, KO]", async () => {
      const result = await search({ q: "esf" })

      // Aujourd'hui : le fuzzy (maxEdits 1) sur le titre 'Analyste ESG' (boost 7) écrase
      // la clause synonymes (boost 1). Cible : le match par synonyme exact doit dominer.
      const esf = rankOf(result, "offre-esf")
      const esg = rankOf(result, "offre-esg")
      expect(esf).toBeGreaterThanOrEqual(0)
      expect(esg === -1 || esf < esg).toBe(true)
    })

    it.fails("abréviation / mot incomplet : 'compta' trouve les offres comptables (comme l'autocomplétion) [Marion, KO]", async () => {
      const result = await search({ q: "compta" })

      // Aujourd'hui : 'compta' → 'comptable' dépasse maxEdits=1 et l'opérateur text
      // ne fait pas de préfixe → 0 résultat pertinent. Cible : aligner la recherche
      // sur le comportement préfixe de l'autocomplétion (ou synonymes d'abréviations).
      expect(ids(result)).toContain("offre-comptable")
    })

    it.fails("tri par date filtré par pertinence : 'assistant ressources humaines' + sort=date ne remonte pas 'Apprenti Boucher' en tête [Fadoua, KO]", async () => {
      const result = await search({ q: "assistant ressources humaines", sort: "date" })

      // Aujourd'hui : le tri par date s'applique à TOUS les docs matchant au moins
      // une clause ('ressources' dans la description du boucher suffit) → l'offre la
      // plus récente gagne quel que soit son score. Cible : ne trier par date que des
      // résultats suffisamment pertinents.
      expect(ids(result)[0]).toBe("offre-rh")
    })

    it.fails("zéro résultat honnête : une requête sans document pertinent renvoie 0 hit plutôt que du bruit [Fadoua, KO]", async () => {
      const result = await search({ q: "imagerie médicale et radiologie thérapeutique" })

      // Aujourd'hui : 'médicale' matche (stemming) la description "Dispositifs médicaux…"
      // → des résultats non pertinents remontent. Cible : en dessous d'un seuil de
      // couverture des termes, préférer 0 résultat (question produit ouverte en recette).
      expect(result.nbHits).toBe(0)
    })

    it.fails("sélection d'autocomplete : 'Cuisinier / Cuisinière à domicile' ne remonte pas les docs ne matchant que 'domicile' [Aurélie, KO]", async () => {
      const result = await search({ q: "Cuisinier / Cuisinière à domicile" })

      // Aujourd'hui : le doublet masculin/féminin des intitulés ROME gonfle le nombre de
      // termes et 'domicile' seul suffit à matcher (minimumShouldMatch=1) → conducteurs PL,
      // aides à domicile... Cible : dédupliquer les termes normalisés (cuisinier ≈ cuisinière)
      // et exiger la couverture du terme métier.
      expect(ids(result)).not.toContain("offre-aide-domicile")
    })

    it.fails("requête spécifique multi-domaines : 'monteur vidéo' privilégie l'audiovisuel sur le BTP/élec [Jérémy, KO]", async () => {
      const result = await search({ q: "monteur vidéo" })

      // Aujourd'hui : 'Monteur réseaux électriques' matche 'monteur' (titre, boost 7)
      // et concurrence le doc full-match. Cible : la couverture des deux termes doit
      // l'emporter nettement.
      expect(rankOf(result, "offre-cadreur")).toBe(0)
      expect(ids(result)).not.toContain("offre-monteur-reseaux")
    })
  })
})
