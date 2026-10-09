import { describe, expect, it } from "vitest"

import { OPCOS_LABEL } from "../constants/recruteur.js"
import { getOpcoFilterLabel, getOpcoUrlByIdcc, normalizeOpcoUrl, parseOpcoFilter } from "./opco-search-filter.js"

describe("parseOpcoFilter", () => {
  it.each([
    ["valeur absente", undefined],
    ["chaîne vide", ""],
    ["libellé long", OPCOS_LABEL.SANTE],
    ["opco inconnu", "UNKNOWN_OPCO"],
    ["opco multiple", "MULTIPLE_OPCO"],
    ["clé inexistante", "OPCO3"],
  ])("rejette %s", (_, value) => {
    expect(parseOpcoFilter(value)).toBeNull()
  })

  it("accepte la clé courte quelle que soit la casse", () => {
    expect(parseOpcoFilter("akto")).toBe("AKTO")
    expect(parseOpcoFilter(" Ep ")).toBe("EP")
  })

  it("traduit la clé en libellé de jobs_partners", () => {
    expect(getOpcoFilterLabel("EP")).toBe(OPCOS_LABEL.EP)
  })
})

describe("normalizeOpcoUrl", () => {
  it("ramène l'URL à son nom de domaine en minuscules", () => {
    expect(normalizeOpcoUrl("www.jecompte.fr")).toBe("www.jecompte.fr")
    expect(normalizeOpcoUrl("https://www.JeCompte.fr/")).toBe("www.jecompte.fr")
  })

  it.each([
    ["valeur absente", undefined],
    ["chaîne vide", ""],
    ["sans point", "localhost"],
    ["avec chemin", "www.jecompte.fr/metiers"],
    ["caractères hors domaine", "www.jecompte.fr;path=/"],
  ])("rejette %s", (_, value) => {
    expect(normalizeOpcoUrl(value)).toBeNull()
  })
})

describe("getOpcoUrlByIdcc", () => {
  it("déduit le site sectoriel de la convention collective", () => {
    expect(getOpcoUrlByIdcc(787)).toBe("www.jecompte.fr")
    expect(getOpcoUrlByIdcc(1486)).toBe("www.concepteursdavenirs.fr")
  })

  it("renvoie null hors des branches couvertes", () => {
    expect(getOpcoUrlByIdcc(1979)).toBeNull()
    expect(getOpcoUrlByIdcc(null)).toBeNull()
  })
})
