import { describe, expect, it } from "vitest"

import type { IFormation } from "./formations-table.utils"
import { DEFAULT_FILTERS, filterFormations, groupByEmail, MISSING_EMAIL_GROUP, summarizeEmailChange } from "./formations-table.utils"

const formation = (data: Partial<IFormation>): IFormation =>
  ({
    _id: data.cle_ministere_educatif ?? "id",
    training_intitule_long: "BTS Management commercial opérationnel",
    cle_ministere_educatif: "cle",
    parcoursup_id: null,
    lieu_formation_zip_code: "75011",
    lieu_formation_city: "Paris",
    lieu_formation_email: "contact@cfa-exemple.fr",
    is_lieu_formation_email_customized: false,
    referrers: ["LBA"],
    referrers_forced_on: null,
    referrers_forced_off: null,
    referrers_auto: ["LBA"],
    referrers_eligible: ["LBA", "JEUNE_1_SOLUTION"],
    ...data,
  }) as IFormation

const cles = (formations: IFormation[]) => formations.map((item) => item.cle_ministere_educatif)

describe("filterFormations", () => {
  it("cherche sans tenir compte des accents ni de la casse", () => {
    const list = [
      formation({ cle_ministere_educatif: "a", training_intitule_long: "CAP Pâtissier" }),
      formation({ cle_ministere_educatif: "b", training_intitule_long: "CAP Cuisine" }),
    ]
    expect(cles(filterFormations(list, { ...DEFAULT_FILTERS, query: "patiss" }))).toEqual(["a"])
  })

  it("ne range pas une formation sans e-mail dans « personnalisé », même marquée comme telle", () => {
    const list = [
      formation({ cle_ministere_educatif: "perso", is_lieu_formation_email_customized: true }),
      formation({ cle_ministere_educatif: "vide-marque", lieu_formation_email: "", is_lieu_formation_email_customized: true }),
      formation({ cle_ministere_educatif: "catalogue" }),
    ]
    expect.soft(cles(filterFormations(list, { ...DEFAULT_FILTERS, email: "custom" }))).toEqual(["perso"])
    expect.soft(cles(filterFormations(list, { ...DEFAULT_FILTERS, email: "catalogue" }))).toEqual(["catalogue"])
    expect.soft(cles(filterFormations(list, { ...DEFAULT_FILTERS, email: "missing" }))).toEqual(["vide-marque"])
  })

  it("filtre sur la diffusion effective, pas sur l'automatique", () => {
    const list = [
      formation({ cle_ministere_educatif: "forcee-off", referrers: [], referrers_auto: ["LBA"], referrers_forced_off: ["LBA"] }),
      formation({ cle_ministere_educatif: "auto" }),
    ]
    expect.soft(cles(filterFormations(list, { ...DEFAULT_FILTERS, diffusion: "off:LBA" }))).toEqual(["forcee-off"])
    expect.soft(cles(filterFormations(list, { ...DEFAULT_FILTERS, diffusion: "forced" }))).toEqual(["forcee-off"])
    expect.soft(cles(filterFormations(list, { ...DEFAULT_FILTERS, diffusion: "none" }))).toEqual(["forcee-off"])
  })

  it("ne compte pas des listes de forçages vides comme un forçage", () => {
    const list = [formation({ cle_ministere_educatif: "vides", referrers_forced_on: [], referrers_forced_off: [] })]
    expect(filterFormations(list, { ...DEFAULT_FILTERS, diffusion: "forced" })).toEqual([])
  })
})

describe("groupByEmail", () => {
  it("trie par usage et range les formations sans e-mail en dernier", () => {
    const list = [
      formation({ cle_ministere_educatif: "1", lieu_formation_email: null }),
      formation({ cle_ministere_educatif: "2", lieu_formation_email: null }),
      formation({ cle_ministere_educatif: "3", lieu_formation_email: "rdv@cfa-exemple.fr" }),
    ]
    expect(groupByEmail(list)).toEqual([
      { email: "rdv@cfa-exemple.fr", count: 1 },
      { email: MISSING_EMAIL_GROUP, count: 2 },
    ])
  })
})

describe("summarizeEmailChange", () => {
  it("distingue les e-mails remplacés, complétés et inchangés", () => {
    const list = [
      formation({ lieu_formation_email: "contact@cfa-exemple.fr" }),
      formation({ lieu_formation_email: "rdv@cfa-exemple.fr", is_lieu_formation_email_customized: true }),
      formation({ lieu_formation_email: null }),
      formation({ lieu_formation_email: "nouveau@cfa-exemple.fr", is_lieu_formation_email_customized: true }),
    ]
    expect(summarizeEmailChange(list, " nouveau@cfa-exemple.fr ")).toEqual({ fromCatalogue: 1, fromCustom: 1, filled: 1, unchanged: 1 })
  })
})
