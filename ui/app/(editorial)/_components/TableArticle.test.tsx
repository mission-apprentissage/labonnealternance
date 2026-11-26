import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"
import { TableArticle } from "./TableArticle"

const headers = ["Âge de l'apprenti", "1re année", "2e année"]
const data = [
  ["Moins de 18 ans", "27 %", "39 %"],
  ["18 à 20 ans", "43 %", "51 %"],
]

const tbodyOf = (html: string) => html.match(/<tbody>.*<\/tbody>/)?.[0] ?? ""
const tableClassesOf = (html: string) => html.match(/class="([^"]*\bfr-table\b[^"]*)"/)?.[1].split(" ") ?? []

describe("TableArticle", () => {
  it("rend un caption et des en-têtes de colonne (RGAA 5.4, 5.6)", () => {
    const html = renderToStaticMarkup(<TableArticle caption="Rémunération" headers={headers} data={data} />)

    expect(tableClassesOf(html)).toEqual(expect.arrayContaining(["fr-table", "fr-table--layout-fixed"]))
    expect(tableClassesOf(html)).not.toContain("fr-table--no-caption")
    // Le caption doit être le premier enfant du table (HTML) pour titrer le tableau.
    expect(html).toMatch(/<table[^>]*><caption>Rémunération<\/caption>/)
    expect(html.match(/<th scope="col">/g)).toHaveLength(3)
  })

  it("ne rend que des td dans le tbody sans rowHeader", () => {
    const tbody = tbodyOf(renderToStaticMarkup(<TableArticle caption="Titre" headers={headers} data={data} />))

    expect(tbody).not.toContain("<th")
    expect(tbody.match(/<td>/g)).toHaveLength(6)
  })

  it("rend la première cellule de chaque ligne en th scope=row avec rowHeader (RGAA 5.6, 5.7)", () => {
    const tbody = tbodyOf(renderToStaticMarkup(<TableArticle caption="Titre" rowHeader headers={headers} data={data} />))

    expect([...tbody.matchAll(/<th scope="row">([^<]*)<\/th>/g)].map(([, text]) => text)).toEqual(["Moins de 18 ans", "18 à 20 ans"])
    expect(tbody.match(/<td>/g)).toHaveLength(4)
  })

  it("masque visuellement le caption avec captionHidden en le gardant dans le tableau", () => {
    const html = renderToStaticMarkup(<TableArticle caption="Titre" captionHidden headers={headers} data={data} />)

    expect(tableClassesOf(html)).toContain("fr-table--no-caption")
    expect(html).toMatch(/<table[^>]*><caption>Titre<\/caption>/)
  })
})
