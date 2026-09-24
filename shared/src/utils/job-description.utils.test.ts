import { describe, expect, it } from "vitest"

import { isRomeDefinition } from "./job-description.utils.js"

const ROME_DEFINITION =
  "Réalise des travaux de maintenance préventive et corrective sur des équipements industriels, selon les règles de sécurité et les impératifs de production. Peut coordonner une équipe."

describe("isRomeDefinition", () => {
  it("reconnaît la définition ROME recopiée à l'identique", () => {
    expect(isRomeDefinition(ROME_DEFINITION, ROME_DEFINITION)).toBe(true)
  })

  it("reconnaît la définition ROME malgré des différences d'espacement", () => {
    const reindented = `  ${ROME_DEFINITION.replace(", selon", ",\n  selon")}\n`
    expect(isRomeDefinition(reindented, ROME_DEFINITION)).toBe(true)
  })

  it("ne confond pas une description rédigée avec la définition", () => {
    expect(isRomeDefinition("Vous rejoindrez notre atelier de 12 personnes pour préparer un BTS maintenance.", ROME_DEFINITION)).toBe(false)
  })

  it("ne confond pas une description qui commence par la définition avec une recopie", () => {
    expect(isRomeDefinition(`${ROME_DEFINITION} Chez nous, vous serez accompagné par un tuteur dédié.`, ROME_DEFINITION)).toBe(false)
  })

  it("répond faux quand l'un des deux textes manque", () => {
    expect(isRomeDefinition(null, ROME_DEFINITION)).toBe(false)
    expect(isRomeDefinition(undefined, ROME_DEFINITION)).toBe(false)
    expect(isRomeDefinition(ROME_DEFINITION, null)).toBe(false)
    expect(isRomeDefinition("", "")).toBe(false)
  })
})
