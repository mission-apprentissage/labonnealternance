import { describe, expect, it } from "vitest"

import { promoteSmartApplyHits } from "@/services/search/promote-smart-apply"

type Hit = { id: string; smart_apply: boolean | null }

// "s" = smart_apply true, "n" = false, "x" = null ; l'index sert d'identifiant.
const build = (pattern: string): Hit[] => [...pattern].map((c, i) => ({ id: `${c}${i}`, smart_apply: c === "s" ? true : c === "n" ? false : null }))
const ids = (hits: Hit[]) => hits.map((hit) => hit.id)

const firstPage = { page: 0, mode: "emplois" } as const

describe("promoteSmartApplyHits", () => {
  it("place les 3 premières offres Smart Apply en tête, puis le reste dans l'ordre du moteur", () => {
    const hits = build("nnsnsnss")
    expect(ids(promoteSmartApplyHits(hits, firstPage))).toEqual(["s2", "s4", "s6", "n0", "n1", "n3", "n5", "s7"])
  })

  it("remonte 1 ou 2 offres Smart Apply quand la page en compte moins de 3", () => {
    expect(ids(promoteSmartApplyHits(build("nnns"), firstPage))).toEqual(["s3", "n0", "n1", "n2"])
    expect(ids(promoteSmartApplyHits(build("nsnns"), firstPage))).toEqual(["s1", "s4", "n0", "n2", "n3"])
  })

  it("ne change rien sans offre Smart Apply", () => {
    const hits = build("nnxn")
    expect(ids(promoteSmartApplyHits(hits, firstPage))).toEqual(ids(hits))
  })

  it("ne change rien quand les offres Smart Apply sont déjà en tête", () => {
    const hits = build("sssnsn")
    expect(ids(promoteSmartApplyHits(hits, firstPage))).toEqual(ids(hits))
  })

  it("ne remonte pas smart_apply à null", () => {
    expect(ids(promoteSmartApplyHits(build("xxsx"), firstPage))).toEqual(["s2", "x0", "x1", "x3"])
  })

  it("conserve la longueur et les éléments", () => {
    const hits = build("nsxnssnsx")
    const result = promoteSmartApplyHits(hits, firstPage)
    expect(result).toHaveLength(hits.length)
    expect(new Set(result)).toEqual(new Set(hits))
  })

  it("ne modifie pas les pages suivantes", () => {
    const hits = build("nnsss")
    expect(promoteSmartApplyHits(hits, { page: 1, mode: "emplois" })).toBe(hits)
  })

  it.each(["formations", "emplois_formation"] as const)("ne modifie pas le mode %s", (mode) => {
    const hits = build("nnsss")
    expect(promoteSmartApplyHits(hits, { page: 0, mode })).toBe(hits)
  })
})
