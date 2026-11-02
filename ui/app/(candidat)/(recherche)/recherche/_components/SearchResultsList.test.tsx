import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it, vi } from "vitest"
import type { ISearchPageParams } from "../_utils/search.params.utils"
import { SearchResultsList } from "./SearchResultsList"

vi.mock("./SearchHitCard", () => ({ SearchHitCard: () => <article /> }))

const HINT = "Affinez votre recherche"

const page = (from: number, count: number, nbHits: number) => ({
  hits: Array.from({ length: count }, (_, i) => ({ _id: `hit-${from + i}`, url_id: `hit-${from + i}` })),
  nbHits,
})

const render = (pages: ReturnType<typeof page>[], hasNextPage: boolean) =>
  renderToStaticMarkup(
    <SearchResultsList
      result={{ data: { pages, pageParams: pages.map((_, i) => i) }, isLoading: false, isError: false, fetchNextPage: vi.fn(), hasNextPage, isFetchingNextPage: false } as never}
      params={{ radius: 30 } as ISearchPageParams}
    />
  )

describe("SearchResultsList, fin de liste plafonnée par l'API", () => {
  it("invite à affiner quand la dernière page servie laisse des résultats non affichés", () => {
    const html = render([page(0, 20, 1140), page(20, 20, 1140)], false)
    expect(html).toContain("Les 40 premiers résultats sont affichés.")
    expect(html).not.toContain("Voir plus de résultats")
  })

  it("n'affiche rien au rendu d'une seule page, comme celui des robots", () => {
    expect(render([page(0, 20, 1140)], false)).not.toContain(HINT)
  })

  it("n'affiche rien quand tous les résultats sont chargés", () => {
    expect(render([page(0, 20, 35), page(20, 15, 35)], false)).not.toContain(HINT)
  })

  it("n'affiche rien tant que « Voir plus » reste disponible", () => {
    const html = render([page(0, 20, 1140), page(20, 20, 1140)], true)
    expect(html).not.toContain(HINT)
    expect(html).toContain("Voir plus de résultats")
  })
})
