import { describe, expect, it } from "vitest"
import { getNeighborApplicationIds } from "./application-neighbors"

const applications = [{ _id: "a" }, { _id: "b" }, { _id: "c" }]

describe("getNeighborApplicationIds", () => {
  it("renvoie les candidatures qui encadrent la candidature affichée", () => {
    expect(getNeighborApplicationIds(applications, "b")).toEqual({ previous: "a", next: "c" })
  })

  it("n'a pas de voisine au-delà des extrémités de la liste", () => {
    expect(getNeighborApplicationIds(applications, "a")).toEqual({ previous: null, next: "b" })
    expect(getNeighborApplicationIds(applications, "c")).toEqual({ previous: "b", next: null })
  })

  it("renvoie null pour une candidature absente de la liste", () => {
    expect(getNeighborApplicationIds(applications, "z")).toBeNull()
  })
})
