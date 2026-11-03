import { useMongo } from "@tests/utils/mongo.test.utils"
import { ObjectId } from "bson"
import type { ISearchQuery } from "shared/models/search-queries.model"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { getDbCollection } from "@/common/utils/mongodb-utils"
import { notifyToSlack } from "@/common/utils/slack-utils"
import { sendMistralBatch } from "@/services/mistralai/mistralai.service"
import { normalizeQuery } from "@/services/search/search-query-log.service"

import { analyzeSearchQueries } from "./analyze-search-queries"

vi.mock("@/common/utils/slack-utils", () => ({ notifyToSlack: vi.fn().mockResolvedValue(undefined) }))
vi.mock("@/services/mistralai/mistralai.service", () => ({ sendMistralBatch: vi.fn() }))
vi.mock("@/services/search/search.service", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/services/search/search.service")>()),
  suggestSearchTerms: vi.fn().mockResolvedValue({ suggestions: [] }),
  searchItems: vi.fn().mockResolvedValue({ nbHits: 1 }),
}))

const analysis = (overrides: Record<string, unknown>) => ({
  is_relevant: true,
  category: "metier",
  contains_pii: false,
  is_toxic: false,
  canonical: null,
  language: "fr",
  synonym_of: null,
  confidence: 0.95,
  ...overrides,
})

/** `total` recherches réparties sur 6 jours, en texte libre sauf `overrides`. */
const queryLogs = (q: string, { total, nbHits }: { total: number; nbHits: number }, overrides: Partial<ISearchQuery> = {}): ISearchQuery[] =>
  Array.from({ length: total }, (_, i) => ({
    _id: new ObjectId(),
    q,
    q_normalized: normalizeQuery(q),
    status: "ok",
    nb_hits: nbHits,
    search_source: "free_text",
    filters: { type: null, type_filter_label: 0, contract_type: 0, level: 0, activity_sector: 0, has_organization: false, sort: null },
    has_geo: false,
    geo: null,
    radius: null,
    admin_area: null,
    created_at: new Date(Date.now() - (i % 6) * 24 * 3600 * 1000 - 3600 * 1000),
    ...overrides,
  }))

/** Réponse Mistral simulée, retrouvée par la requête brute citée dans le prompt. */
const mockMistral = (responses: Record<string, ReturnType<typeof analysis>>) => {
  vi.mocked(sendMistralBatch).mockImplementation(async ({ requests }) => {
    const byCustomId = new Map<string, string>()
    for (const { customId, messages } of requests) {
      const rawQ = /Requête : "(.*)"/.exec(messages[1].content)?.[1] ?? ""
      byCustomId.set(customId, JSON.stringify(responses[rawQ]))
    }
    return byCustomId
  })
}

const slackMessage = () => vi.mocked(notifyToSlack).mock.calls.at(-1)![0].message

