import { describe, expect, it } from "vitest"

import { simplifiedArrondissements, simplifiedItems } from "./arrondissements"

describe("arrondissements", () => {
  it(".simplifiedArrondissements : Simplifies the first item", async () => {
    const testedItems = getTownItems("nantes")
    expect(testedItems[0].label).not.toEqual("nantes")
    const res = simplifiedArrondissements(testedItems, "nantes")
    expect(testedItems).toEqual(testedItems)
    expect(res[0].label).toEqual("nantes")
  })

  it(".simplifiedItems : Do not change anything outsite Paris, Lyon, Marseille", async () => {
    const testedItems = getTownItems("nantes")
    expect(testedItems[0].label).not.toEqual("nantes")
    const res = simplifiedItems(testedItems, "nantes")
    expect(testedItems).toEqual(testedItems)
    expect(res).toEqual(testedItems)
  })

  it(".simplifiedItems : Change first item for Paris", async () => {
    const testedItems = getTownItems("Paris")
    expect(testedItems[0].label).not.toEqual("Paris")
    const res = simplifiedItems(testedItems, "Paris")
    expect(testedItems).toEqual(testedItems)
    expect(res[0].label).toEqual("Paris")
  })

  it(".simplifiedItems : Change first item for Lyon", async () => {
    const testedItems = getTownItems("Lyon")
    expect(testedItems[0].label).not.toEqual("Lyon")
    const res = simplifiedItems(testedItems, "Lyon")
    expect(testedItems).toEqual(testedItems)
    expect(res[0].label).toEqual("Lyon")
  })

  it(".simplifiedItems : Change first item for Marseille", async () => {
    const testedItems = getTownItems("Marseille")
    expect(testedItems[0].label).not.toEqual("Marseille")
    const res = simplifiedItems(testedItems, "Marseille")
    expect(testedItems).toEqual(testedItems)
    expect(res[0].label).toEqual("Marseille")
  })

  const getTownItems = function (townName) {
    return [
      {
        value: {
          type: "Point",
          coordinates: [2.347, 48.859],
        },
        insee: "75056",
        zipcode: "75001",
        label: `${townName} 75001`,
      },
      {
        value: {
          type: "Point",
          coordinates: [2.295289, 48.841959],
        },
        insee: "75115",
        zipcode: "75015",
        label: `${townName} 15e Arrondissement 75015`,
      },
    ]
  }
})
