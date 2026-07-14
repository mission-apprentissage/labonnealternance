import { describe, expect, it } from "vitest"

import type { IQueryAnalysis, IQueryStats } from "./searchSuggestionCriteria"
import { decideSuggestion, decideSynonym, isSuggestionCandidate, isSynonymCandidate, passesQuantitativeGate } from "./searchSuggestionCriteria"

// Candidat "idéal suggestion" : fréquent, récurrent, efficace, tapé en texte libre.
const goodStats = (overrides: Partial<IQueryStats> = {}): IQueryStats => ({
  q_normalized: "petite enfance",
  top_raw_q: "petite enfance",
  total: 50,
  days_seen: 12,
  zero_hits_count: 2,
  free_text_count: 45,
  median_nb_hits: 120,
  ...overrides,
})

const goodAnalysis = (overrides: Partial<IQueryAnalysis> = {}): IQueryAnalysis => ({
  is_relevant: true,
  category: "secteur",
  contains_pii: false,
  is_toxic: false,
  canonical: "Petite enfance",
  language: "fr",
  synonym_of: null,
  confidence: 0.95,
  ...overrides,
})

describe("searchSuggestionCriteria", () => {
  describe("passesQuantitativeGate (S1, S2, S6, S8)", () => {
    it("accepte un candidat idéal", () => {
      expect(passesQuantitativeGate(goodStats())).toEqual({ verdict: "pass", reason: null })
    })

    it.each([
      ["below_min_total", goodStats({ total: 5 })],
      ["below_min_days_seen", goodStats({ days_seen: 2 })],
      ["bad_length", goodStats({ top_raw_q: "ab" })],
      ["bad_token_count", goodStats({ q_normalized: "un deux trois quatre cinq six sept" })],
      ["bad_letter_rate", goodStats({ top_raw_q: "code 123456" })],
      ["blocklist", goodStats({ q_normalized: "azerty", top_raw_q: "azerty" })],
    ])("rejette %s", (reason, stats) => {
      expect(passesQuantitativeGate(stats)).toEqual({ verdict: "reject", reason })
    })
  })

  describe("routage suggestion vs synonyme (S3-S5 / Y1-Y2)", () => {
    it("un candidat efficace et tapé librement est candidat suggestion", () => {
      expect(isSuggestionCandidate(goodStats())).toBe(true)
    })

    it("un fort taux de zero-hits disqualifie la suggestion mais qualifie le synonyme (S4/Y2)", () => {
      const gapStats = goodStats({ zero_hits_count: 30, median_nb_hits: 0 })
      expect(isSuggestionCandidate(gapStats)).toBe(false)
      expect(isSynonymCandidate(gapStats)).toBe(true)
    })

    it("une requête déjà servie par l'autocomplete (free_text faible) n'est pas candidate suggestion (S5)", () => {
      expect(isSuggestionCandidate(goodStats({ free_text_count: 10 }))).toBe(false)
    })

    it("un candidat peu fréquent n'est pas candidat synonyme (Y1 plus strict)", () => {
      expect(isSynonymCandidate(goodStats({ total: 25, zero_hits_count: 20 }))).toBe(false)
    })
  })

  describe("decideSuggestion (S9-S13)", () => {
    it("accepte le candidat idéal", () => {
      expect(decideSuggestion(goodStats(), goodAnalysis())).toEqual({ verdict: "pass", reason: null })
    })

    it.each([
      ["pii", goodAnalysis({ contains_pii: true })],
      ["toxic", goodAnalysis({ is_toxic: true })],
      ["off_topic", goodAnalysis({ is_relevant: false, canonical: null })],
      ["off_topic", goodAnalysis({ category: null })],
      ["low_confidence", goodAnalysis({ confidence: 0.5 })],
      ["no_canonical", goodAnalysis({ canonical: "  " })],
    ])("rejette %s", (reason, analysis) => {
      expect(decideSuggestion(goodStats(), analysis)).toEqual({ verdict: "reject", reason })
    })
  })

  describe("decideSynonym (Y3)", () => {
    const synonymStats = goodStats({ total: 40, zero_hits_count: 25, median_nb_hits: 0 })

    it("accepte une reformulation à forte confiance", () => {
      expect(decideSynonym(synonymStats, goodAnalysis({ synonym_of: "comptabilité", confidence: 0.95 }))).toEqual({ verdict: "pass", reason: null })
    })

    it("exige une confiance ≥ 0.9 (plus strict que la suggestion)", () => {
      expect(decideSynonym(synonymStats, goodAnalysis({ synonym_of: "comptabilité", confidence: 0.85 }))).toEqual({ verdict: "reject", reason: "low_confidence" })
    })

    it("rejette sans cible de reformulation", () => {
      expect(decideSynonym(synonymStats, goodAnalysis({ synonym_of: null }))).toEqual({ verdict: "reject", reason: "no_synonym_target" })
    })
  })
})