describe("analyzeSearchQueries", () => {
  useMongo()

  beforeEach(async () => {
    vi.clearAllMocks()
    await Promise.all([getDbCollection("search_queries").deleteMany({}), getDbCollection("search_suggestions").deleteMany({}), getDbCollection("search_synonyms").deleteMany({})])
  })

  it("ne garde qu'une suggestion quand deux candidats ont la même forme canonique", async () => {
    await getDbCollection("search_queries").insertMany([
      ...queryLogs("diag immobilier", { total: 40, nbHits: 50 }),
      ...queryLogs("diagnostic immobillier", { total: 30, nbHits: 50 }),
    ])
    mockMistral({
      "diag immobilier": analysis({ canonical: "Diagnostic immobilier" }),
      "diagnostic immobillier": analysis({ canonical: "Diagnostic immobilier" }),
    })

    await analyzeSearchQueries()

    const active = await getDbCollection("search_suggestions").find({ status: "active" }).toArray()
    expect(active.map((doc) => doc.term)).toEqual(["Diagnostic immobilier"])
    // Le candidat le plus recherché est traité en premier ; l'autre est tracé comme doublon.
    const duplicate = await getDbCollection("search_suggestions").findOne({ rejection_reason: "duplicate_in_run" })
    expect(duplicate?.status).toBe("rejected")
    expect(slackMessage()).toContain("Suggestions insérées (1) : Diagnostic immobilier")
    expect(slackMessage()).toContain("duplicate_in_run: 1")
  })

  it("n'écrase pas la décision d'un candidat dont la clé est déjà prise par une forme canonique", async () => {
    // « diagnostic immobilier » (clé du candidat B) est aussi la forme canonique du candidat A, traité avant.
    await getDbCollection("search_queries").insertMany([
      ...queryLogs("diag immobilier", { total: 40, nbHits: 50 }),
      ...queryLogs("diagnostic immobilier", { total: 30, nbHits: 50 }),
    ])
    mockMistral({
      "diag immobilier": analysis({ canonical: "Diagnostic immobilier" }),
      "diagnostic immobilier": analysis({ is_relevant: false, category: null, confidence: 0.4 }),
    })

    await analyzeSearchQueries()

    const docs = await getDbCollection("search_suggestions")
      .find({ normalized: normalizeQuery("diagnostic immobilier") })
      .toArray()
    expect(docs).toHaveLength(1)
    expect(docs[0]).toMatchObject({ status: "active", term: "Diagnostic immobilier" })
    expect(slackMessage()).toContain("Suggestions insérées (1)")
  })

  it("ne réactive pas une clé déjà décidée lors d'un run précédent", async () => {
    const previous = {
      _id: new ObjectId(),
      term: "Diagnostic immobilier",
      normalized: normalizeQuery("Diagnostic immobilier"),
      origin: "user_queries" as const,
      status: "disabled" as const,
      rejection_reason: null,
      category: "metier" as const,
      counters: { total_30d: 25, days_seen_30d: 6, zero_hits_30d: 0, free_text_30d: 25, median_nb_hits: 50 },
      confidence: 0.95,
      run_id: "run-precedent",
      created_at: new Date("2026-09-01"),
      last_seen_at: new Date("2026-09-01"),
    }
    await getDbCollection("search_suggestions").insertOne(previous)
    await getDbCollection("search_queries").insertMany(queryLogs("diag immobilier", { total: 40, nbHits: 50 }))
    mockMistral({ "diag immobilier": analysis({ canonical: "Diagnostic immobilier" }) })

    await analyzeSearchQueries()

    expect(await getDbCollection("search_suggestions").findOne({ _id: previous._id })).toMatchObject({ status: "disabled", run_id: "run-precedent" })
    expect(await getDbCollection("search_suggestions").countDocuments({ status: "active" })).toBe(0)
    expect(slackMessage()).toContain("Suggestions insérées (0)")
    expect(slackMessage()).toContain("duplicate_in_run: 1")
  })

  it("n'insère pas de groupe de synonymes quand la clé du candidat est déjà prise", async () => {
    // « compta » (route synonyme) a la même clé que la forme canonique « Compta » d'un candidat traité avant.
    await getDbCollection("search_queries").insertMany([...queryLogs("comptabilite generale", { total: 40, nbHits: 50 }), ...queryLogs("compta", { total: 30, nbHits: 0 })])
    mockMistral({
      "comptabilite generale": analysis({ canonical: "Compta" }),
      compta: analysis({ canonical: "Comptabilité", synonym_of: "comptabilité" }),
    })

    await analyzeSearchQueries()

    expect(await getDbCollection("search_synonyms").countDocuments({})).toBe(0)
    expect(slackMessage()).toContain("Synonymes insérés (0)")
    expect(slackMessage()).toContain("duplicate_in_run: 1")
  })

  it("ignore les recherches du canal api", async () => {
    await getDbCollection("search_queries").insertMany(queryLogs("data engineer", { total: 40, nbHits: 50 }, { channel: "api" }))

    await analyzeSearchQueries()

    expect(sendMistralBatch).not.toHaveBeenCalled()
    expect(await getDbCollection("search_suggestions").countDocuments({})).toBe(0)
  })

  it("ignore les comptages lancés par l'UI (purpose)", async () => {
    await getDbCollection("search_queries").insertMany(queryLogs("data engineer", { total: 40, nbHits: 50 }, { purpose: "mode_fallback_count" }))

    await analyzeSearchQueries()

    expect(sendMistralBatch).not.toHaveBeenCalled()
    expect(await getDbCollection("search_suggestions").countDocuments({})).toBe(0)
  })

  it("compte les recherches du canal site et celles sans canal", async () => {
    await getDbCollection("search_queries").insertMany([
      ...queryLogs("data engineer", { total: 20, nbHits: 50 }, { channel: "site" }),
      ...queryLogs("data engineer", { total: 20, nbHits: 50 }),
    ])
    mockMistral({ "data engineer": analysis({ canonical: "Data engineer" }) })

    await analyzeSearchQueries()

    expect(await getDbCollection("search_suggestions").findOne({ status: "active" })).toMatchObject({ term: "Data engineer", counters: { total_30d: 40 } })
  })

  it("ignore les paliers d'élargissement du rayon dans le taux de zéro résultat", async () => {
    // Avec les paliers : 50 % de zéro résultat, au-delà de S4 → route synonyme.
    await getDbCollection("search_queries").insertMany([
      ...queryLogs("diag immobilier", { total: 40, nbHits: 0 }, { auto_radius_intermediate: true }),
      ...queryLogs("diag immobilier", { total: 40, nbHits: 50 }),
    ])
    mockMistral({ "diag immobilier": analysis({ canonical: "Diagnostic immobilier" }) })

    await analyzeSearchQueries()

    expect(await getDbCollection("search_suggestions").findOne({ status: "active" })).toMatchObject({
      term: "Diagnostic immobilier",
      counters: { total_30d: 40, zero_hits_30d: 0 },
    })
  })

  it("calcule le taux de texte libre sur les seules recherches d'origine connue", async () => {
    // 10 free_text sur 40 : 25 % du total, mais 100 % des recherches d'origine connue.
    await getDbCollection("search_queries").insertMany([
      ...queryLogs("diag immobilier", { total: 10, nbHits: 50 }),
      ...queryLogs("diag immobilier", { total: 30, nbHits: 50 }, { search_source: null }),
    ])
    mockMistral({ "diag immobilier": analysis({ canonical: "Diagnostic immobilier" }) })

    await analyzeSearchQueries()

    expect(await getDbCollection("search_suggestions").findOne({ status: "active" })).toMatchObject({
      counters: { total_30d: 40, free_text_30d: 10, known_source_30d: 10 },
    })
  })

  it("n'insère pas de suggestion quand aucune recherche n'a d'origine connue", async () => {
    await getDbCollection("search_queries").insertMany(queryLogs("diag immobilier", { total: 40, nbHits: 50 }, { search_source: null }))
    mockMistral({ "diag immobilier": analysis({ canonical: "Diagnostic immobilier" }) })

    await analyzeSearchQueries()

    expect(await getDbCollection("search_suggestions").countDocuments({ status: "active" })).toBe(0)
  })

  it("rapporte le motif de la route synonyme pour un candidat éligible à cette seule route", async () => {
    await getDbCollection("search_queries").insertMany(queryLogs("compta", { total: 40, nbHits: 0 }))
    mockMistral({ compta: analysis({ canonical: "Comptabilité", synonym_of: "comptabilité", confidence: 0.5 }) })

    await analyzeSearchQueries()

    const doc = await getDbCollection("search_suggestions").findOne({ term: "compta" })
    expect(doc).toMatchObject({ status: "rejected", rejection_reason: "low_confidence" })
    expect(slackMessage()).toContain("low_confidence: 1")
    expect(slackMessage()).not.toContain("not_suggestion_candidate")
  })
})
