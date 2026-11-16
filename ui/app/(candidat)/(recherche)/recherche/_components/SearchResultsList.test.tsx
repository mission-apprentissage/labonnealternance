import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it, vi } from "vitest"
import { notifyJobSearchViewV3 } from "@/utils/api"
import { useSearchViewNotifier } from "../_hooks/use-search-view-notifier"
import type { ISearchPageParams } from "../_utils/search.params.utils"
import { SearchResultsList } from "./SearchResultsList"

vi.mock("./SearchHitCard", () => ({ SearchHitCard: () => <article /> }))
vi.mock("@/utils/api", () => ({ notifyJobSearchViewV3: vi.fn() }))
vi.mock("../_hooks/use-search-view-notifier", async (importOriginal) => {
  const mod = await importOriginal<typeof import("../_hooks/use-search-view-notifier")>()
  return { ...mod, useSearchViewNotifier: vi.fn(mod.useSearchViewNotifier) }
})

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

describe("SearchResultsList, comptage des apparitions en recherche", () => {
  const mixedPage = {
    hits: [
      { _id: "6650a0000000000000000001", url_id: "6650a0000000000000000001", type: "offre" },
      { _id: "6650a0000000000000000002", url_id: "cle-ministere-educatif", type: "formation" },
      { _id: "6650a0000000000000000003", url_id: "12345678900011", type: "offre" },
    ],
    nbHits: 3,
  }

  it("transmet les ids des offres affichées, sans les formations", () => {
    render([mixedPage as never], false)

    expect(vi.mocked(useSearchViewNotifier)).toHaveBeenLastCalledWith(["6650a0000000000000000001", "6650a0000000000000000003"])
  })

  it("n'envoie rien au rendu serveur, celui que voient les robots", () => {
    render([mixedPage as never], false)

    expect(vi.mocked(notifyJobSearchViewV3)).not.toHaveBeenCalled()
  })
})

describe("SearchResultsList, proposition du mode emplois à l'état vide", () => {
  const renderEmpty = (emploisFallback?: Parameters<typeof SearchResultsList>[0]["emploisFallback"]) =>
    renderToStaticMarkup(
      <SearchResultsList
        result={
          { data: { pages: [page(0, 0, 0)], pageParams: [0] }, isLoading: false, isError: false, fetchNextPage: vi.fn(), hasNextPage: false, isFetchingNextPage: false } as never
        }
        params={{ mode: "emplois_formation", radius: 100 } as ISearchPageParams}
        emploisFallback={emploisFallback}
      />
    )

  it("propose le mode emplois avec le nombre de résultats", () => {
    const html = renderEmpty({ count: { status: "done", count: 1234 }, onSwitch: vi.fn() })
    expect(html).toContain("Aucun résultat trouvé")
    expect(html).toContain("Votre recherche trouve 1234 résultats en mode « Emplois uniquement »")
    expect(html).toContain("Voir ces résultats")
  })

  it("garde l'état vide seul quand le mode emplois ne trouve rien non plus", () => {
    const html = renderEmpty({ count: { status: "done", count: 0 }, onSwitch: vi.fn() })
    expect(html).toContain("Aucun résultat trouvé")
    expect(html).not.toContain("Voir ces résultats")
  })

  it("attend la fin du comptage avant d'afficher l'état vide", () => {
    expect(renderEmpty({ count: { status: "pending" }, onSwitch: vi.fn() })).not.toContain("Aucun résultat trouvé")
  })

  it("n'affiche aucune proposition hors comptage", () => {
    expect(renderEmpty({ count: { status: "idle" }, onSwitch: vi.fn() })).not.toContain("Voir ces résultats")
    expect(renderEmpty()).not.toContain("Voir ces résultats")
  })
})
