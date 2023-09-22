import { describe, expect, it, vi } from "vitest"

import onInputValueChangeService from "./onInputValueChangeService"

describe("onInputValueChangeService", () => {
  it("Sans appel API extérieur, la liste affichée à l'utilisateur est la liste des items, filtrée selon l'entrée initiale", async () => {
    const inputValue = "plo"
    const inputItems = []
    const items = [{ label: "plomberie" }, { label: "agriculture" }, { label: "ploermel" }]
    const setInputItems = vi.fn()

    await onInputValueChangeService({ inputValue, inputItems, items, setInputItems })

    expect(setInputItems).toHaveBeenCalledWith([{ label: "plomberie" }, { label: "ploermel" }])
  })

  it("Sans appel API extérieur, la liste affichée à l'utilisateur est la liste des items, filtrée selon l'entrée initiale, résiste aux majuscules/minuscules", async () => {
    const inputValue = "plo"
    const inputItems = []
    const items = [{ label: "PLomberie" }, { label: "AGriculture" }, { label: "Ploermel" }]
    const setInputItems = vi.fn()

    await onInputValueChangeService({ inputValue, inputItems, items, setInputItems })

    expect(setInputItems).toHaveBeenCalledWith([{ label: "PLomberie" }, { label: "Ploermel" }])
  })
})
