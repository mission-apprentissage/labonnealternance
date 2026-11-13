import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"
import { TwoColumnFormLayout } from "./TwoColumnFormLayout"

const render = (withAside: boolean) =>
  renderToStaticMarkup(<TwoColumnFormLayout aside={withAside ? <p>ASIDE</p> : undefined} content={<input name="champ" />} buttons={<button type="submit">Enregistrer</button>} />)

describe("TwoColumnFormLayout", () => {
  it("place l'aside avant le formulaire, puis les boutons, dans l'ordre du DOM (ordre de tabulation)", () => {
    const html = render(true)

    const positions = ["ASIDE", 'name="champ"', "Enregistrer"].map((marker) => html.indexOf(marker))
    expect(positions.every((position) => position >= 0)).toBe(true)
    expect([...positions].sort((a, b) => a - b)).toEqual(positions)
  })

  it("sans aside, une seule colonne : pas de colonne vide réservée à gauche", () => {
    const asideColumn = "minmax(260px, 360px)"

    expect(render(true)).toContain(asideColumn)
    expect(render(false)).not.toContain(asideColumn)
    expect(render(false)).toContain('name="champ"')
  })
})
