import { describe, expect, it } from "vitest"

import { normalizeNafCode, normalizeNafLabel } from "./naf-utils.js"
import { toKebabCase } from "./string-utils.js"

describe("normalizeNafCode", () => {
  it.each([
    // les formes réellement reçues par le pipeline, cf. issue #5344
    ["84.11Z", "84.11Z"], // API entreprise, déjà à la notation INSEE
    ["4673A", "46.73A"], // forme compacte (fixture flux INSEE recruteurs LBA)
    ["6202A", "62.02A"], // APEC
    ["35.14Y", "35.14Y"], // mapper Enedis (code en dur)
    ["10-51C", "10.51C"],
    ["10 51 C", "10.51C"],
    ["1051c", "10.51C"],
    ["  84.11Z  ", "84.11Z"],
  ])("ramène %s à la notation INSEE", (input, expected) => {
    expect(normalizeNafCode(input)).toBe(expected)
  })

  it("est idempotent", () => {
    expect(normalizeNafCode(normalizeNafCode("4673A"))).toBe("46.73A")
  })

  it.each([null, undefined, "", "   ", "..."])("renvoie null pour une valeur vide (%s)", (input) => {
    expect(normalizeNafCode(input)).toBe(null)
  })

  // faux positifs : le point ne doit être inséré que sur une vraie sous-classe NAF
  it.each([
    ["85", "85"], // code division seul
    ["8511", "8511"], // code classe, pas une sous-classe
    ["secteur-inconnu", "SECTEURINCONNU"],
    ["10.51CD", "1051CD"],
  ])("laisse compacte une valeur hors sous-classe : %s", (input, expected) => {
    expect(normalizeNafCode(input)).toBe(expected)
  })

  it("laisse intact le préfixe de division utilisé par les filtres CFA", () => {
    // blockJobsPartnersWithNaf85 filtre sur `^85`, validateCreationEntrepriseFromCfa sur startsWith("85")
    expect(normalizeNafCode("85.42Z")?.startsWith("85")).toBe(true)
    expect(normalizeNafCode("8542Z")?.startsWith("85")).toBe(true)
  })
})

describe("normalizeNafLabel", () => {
  it("fait converger les deux casses du même libellé INSEE", () => {
    // le cas exact remonté par Fadoua : deux lignes distinctes dans Metabase
    const expected = "Fabrication d'autres produits laitiers"
    expect(normalizeNafLabel("FABRICATION D'AUTRES PRODUITS LAITIERS")).toBe(expected)
    expect(normalizeNafLabel("Fabrication d'autres produits laitiers")).toBe(expected)
    expect(normalizeNafLabel("fabrication d'autres produits laitiers")).toBe(expected)
  })

  it("préserve les accents des capitales accentuées", () => {
    expect(normalizeNafLabel("CONSEIL EN SYSTÈMES ET LOGICIELS INFORMATIQUES")).toBe("Conseil en systèmes et logiciels informatiques")
  })

  it("unifie les apostrophes typographiques", () => {
    expect(normalizeNafLabel("Fabrication d’autres produits laitiers")).toBe("Fabrication d'autres produits laitiers")
  })

  it("resserre les espaces", () => {
    expect(normalizeNafLabel("  Commerce   de gros\n de matériel  ")).toBe("Commerce de gros de matériel")
  })

  it.each([null, undefined, "", "   "])("renvoie null pour une valeur vide (%s)", (input) => {
    expect(normalizeNafLabel(input)).toBe(null)
  })

  // faux positifs : un libellé déjà en casse mixte ne doit PAS être recassé
  it.each(["Activités des sociétés holding", "Commerce de gros d'équipements TIC", "Édition de logiciels applicatifs", "Transformation du thé et du café"])(
    "laisse tel quel un libellé en casse mixte : %s",
    (input) => {
      expect(normalizeNafLabel(input)).toBe(input)
    }
  )

  it("ne casse pas un libellé sans lettre", () => {
    expect(normalizeNafLabel("1051")).toBe("1051")
  })

  it("documente la limite des capitales désaccentuées", () => {
    // les accents perdus en amont ne sont pas restaurables sans référentiel NAF : ce libellé
    // ne rejoindra pas « Activités des sièges sociaux »
    expect(normalizeNafLabel("ACTIVITES DES SIEGES SOCIAUX")).toBe("Activites des sieges sociaux")
  })
})

describe("normalizeNafLabel et les URLs indexées", () => {
  // buildLbaUrlFromJob utilise workplace_naf_label comme titre de slug pour les fiches
  // RECRUTEURS_LBA, et ce partenaire passe désormais par la normalisation. Recasser un libellé
  // ne doit jamais déplacer une URL déjà indexée : toKebabCase absorbe la casse, ce test le verrouille.
  it.each([
    "FABRICATION D'AUTRES PRODUITS LAITIERS",
    "CONSEIL EN SYSTÈMES ET LOGICIELS INFORMATIQUES",
    "Fabrication d’autres produits laitiers",
    "ACTIVITES DES SIEGES SOCIAUX",
    "fabrication d'autres produits laitiers",
    "  Commerce   de gros de matériel  ",
  ])("le slug est inchangé par la normalisation : %s", (raw) => {
    expect(toKebabCase(normalizeNafLabel(raw)!)).toBe(toKebabCase(raw))
  })
})
