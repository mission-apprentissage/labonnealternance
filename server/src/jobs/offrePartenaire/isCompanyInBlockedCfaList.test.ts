import { describe, expect, it } from "vitest"

import { getCompanyInBlockedCfaList, isCompanyInBlockedCfaList } from "./isCompanyInBlockedCfaList"

describe("isCompanyInBlockedCfaList (insensible à la casse et aux accents)", () => {
  it("devrait trouver les CFA avec casse et accents exacts", () => {
    expect(isCompanyInBlockedCfaList("AFTEC Caen")).toBe(true)
    expect(isCompanyInBlockedCfaList("École de Management Appliqué (EMA)")).toBe(true)
  })

  it("devrait trouver les CFA même sans respecter la casse", () => {
    expect(isCompanyInBlockedCfaList("aftec caen")).toBe(true)
    expect(isCompanyInBlockedCfaList("ipac bachelor factory caen")).toBe(true)
    expect(isCompanyInBlockedCfaList("efrei - grande école du numérique")).toBe(true)
  })

  it("devrait trouver les CFA même avec des accents supprimés ou remplacés", () => {
    expect(isCompanyInBlockedCfaList("ecole de management applique (ema)")).toBe(true)
    expect(isCompanyInBlockedCfaList("ecoles aftec")).toBe(true)
    expect(isCompanyInBlockedCfaList("ecole intuit lab")).toBe(true)
    expect(isCompanyInBlockedCfaList("efrei - grande ecole du numerique")).toBe(true)
    expect(isCompanyInBlockedCfaList("icans | institut de cancerologie strasbourg europe")).toBe(true) // volontairement faux sur orthographe mais sans accents
  })

  it("devrait trouver les CFA avec des variations mixtes", () => {
    expect(isCompanyInBlockedCfaList("walter LEARNING")).toBe(true)
    expect(isCompanyInBlockedCfaList("IPAC BACHELOR FACTORY vannes")).toBe(true)
    expect(isCompanyInBlockedCfaList("pigier BORDEAUX")).toBe(true)
    expect(isCompanyInBlockedCfaList("CIO'sup drome-ardeche")).toBe(true)
  })

  it("devrait trouver le nouveau CFA bloqué demandé", () => {
    expect(isCompanyInBlockedCfaList("AURLOM BTS+ PARIS")).toBe(true)
  })

  it("devrait trouver les CFA lorsqu'ils sont mentionnés dans un texte", () => {
    expect(isCompanyInBlockedCfaList("Formation en alternance avec Iscod pour une prise de poste immediate")).toBe(true)
    expect(isCompanyInBlockedCfaList("Entreprise partenaire du CFA Iscod pour le recrutement en alternance")).toBe(true)
  })

  it("devrait bloquer les variantes BTP CFA via l'entrée générique", () => {
    expect(getCompanyInBlockedCfaList("BTP CFA BRETAGNE")).toBe("btp cfa")
    expect(getCompanyInBlockedCfaList("BTP CFA CENTRE")).toBe("btp cfa centre")
    expect(isCompanyInBlockedCfaList("BTP CFA BRETAGNE")).toBe(true)
    expect(isCompanyInBlockedCfaList("BTP CFA CENTRE")).toBe(true)
  })

  it("ne doit pas trouver un CFA qui n'existe pas", () => {
    expect(isCompanyInBlockedCfaList("Boulangerie Dupont")).toBe(false)
    expect(isCompanyInBlockedCfaList("Plomberie Martin")).toBe(false)
    expect(isCompanyInBlockedCfaList("Université Inconnue")).toBe(false)
  })

  it("ne doit pas trouver les établissements publics supprimés de la liste", () => {
    expect(isCompanyInBlockedCfaList("afpa PAYS DE savoie")).toBe(false)
    expect(isCompanyInBlockedCfaList("Chambre de Metiers et de l'Artisanat de Region Bretagne")).toBe(false)
    expect(isCompanyInBlockedCfaList("Universite de Rennes")).toBe(false)
  })
})
