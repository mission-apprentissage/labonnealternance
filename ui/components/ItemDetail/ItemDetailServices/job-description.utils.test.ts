import { describe, expect, it } from "vitest"

import { getRecruiterWrittenDescription, isDisplayableDescription } from "./job-description.utils"

const ROME_DEFINITION =
  "Réalise des travaux de maintenance préventive et corrective sur des équipements industriels, selon les règles de sécurité et les impératifs de production. Peut coordonner une équipe."

// le formulaire de dépôt LBA accepte une description à partir de 30 caractères
const SHORT_LBA_DESCRIPTION = "Test d'une nouvelle description offre"
const WRITTEN = "Vous rejoindrez notre atelier de 12 personnes pour préparer un BTS maintenance, avec un tuteur dédié dès la première semaine."

describe("isDisplayableDescription", () => {
  it("garde une description courte sur une offre LBA, validée à 30 caractères au dépôt", () => {
    expect(SHORT_LBA_DESCRIPTION.length).toBeLessThan(50)
    expect(isDisplayableDescription(SHORT_LBA_DESCRIPTION, true)).toBe(true)
  })

  it("écarte la même description sur un flux partenaire, où rien ne garantit son exploitabilité", () => {
    expect(isDisplayableDescription(SHORT_LBA_DESCRIPTION, false)).toBe(false)
  })

  it("écarte une description absente", () => {
    expect(isDisplayableDescription(null, true)).toBe(false)
    expect(isDisplayableDescription("", true)).toBe(false)
  })
})

describe("getRecruiterWrittenDescription", () => {
  it("retourne la description quand le recruteur l'a rédigée", () => {
    expect(getRecruiterWrittenDescription(WRITTEN, ROME_DEFINITION, true)).toBe(WRITTEN)
  })

  it("retourne une description courte rédigée sur une offre LBA", () => {
    expect(getRecruiterWrittenDescription(SHORT_LBA_DESCRIPTION, ROME_DEFINITION, true)).toBe(SHORT_LBA_DESCRIPTION)
  })

  it("retourne null quand la description est la définition ROME recopiée", () => {
    expect(getRecruiterWrittenDescription(ROME_DEFINITION, ROME_DEFINITION, true)).toBe(null)
  })

  it("retourne null sur une description absente", () => {
    expect(getRecruiterWrittenDescription(null, ROME_DEFINITION, true)).toBe(null)
    expect(getRecruiterWrittenDescription(undefined, ROME_DEFINITION, true)).toBe(null)
  })

  it("retourne la description quand aucune définition ROME n'est disponible", () => {
    expect(getRecruiterWrittenDescription(WRITTEN, null, true)).toBe(WRITTEN)
  })

  it("ne confond pas une description qui commence par la définition ROME avec une recopie", () => {
    const written = `${ROME_DEFINITION} Chez nous, vous serez accompagné par un tuteur dédié et formé sur nos lignes de production.`
    expect(getRecruiterWrittenDescription(written, ROME_DEFINITION, true)).toBe(written)
  })
})
