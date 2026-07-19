import { useMongo } from "@tests/utils/mongo.test.utils"
import { ObjectId } from "mongodb"
import { generateSearchItemFixture } from "shared/fixtures/searchItems.fixture"
import { beforeAll, describe, expect, it } from "vitest"
import { createSearchIndexes, getDbCollection } from "@/common/utils/mongodbUtils"
import { searchItems, suggestSearchTerms } from "@/services/search/search.service"

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
 *  2. "corrigés par la refonte Phase 1" : ex-KO/Mitigé de la recette, corrigés par la porte
 *     de pertinence (couverture par terme + minimumShouldMatch dynamique) et promus en
 *     non-régression. Convention pour les futures cibles : les écrire en `it.fails`
 *     (le test décrit le comportement CIBLE, il est vert tant que le défaut existe, et
 *     passe au rouge quand une modif le corrige → retirer alors le `.fails`).
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
  generateSearchItemFixture({
    url_id: "offre-maintenance",
    title: "Technicien de maintenance industrielle",
    description: "Interventions de maintenance préventive et corrective sur les lignes de production.",
    keywords: ["maintenance", "industrie"],
    rome_labels: ["Maintenance industrielle"],
    organization_name: "Industria",
  }),
  // — multi-mots "product manager" (Marion, KO) : le doc full-match...
  generateSearchItemFixture({
    url_id: "offre-product-manager",
    title: "Product Manager",
    description: "Gestion de la roadmap produit et des priorités.",
    keywords: ["produit", "roadmap"],
    rome_labels: ["Management et gestion de produit"],
    organization_name: "StartupTech",
  }),
  // ...et ses pièges 1-terme ("product" seul / "manager" seul)
  generateSearchItemFixture({
    url_id: "offre-product-designer",
    title: "Product Designer",
    description: "Conception d'interfaces utilisateur.",
    keywords: ["design"],
    rome_labels: ["Design d'interfaces"],
    organization_name: "StudioX",
  }),
  generateSearchItemFixture({
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
  generateSearchItemFixture({
    url_id: "offre-conseiller-commerce",
    title: "Conseiller de vente en commerce",
    description: "Accueil et conseil client en boutique.",
    keywords: ["vente", "boutique"],
    rome_labels: ["Vente en habillement et accessoires de la personne"],
    organization_name: "ModeStore",
  }),
  generateSearchItemFixture({
    url_id: "offre-dev-ecommerce",
    title: "Développeur web",
    description: "Développement d'un site de e-commerce pour un grand retailer.",
    keywords: ["javascript"],
    rome_labels: ["Développement informatique"],
    organization_name: "WebAgency",
  }),
  // — acronyme couvert par la collection de synonymes : "mco" (Marion, OK)
  generateSearchItemFixture({
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
  generateSearchItemFixture({
    url_id: "offre-esf",
    title: "Conseiller en économie sociale et familiale",
    description: "Accompagnement social des familles.",
    keywords: null,
    rome_labels: ["Action sociale"],
    organization_name: "AssoSociale",
  }),
  generateSearchItemFixture({
    url_id: "offre-esg",
    title: "Analyste ESG",
    description: "Analyse extra-financière pour une banque.",
    keywords: null,
    rome_labels: ["Analyse financière"],
    organization_name: "BigBank",
  }),
  // — nom d'entreprise : "sncf" (Marion, OK) + piège mention en description
  generateSearchItemFixture({
    url_id: "offre-sncf",
    title: "Technicien signalisation ferroviaire",
    description: "Entretien des installations de signalisation.",
    keywords: ["ferroviaire"],
    rome_labels: ["Signalisation ferroviaire"],
    organization_name: "SNCF Voyageurs",
  }),
  generateSearchItemFixture({
    url_id: "offre-mention-sncf",
    title: "Chargé de partenariats",
    description: "Développement de partenariats avec la SNCF.",
    keywords: null,
    rome_labels: ["Développement commercial"],
    organization_name: "MobilityCo",
  }),
  // — métier simple : "plombier" (Claire, OK) + piège hors-sujet (Aurélie voyait des
  //   fleuristes remonter sur "plomberie au Mans")
  generateSearchItemFixture({
    url_id: "offre-plombier",
    title: "Plombier / Plombière sanitaire",
    description: "Installation et dépannage sanitaire.",
    keywords: ["plomberie"],
    rome_labels: ["Installation d'équipements sanitaires et thermiques"],
    organization_name: "PlombExpress",
  }),
  generateSearchItemFixture({
    url_id: "offre-fleuriste",
    title: "Fleuriste",
    description: "Composition florale en boutique.",
    keywords: null,
    rome_labels: ["Fleuriste"],
    organization_name: "FloraShop",
  }),
  // — intitulé métier multi-mots exact (Fadoua, OK)
  generateSearchItemFixture({
    url_id: "offre-animateur",
    title: "Animateur socioculturel / Animatrice socioculturelle",
    description: "Animation d'ateliers pour un public jeune.",
    keywords: null,
    rome_labels: ["Animation socioculturelle"],
    organization_name: "AssoJeunesse",
  }),
  // — tri par date vs pertinence (Fadoua, KO — "assistant ressources humaines" + tri date
  //   remontait "Apprenti Boucher" en tête)
  generateSearchItemFixture({
    url_id: "offre-rh",
    title: "Assistant ressources humaines",
    description: "Gestion administrative du personnel.",
    keywords: ["rh"],
    rome_labels: ["Assistanat en ressources humaines"],
    organization_name: "PeopleCorp",
    publication_date: new Date("2025-01-10T10:00:00.000Z"),
  }),
  generateSearchItemFixture({
    url_id: "offre-boucher",
    title: "Apprenti Boucher",
    description: "Préparation des viandes et gestion des ressources du magasin.",
    keywords: null,
    rome_labels: ["Boucherie"],
    organization_name: "BoucherieDuCoin",
    publication_date: new Date("2025-06-01T10:00:00.000Z"),
  }),
  // — mot incomplet / abréviation : "compta" (Marion, KO), "elec" (Aurélie, Mitigé)
  generateSearchItemFixture({
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
  generateSearchItemFixture({
    url_id: "offre-securite",
    title: "Agent de sécurité",
    description: "Surveillance de site industriel.",
    keywords: ["vigile", "surveillance"],
    rome_labels: ["Sécurité et surveillance privées"],
    organization_name: "SecuriGard",
  }),
  // — intitulé exact long (Jérémy, KO : "Apprenti cadreur / Monteur H/F") + piège "monteur"
  generateSearchItemFixture({
    url_id: "offre-cadreur",
    title: "Apprenti cadreur / Monteur H/F",
    description: "Tournage et montage vidéo.",
    keywords: ["vidéo", "montage"],
    rome_labels: ["Image cinématographique et télévisuelle"],
    organization_name: "ProdVideo",
  }),
  generateSearchItemFixture({
    url_id: "offre-monteur-reseaux",
    title: "Monteur réseaux électriques",
    description: "Raccordements et travaux électriques.",
    keywords: null,
    rome_labels: ["Électricité bâtiment"],
    organization_name: "ElecRéseaux",
  }),
  // — multi-mots "chargé de déploiement" (Marion, KO — remontait "chargé de recrutement",
  //   "chargée de communication", "chargé d'accueil"...)
  generateSearchItemFixture({
    url_id: "offre-deploiement",
    title: "Chargé de déploiement",
    description: "Déploiement d'outils informatiques chez les clients.",
    keywords: null,
    rome_labels: ["Déploiement de solutions informatiques"],
    organization_name: "ITServices",
  }),
  generateSearchItemFixture({
    url_id: "offre-charge-recrutement",
    title: "Chargé de recrutement",
    description: "Sourcing et entretiens candidats.",
    keywords: null,
    rome_labels: ["Recrutement"],
    organization_name: "TalentHunt",
  }),
  generateSearchItemFixture({
    url_id: "offre-charge-communication",
    title: "Chargée de communication",
    description: "Communication interne et externe.",
    keywords: null,
    rome_labels: ["Communication"],
    organization_name: "ComAgency",
  }),
  // — "zéro résultat honnête" (Fadoua, KO : "IMAGERIE MEDICALE ET RADIOLOGIE THERAPEUTIQUE"
  //   remontait des offres réglementaires / communication au lieu de 0 résultat)
  generateSearchItemFixture({
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
  generateSearchItemFixture({
    url_id: "offre-cuisinier-domicile",
    title: "Cuisinier / Cuisinière à domicile",
    description: "Préparation de repas au domicile des clients.",
    keywords: ["cuisine"],
    rome_labels: ["Personnel polyvalent en restauration"],
    organization_name: "ChefChezVous",
  }),
  generateSearchItemFixture({
    url_id: "offre-aide-domicile",
    title: "Aide à domicile",
    description: "Accompagnement de personnes âgées à leur domicile.",
    keywords: null,
    rome_labels: ["Services domestiques"],
    organization_name: "DomiServices",
  }),
  // — filtre niveau inclusif : un doc SANS niveau précisé ("" — recruteurs, offres partenaires
  //   sans diplôme cible, ~83 % du corpus réel) doit remonter quel que soit le niveau coché
  generateSearchItemFixture({
    url_id: "offre-sans-niveau",
    title: "Agent polyvalent de restauration",
    description: "Polyvalence en restauration collective.",
    keywords: null,
    rome_labels: ["Personnel polyvalent en restauration"],
    organization_name: "CollectivRest",
    level: "",
  }),
  // — géo : tri par proximité (Aurélie : offres IDF avant Paris) et rayon
  generateSearchItemFixture({
    url_id: "offre-versailles",
    title: "Vendeur en boulangerie",
    description: "Vente en boutique.",
    keywords: null,
    rome_labels: ["Vente alimentaire"],
    organization_name: "BoulangerieV",
    address: "Versailles",
    location: { type: "Point", coordinates: [2.1301, 48.8044] },
  }),
  generateSearchItemFixture({
    url_id: "offre-marseille",
    title: "Serveur en restauration",
    description: "Service en salle.",
    keywords: null,
    rome_labels: ["Service en restauration"],
    organization_name: "RestoSud",
    address: "Marseille",
    location: { type: "Point", coordinates: [5.405, 43.282] },
    // Contre-exemple du filtre niveau inclusif : niveau 3, ne doit PAS remonter sur niveau 6.
    level: "3",
  }),
  // — recette #2 : fuzzy sur nom d'entreprise ("vigile" remontait VIGIER, VIRGILE, VIEILLE…).
  //   Recruteur à 1 édition de "vigile", sans lien avec la sécurité → ne doit jamais matcher.
  generateSearchItemFixture({
    url_id: "recruteur-vigier",
    // Comme en prod (generateSearchItemsCollection) : les recruteurs sont des docs type
    // "offre", distingués par sub_type/is_algo_company.
    type: "offre",
    type_filter_label: "Candidature spontanée",
    sub_type: "recruteurs_lba",
    title: "Plomberie générale",
    description: "",
    keywords: ["plomberie"],
    rome_labels: ["Installation d'équipements sanitaires et thermiques"],
    organization_name: "VIGIER PLOMBERIE",
    publication_date: new Date("2026-07-12T08:14:04.000Z"),
    is_algo_company: true,
  }),
  // — recette #2 : tri par date pollué par les recruteurs (publication_date = date d'import,
  //   plus récente que toutes les offres) [Fadoua, "Assistant RH" et "Prothèses" en tri date].
  generateSearchItemFixture({
    url_id: "recruteur-travaux",
    type: "offre",
    type_filter_label: "Candidature spontanée",
    sub_type: "recruteurs_lba",
    title: "Conduite de travaux",
    description: "",
    keywords: ["chantier"],
    rome_labels: ["Conduite de travaux du BTP et de travaux paysagers"],
    organization_name: "TRAVAUX EXPRESS",
    publication_date: new Date("2026-07-12T08:14:04.000Z"),
    is_algo_company: true,
  }),
  generateSearchItemFixture({
    url_id: "offre-conducteur-travaux",
    title: "Conducteur de travaux",
    description: "Pilotage de chantiers de construction.",
    keywords: ["chantier", "btp"],
    rome_labels: ["Conduite de travaux du BTP et de travaux paysagers"],
    organization_name: "BTP Construction",
    publication_date: new Date("2026-05-01T00:00:00.000Z"),
  }),
  // — recette #2 : la couverture par description suffisait à passer la porte → traîne
  //   d'incohérents ["chargé de déploiement" remontait du cross-marketing, Marion].
  generateSearchItemFixture({
    url_id: "offre-marketing-deploiement-desc",
    title: "Chargé de mission marketing",
    description: "Participation au déploiement de la stratégie marketing en magasin.",
    keywords: ["marketing"],
    rome_labels: ["Marketing"],
    organization_name: "RetailCorp",
  }),
  // — champs contrat (issus de jobs_partners) : une offre éligible handicap avec date de
  //   démarrage précise, face à offre-conducteur-travaux (même métier, false/null par défaut).
  generateSearchItemFixture({
    url_id: "offre-travaux-handi",
    title: "Assistant conducteur de travaux",
    description: "Suivi de chantiers, poste ouvert aux personnes en situation de handicap.",
    keywords: ["chantier", "btp"],
    rome_labels: ["Conduite de travaux du BTP et de travaux paysagers"],
    organization_name: "BTP Inclusif",
    is_disabled_elligible: true,
    start_date: new Date("2026-09-01T00:00:00.000Z"),
    start_type: "precise_date",
  }),
  // Même métier, démarrage plus tôt : borne du filtre start_date ($lte).
  generateSearchItemFixture({
    url_id: "offre-travaux-aout",
    title: "Conducteur de travaux junior",
    description: "Encadrement de chantiers, démarrage en août.",
    keywords: ["chantier", "btp"],
    rome_labels: ["Conduite de travaux du BTP et de travaux paysagers"],
    organization_name: "BTP Rapide",
    start_date: new Date("2026-08-01T00:00:00.000Z"),
    start_type: "precise_date",
    application_count: 0,
  }),
  // Date de démarrage lointaine mais FLEXIBLE : toujours affichée quel que soit le filtre date.
  generateSearchItemFixture({
    url_id: "offre-travaux-flexible",
    title: "Conducteur de travaux principal",
    description: "Gestion de chantiers, date de démarrage flexible.",
    keywords: ["chantier", "btp"],
    rome_labels: ["Conduite de travaux du BTP et de travaux paysagers"],
    organization_name: "BTP Souple",
    start_date: new Date("2026-12-01T00:00:00.000Z"),
    start_type: "precise_date",
    is_start_flexible: true,
    application_count: 12,
  }),
  // — mode « Emplois avec formation incluse » : offre émise par un CFA (is_delegated) ou un
  //   GEIQ → exclue du mode « emplois », seule renvoyée par « emplois_formation ». Porte aussi
  //   smart_apply pour le filtre « Candidature simplifiée ».
  generateSearchItemFixture({
    url_id: "offre-travaux-cfa",
    type_filter_label: "Offres d'emploi postées par des écoles",
    title: "Conducteur de travaux avec formation incluse",
    description: "Contrat d'apprentissage : l'offre est associée à une formation au CFA.",
    keywords: ["chantier", "btp"],
    rome_labels: ["Conduite de travaux du BTP et de travaux paysagers"],
    organization_name: "CFA du BTP",
    is_formation_included: true,
    smart_apply: true,
  }),
]

// Groupes de synonymes minimaux pour reproduire les cas "acronymes" de la recette.
// NB : l'analyzer de la collection de synonymes est lucene.standard (pas de folding
// d'accents) → les entrées doivent être accentuées comme les documents.
const SYNONYMS = [
  { _id: new ObjectId(), mappingType: "equivalent" as const, synonyms: ["management commercial", "mco"] },
  { _id: new ObjectId(), mappingType: "equivalent" as const, synonyms: ["économie sociale et familiale", "esf"] },
  // recette #2 : synonyme métier absent du référentiel (présent aussi dans le seed docs/mongodb/search-synonyms.json)
  { _id: new ObjectId(), mappingType: "equivalent" as const, synonyms: ["vigile", "agent de sécurité", "agente de sécurité"] },
]

// Suggestions issues des recherches utilisateurs (job analyzeSearchQueries) : une active
// (doit être servie), une disabled (ne doit jamais l'être), une dupliquée d'un title du
// corpus (la dédup doit la fusionner). Requête de test : préfixe "boulanger".
const suggestionFixture = (term: string, status: "active" | "disabled") => ({
  _id: new ObjectId(),
  term,
  normalized: term.toLowerCase(),
  origin: "user_queries" as const,
  status,
  rejection_reason: null,
  category: "metier" as const,
  counters: { total_30d: 25, days_seen_30d: 8, zero_hits_30d: 1, free_text_30d: 20, median_nb_hits: 40 },
  confidence: 0.9,
  run_id: "test-run",
  created_at: new Date("2026-07-01T00:00:00.000Z"),
  last_seen_at: new Date("2026-07-10T00:00:00.000Z"),
})

const USER_SUGGESTIONS = [
  suggestionFixture("Boulangerie artisanale", "active"),
  suggestionFixture("Boulangerie industrielle", "disabled"),
  suggestionFixture("Vendeur en boulangerie", "active"),
]

async function seedCorpus() {
  await getDbCollection("search_items").insertMany(CORPUS)
  await getDbCollection("search_synonyms").insertMany(SYNONYMS)
  await getDbCollection("search_suggestions").insertMany(USER_SUGGESTIONS)
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

// Attend que l'index search de `search_suggestions` serve la suggestion active du seed.
async function waitForSuggestionIndexSync(timeoutMs = 120_000) {
  const start = Date.now()
  for (;;) {
    try {
      const { suggestions } = await suggestSearchTerms({ q: "boulangerie artisanale", limit: 5 })
      if (suggestions.includes("Boulangerie artisanale")) return
    } catch {
      // index pas encore créé côté mongot → on réessaie
    }
    if (Date.now() - start > timeoutMs) {
      throw new Error(`mongot n'a pas indexé search_suggestions en ${timeoutMs}ms`)
    }
    await new Promise((resolve) => setTimeout(resolve, 1_000))
  }
}

type SearchParams = Parameters<typeof searchItems>[0]

function search(params: Partial<SearchParams> = {}) {
  return searchItems({ radius: 30, page: 0, hitsPerPage: 50, ...params })
}

type SearchResult = Awaited<ReturnType<typeof searchItems>>

const ids = (result: SearchResult) => result.hits.map((h) => h.url_id)
const rankOf = (result: SearchResult, urlId: string) => ids(result).indexOf(urlId)

describe.runIf(RUN_RELEVANCE)("search-result — pertinence du moteur de recherche", () => {
  useMongo(seedCorpus, "beforeAll")

  beforeAll(async () => {
    await createSearchIndexes()
    await waitForSearchIndexSync(CORPUS.length)
    await waitForSuggestionIndexSync()
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

    it("filtre niveau inclusif : les docs sans niveau précisé remontent quel que soit le niveau coché", async () => {
      const result = await search({ level: ["6"] })

      expect(ids(result)).toContain("offre-plombier") // niveau 6 déclaré
      expect(ids(result)).toContain("offre-sans-niveau") // niveau non précisé = indifférent
      expect(ids(result)).not.toContain("offre-marseille") // niveau 3 ≠ 6 → exclu
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
      const { suggestions } = await suggestSearchTerms({ q: "compta", limit: 5 })

      expect(suggestions.some((s) => s.toLowerCase().includes("comptab"))).toBe(true)
    })

    it("autocomplétion : insensible aux accents ('develo' → Développeur web)", async () => {
      const { suggestions } = await suggestSearchTerms({ q: "develo", limit: 5 })

      expect(suggestions.some((s) => s.toLowerCase().includes("développeur"))).toBe(true)
    })
  })

  // ──────────────────────────────────────────────────────────────────────────
  // 2. Ex-CIBLES D'AMÉLIORATION — KO / Mitigé en recette, CORRIGÉS par la refonte
  // Phase 1 (porte de pertinence : une clause de couverture par terme +
  // minimumShouldMatch dynamique + fuzzy par longueur + autocomplete en recherche
  // + bonus phrase). Promus de `it.fails` en `it` → désormais non-régression.
  // Pour toute nouvelle cible KO : ajouter un test `it.fails` décrivant le
  // comportement CIBLE ; quand une modif le corrige, retirer le `.fails`.
  // ──────────────────────────────────────────────────────────────────────────
  describe("corrigés par la refonte Phase 1 (ex-KO/Mitigé en recette)", () => {
    it("couverture multi-termes : 'product manager' ne remonte pas les docs ne matchant qu'un seul terme [Marion, KO]", async () => {
      const result = await search({ q: "product manager" })

      // Avant la refonte Phase 1 (minimumShouldMatch:1, clauses par champ) : minimumShouldMatch=1 → 'Product Designer' et 'Assistant manager'
      // polluent les résultats. Cible : quand un document matche tous les termes,
      // les documents 1-terme ne doivent pas remonter (ou nettement après).
      expect(ids(result)).not.toContain("offre-product-designer")
      expect(ids(result)).not.toContain("offre-assistant-manager")
    })

    it("couverture multi-termes : 'chargé de déploiement' ne remonte pas les autres 'chargé de …' [Marion, KO]", async () => {
      const result = await search({ q: "chargé de déploiement" })

      expect(ids(result)).not.toContain("offre-charge-recrutement")
      expect(ids(result)).not.toContain("offre-charge-communication")
    })

    it("nom d'entreprise : l'offre de l'employeur avant les offres qui le mentionnent en description [Marion]", async () => {
      const result = await search({ q: "sncf" })

      // Avant la refonte Phase 1 (minimumShouldMatch:1, clauses par champ) : la mention en description (boost 2, mais champ court → TF/IDF fort)
      // passe devant le match employeur (organization_name, boost 3). Cible : le match
      // sur l'employeur doit dominer les simples mentions.
      const employeur = rankOf(result, "offre-sncf")
      const mention = rankOf(result, "offre-mention-sncf")
      expect(employeur).toBeGreaterThanOrEqual(0)
      expect(mention === -1 || employeur < mention).toBe(true)
    })

    it("acronyme ambigu : 'esf' privilégie le synonyme exact (économie sociale et familiale) sur le fuzzy 'ESG' [Claire, KO]", async () => {
      const result = await search({ q: "esf" })

      // Avant la refonte Phase 1 (minimumShouldMatch:1, clauses par champ) : le fuzzy (maxEdits 1) sur le titre 'Analyste ESG' (boost 7) écrase
      // la clause synonymes (boost 1). Cible : le match par synonyme exact doit dominer.
      const esf = rankOf(result, "offre-esf")
      const esg = rankOf(result, "offre-esg")
      expect(esf).toBeGreaterThanOrEqual(0)
      expect(esg === -1 || esf < esg).toBe(true)
    })

    it("abréviation / mot incomplet : 'compta' trouve les offres comptables (comme l'autocomplétion) [Marion, KO]", async () => {
      const result = await search({ q: "compta" })

      // Avant la refonte Phase 1 (minimumShouldMatch:1, clauses par champ) : 'compta' → 'comptable' dépasse maxEdits=1 et l'opérateur text
      // ne fait pas de préfixe → 0 résultat pertinent. Cible : aligner la recherche
      // sur le comportement préfixe de l'autocomplétion (ou synonymes d'abréviations).
      expect(ids(result)).toContain("offre-comptable")
    })

    it("tri par date filtré par pertinence : 'assistant ressources humaines' + sort=date ne remonte pas 'Apprenti Boucher' en tête [Fadoua, KO]", async () => {
      const result = await search({ q: "assistant ressources humaines", sort: "date" })

      // Avant la refonte Phase 1 (minimumShouldMatch:1, clauses par champ) : le tri par date s'applique à TOUS les docs matchant au moins
      // une clause ('ressources' dans la description du boucher suffit) → l'offre la
      // plus récente gagne quel que soit son score. Cible : ne trier par date que des
      // résultats suffisamment pertinents.
      expect(ids(result)[0]).toBe("offre-rh")
    })

    it("zéro résultat honnête : une requête sans document pertinent renvoie 0 hit plutôt que du bruit [Fadoua, KO]", async () => {
      const result = await search({ q: "imagerie médicale et radiologie thérapeutique" })

      // Avant la refonte Phase 1 (minimumShouldMatch:1, clauses par champ) : 'médicale' matche (stemming) la description "Dispositifs médicaux…"
      // → des résultats non pertinents remontent. Cible : en dessous d'un seuil de
      // couverture des termes, préférer 0 résultat (question produit ouverte en recette).
      expect(result.nbHits).toBe(0)
    })

    it("sélection d'autocomplete : 'Cuisinier / Cuisinière à domicile' ne remonte pas les docs ne matchant que 'domicile' [Aurélie, KO]", async () => {
      const result = await search({ q: "Cuisinier / Cuisinière à domicile" })

      // Avant la refonte Phase 1 (minimumShouldMatch:1, clauses par champ) : le doublet masculin/féminin des intitulés ROME gonfle le nombre de
      // termes et 'domicile' seul suffit à matcher (minimumShouldMatch=1) → conducteurs PL,
      // aides à domicile... Cible : dédupliquer les termes normalisés (cuisinier ≈ cuisinière)
      // et exiger la couverture du terme métier.
      expect(ids(result)).not.toContain("offre-aide-domicile")
    })

    it("requête spécifique multi-domaines : 'monteur vidéo' privilégie l'audiovisuel sur le BTP/élec [Jérémy, KO]", async () => {
      const result = await search({ q: "monteur vidéo" })

      // Avant la refonte Phase 1 (minimumShouldMatch:1, clauses par champ) : 'Monteur réseaux électriques' matche 'monteur' (titre, boost 7)
      // et concurrence le doc full-match. Cible : la couverture des deux termes doit
      // l'emporter nettement.
      expect(rankOf(result, "offre-cadreur")).toBe(0)
      expect(ids(result)).not.toContain("offre-monteur-reseaux")
    })
  })

  // ──────────────────────────────────────────────────────────────────────────
  // 2bis. CORRIGÉS PAR LA RECETTE #2 — fuzzy sur noms d'entreprise, couverture
  // par description, tri par date pollué par les recruteurs, synonyme métier.
  // ──────────────────────────────────────────────────────────────────────────
  describe("corrigés par la recette #2", () => {
    it("pas de fuzzy sur les noms d'entreprise : 'vigile' ne remonte pas VIGIER [Marion, KO]", async () => {
      const result = await search({ q: "vigile" })

      expect(ids(result)).not.toContain("recruteur-vigier")
      // Le vrai match (keywords + synonyme) reste en tête.
      expect(rankOf(result, "offre-securite")).toBe(0)
    })

    it("synonyme métier : 'vigile' couvre 'agent de sécurité' via la collection de synonymes", async () => {
      const result = await search({ q: "vigile" })

      expect(ids(result)).toContain("offre-securite")
    })

    it("le nom d'entreprise exact matche toujours sans fuzzy : 'vigier plomberie' → le recruteur remonte", async () => {
      const result = await search({ q: "vigier plomberie" })

      expect(ids(result)).toContain("recruteur-vigier")
    })

    it("la description seule ne fait plus entrer un doc : 'chargé de déploiement' exclut la mention marketing [Marion, KO]", async () => {
      const result = await search({ q: "chargé de déploiement" })

      // "chargé" est couvert par le titre mais "déploiement" ne l'est que par la description
      // → couverture insuffisante, le doc sort du result set.
      expect(ids(result)).not.toContain("offre-marketing-deploiement-desc")
    })

    it("tri par date : les recruteurs (date d'import) sont relégués en fin de liste [Fadoua, KO + ticket algo]", async () => {
      const result = await search({ q: "conduite de travaux", sort: "date" })

      // Présents (spec : affichés en dernier, plus exclus) mais APRÈS toutes les offres,
      // malgré leur date d'import plus récente que toutes les dates de publication.
      expect(ids(result)).toContain("recruteur-travaux")
      expect(rankOf(result, "recruteur-travaux")).toBeGreaterThan(rankOf(result, "offre-conducteur-travaux"))
      expect(rankOf(result, "recruteur-travaux")).toBe(result.hits.length - 1)
    })

    it("tri par pertinence : les recruteurs restent présents (statu quo hors tri date)", async () => {
      const result = await search({ q: "conduite de travaux" })

      expect(ids(result)).toContain("recruteur-travaux")
      expect(ids(result)).toContain("offre-conducteur-travaux")
    })
  })

  describe("filtres contrat (champs jobs_partners)", () => {
    it("is_disabled_elligible=true ne renvoie que les offres éligibles handicap", async () => {
      const result = await search({ q: "conducteur de travaux", is_disabled_elligible: true })

      expect(ids(result)).toContain("offre-travaux-handi")
      expect(ids(result)).not.toContain("offre-conducteur-travaux")
    })

    it("sans le filtre, éligibles et non éligibles remontent ensemble", async () => {
      const result = await search({ q: "conducteur de travaux" })

      expect(ids(result)).toContain("offre-travaux-handi")
      expect(ids(result)).toContain("offre-conducteur-travaux")
    })

    it("start_type filtre sur le mode de démarrage (les docs à start_type null sortent)", async () => {
      const result = await search({ q: "conducteur de travaux", start_type: "precise_date" })

      expect(ids(result)).toContain("offre-travaux-handi")
      expect(ids(result)).not.toContain("offre-conducteur-travaux")
    })

    it("start_date : renvoie les offres démarrant avant ou à la date choisie ($lte, borne incluse)", async () => {
      const result = await search({ q: "conducteur de travaux", start_date: new Date("2026-08-01T00:00:00.000Z") })

      expect(ids(result)).toContain("offre-travaux-aout") // démarre le 01/08 (borne incluse)
      expect(ids(result)).not.toContain("offre-travaux-handi") // démarre le 01/09, après la date souhaitée
    })

    it("start_date : une offre à date flexible est toujours affichée, même si sa date dépasse", async () => {
      const result = await search({ q: "conducteur de travaux", start_date: new Date("2026-08-01T00:00:00.000Z") })

      expect(ids(result)).toContain("offre-travaux-flexible") // démarre le 01/12 mais is_start_flexible
    })

    it("start_date : les docs sans date de démarrage (algo, offres sans date) restent affichés à leur rang de pertinence", async () => {
      const avec = await search({ q: "conduite de travaux", start_date: new Date("2026-08-01T00:00:00.000Z") })
      const sans = await search({ q: "conduite de travaux" })

      // Hypothèse technique du ticket validée : un doc exempt de la donnée filtrée n'est pas
      // impacté — même présence et même ordre relatif que sans le filtre.
      expect(ids(avec)).toContain("recruteur-travaux")
      expect(ids(avec)).toContain("offre-conducteur-travaux")
      const relatif = (r: SearchResult) => rankOf(r, "recruteur-travaux") - rankOf(r, "offre-conducteur-travaux") > 0
      expect(relatif(avec)).toBe(relatif(sans))
    })

    it("les filtres contrat se cumulent : handicap + date de démarrage souhaitée", async () => {
      const result = await search({ q: "conducteur de travaux junior", is_disabled_elligible: true, start_date: new Date("2026-09-01T00:00:00.000Z") })

      expect(ids(result)).toContain("offre-travaux-handi") // éligible + démarre le 01/09 (≤)
      expect(ids(result)).not.toContain("offre-travaux-aout") // démarre avant mais non éligible handicap
    })

    it("sort=applications : moins de candidatures d'abord, docs sans compteur (formations) écartés", async () => {
      const result = await search({ q: "conducteur de travaux", sort: "applications" })

      // aout (0 candidature) < conducteur (3, défaut fixture) < flexible (12)
      expect(rankOf(result, "offre-travaux-aout")).toBeLessThan(rankOf(result, "offre-conducteur-travaux"))
      expect(rankOf(result, "offre-conducteur-travaux")).toBeLessThan(rankOf(result, "offre-travaux-flexible"))
      // Sans compteur, un doc trierait en tête (valeur manquante < 0) → exclu de ce tri.
      for (const hit of result.hits) expect(hit.application_count).not.toBeNull()
    })
  })

  describe("type de recherche (mode) et filtres du redesign", () => {
    it("mode=emplois : exclut les formations et les offres CFA/GEIQ, garde offres et candidatures spontanées", async () => {
      const result = await search({ q: "conduite de travaux", mode: "emplois" })

      expect(ids(result)).toContain("offre-conducteur-travaux")
      expect(ids(result)).toContain("recruteur-travaux")
      expect(ids(result)).not.toContain("offre-travaux-cfa")
      for (const hit of result.hits) expect(hit.type).toBe("offre")
    })

    it("mode=formations : uniquement les formations", async () => {
      const result = await search({ mode: "formations" })

      expect(ids(result)).toContain("formation-mco")
      for (const hit of result.hits) expect(hit.type).toBe("formation")
    })

    it("mode=emplois_formation : uniquement les offres CFA/GEIQ", async () => {
      const result = await search({ mode: "emplois_formation" })

      expect(ids(result)).toEqual(["offre-travaux-cfa"])
    })

    it("is_algo_company=true : uniquement les entreprises à contacter (candidatures spontanées)", async () => {
      const result = await search({ q: "conduite de travaux", is_algo_company: true })

      expect(ids(result)).toContain("recruteur-travaux")
      expect(ids(result)).not.toContain("offre-conducteur-travaux")
    })

    it("is_algo_company=false : uniquement les offres d'emploi (sans les candidatures spontanées)", async () => {
      const result = await search({ q: "conduite de travaux", is_algo_company: false })

      expect(ids(result)).toContain("offre-conducteur-travaux")
      expect(ids(result)).not.toContain("recruteur-travaux")
    })

    it("smart_apply=true : uniquement les offres avec candidature simplifiée", async () => {
      const result = await search({ q: "conducteur de travaux", smart_apply: true })

      expect(ids(result)).toContain("offre-travaux-cfa")
      expect(ids(result)).not.toContain("offre-conducteur-travaux")
    })

    it("sort=start_date : démarrages les plus proches d'abord, docs sans date écartés", async () => {
      const result = await search({ q: "conducteur de travaux", sort: "start_date" })

      // aout (01/08) < handi (01/09) < flexible (01/12)
      expect(rankOf(result, "offre-travaux-aout")).toBeLessThan(rankOf(result, "offre-travaux-handi"))
      expect(rankOf(result, "offre-travaux-handi")).toBeLessThan(rankOf(result, "offre-travaux-flexible"))
      // Sans date, un doc trierait en tête (valeur manquante avant toute date) → exclu de ce tri.
      for (const hit of result.hits) expect(hit.start_date).not.toBeNull()
    })

    it("compteur handi : counts.is_disabled_elligible reflète le result set et reste stable filtre actif", async () => {
      const sans = await search({ q: "conducteur de travaux" })
      const avec = await search({ q: "conducteur de travaux", is_disabled_elligible: true })

      expect(sans.counts?.is_disabled_elligible).toBe(1) // offre-travaux-handi
      // Disjonctif : activer le filtre ne fait pas retomber le compteur de sa propre chip.
      expect(avec.counts?.is_disabled_elligible).toBe(sans.counts?.is_disabled_elligible)
    })
  })

  // ──────────────────────────────────────────────────────────────────────────
  // 3. SUGGESTIONS APPRISES — fusion de `search_suggestions` (recherches
  // utilisateurs validées par analyzeSearchQueries) dans l'autocomplétion.
  // ──────────────────────────────────────────────────────────────────────────
  describe("suggestions apprises des recherches utilisateurs", () => {
    it("sert les suggestions actives en complément du contenu indexé", async () => {
      const { suggestions } = await suggestSearchTerms({ q: "boulanger", limit: 8 })

      expect(suggestions).toContain("Boulangerie artisanale")
    })

    it("n'expose jamais une suggestion désactivée (kill-switch unitaire)", async () => {
      const { suggestions } = await suggestSearchTerms({ q: "boulanger", limit: 8 })

      expect(suggestions).not.toContain("Boulangerie industrielle")
    })

    it("priorise le contenu réellement indexé (title/rome_labels) sur les suggestions apprises", async () => {
      const { suggestions } = await suggestSearchTerms({ q: "boulanger", limit: 8 })

      const fromItems = suggestions.indexOf("Vendeur en boulangerie") // title du corpus
      const fromUsers = suggestions.indexOf("Boulangerie artisanale")
      expect(fromItems).toBeGreaterThanOrEqual(0)
      expect(fromUsers).toBeGreaterThan(fromItems)
    })

    it("déduplique une suggestion apprise identique à un intitulé indexé", async () => {
      const { suggestions } = await suggestSearchTerms({ q: "boulanger", limit: 8 })

      // "Vendeur en boulangerie" existe à la fois comme title (corpus) et comme
      // suggestion active → une seule occurrence.
      expect(suggestions.filter((s) => s === "Vendeur en boulangerie")).toHaveLength(1)
    })
  })
})
