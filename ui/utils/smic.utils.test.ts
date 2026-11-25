import { describe, expect, it } from "vitest"
import { SMIC } from "@/config/simulateur-alternant"
import { DATE_EFFET_SMIC, FOURCHETTE_SALAIRE_APPRENTISSAGE, formatMontantSmicMensuel, SMIC_HORAIRE_BRUT } from "./smic.utils"

const normaliserEspaces = (texte: string) => texte.replace(/[  ]/g, " ")

describe("smic.utils", () => {
  it("calcule un pourcentage du SMIC mensuel brut arrondi au centime", () => {
    const attendu = Math.round(27 * SMIC.metropole.brut.mensuel) / 100
    expect(normaliserEspaces(formatMontantSmicMensuel(27))).toBe(`${attendu.toFixed(2).replace(".", ",")} €`)
  })

  it("formate les montants en euros à la française", () => {
    expect(normaliserEspaces(formatMontantSmicMensuel(100))).toMatch(/^\d \d{3},\d{2} €$/)
    expect(normaliserEspaces(formatMontantSmicMensuel(100, { arrondi: true }))).toMatch(/^\d \d{3} €$/)
    expect(normaliserEspaces(SMIC_HORAIRE_BRUT)).toMatch(/^\d{2},\d{2} €$/)
  })

  it("affiche la date d'effet du barème", () => {
    expect(DATE_EFFET_SMIC).toMatch(/^(1er|[12]?\d|3[01]) \p{L}+ \d{4}$/u)
  })

  it("donne la fourchette légale apprenti de 27 % à 100 % du SMIC, arrondie à l'euro", () => {
    const min = Math.round(0.27 * SMIC.metropole.brut.mensuel)
    const max = Math.round(SMIC.metropole.brut.mensuel)
    const enMilliers = (n: number) => n.toString().replace(/\B(?=(\d{3})+$)/g, " ")
    expect(normaliserEspaces(FOURCHETTE_SALAIRE_APPRENTISSAGE)).toBe(`${enMilliers(min)}€ - ${enMilliers(max)}€`)
  })
})
