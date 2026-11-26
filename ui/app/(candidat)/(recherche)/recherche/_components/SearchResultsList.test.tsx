import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it, vi } from "vitest"
import { notifyJobSearchViewV3 } from "@/utils/api"
import { ApiError } from "@/utils/api.utils"
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

describe("SearchResultsList, structure de la liste", () => {
  it("rend les résultats dans une liste, un élément par carte", () => {
    const html = render([page(0, 3, 3)], false)
    expect(html).toContain('<ul class="fr-raw-list')
    expect(html.match(/<li><article><\/article><\/li>/g)).toHaveLength(3)
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

describe("SearchResultsList, erreurs de chargement", () => {
  const GENERIC = "Une erreur est survenue lors du chargement des résultats."
  const RATE_LIMITED = "Trop de recherches ont été lancées en peu de temps. Réessayez dans quelques secondes."
  const RETRY = "Relancer la recherche"
  const apiError = (status: number) => ApiError.build("/v1/search", new Headers(), {}, new Response("", { status }))

  const withError = async (status: number, pages: ReturnType<typeof page>[] | null, hasNextPage = false) => {
    const error = await apiError(status)
    return renderToStaticMarkup(
      <SearchResultsList
        result={
          {
            data: pages ? { pages, pageParams: pages.map((_, i) => i) } : undefined,
            isLoading: false,
            isError: true,
            isFetching: false,
            error,
            fetchNextPage: vi.fn(),
            refetch: vi.fn(),
            hasNextPage,
            isFetchingNextPage: false,
          } as never
        }
        params={{ radius: 30 } as ISearchPageParams}
      />
    )
  }

  it("garde les résultats affichés et ajoute le message à la suite après un « Voir plus » limité", async () => {
    const html = await withError(429, [page(0, 20, 1140), page(20, 20, 1140)], true)
    expect(html.match(/<li><article><\/article><\/li>/g)).toHaveLength(40)
    expect(html).toContain(RATE_LIMITED)
    expect(html.indexOf(RATE_LIMITED)).toBeGreaterThan(html.lastIndexOf("<article>"))
    expect(html).toContain("Voir plus de résultats")
    expect(html).not.toContain(GENERIC)
  })

  it("n'annonce pas le message par l'alerte, la zone de statut de la page s'en charge", async () => {
    const html = await withError(429, [page(0, 20, 1140)], true)
    expect(html).not.toContain('role="alert"')
  })

  it("affiche le message dédié et un bouton de relance au premier chargement", async () => {
    const html = await withError(429, null)
    expect(html).toContain(RATE_LIMITED)
    expect(html).toContain(RETRY)
    expect(html).not.toContain(GENERIC)
    expect(html).not.toContain('role="alert"')
  })

  it.each([
    ["sans résultat chargé", null],
    ["avec des résultats chargés", [page(0, 20, 1140)]],
  ])("garde l'erreur générique pour une 500, %s", async (_label, pages) => {
    const html = await withError(500, pages)
    expect(html).toContain(GENERIC)
    expect(html).not.toContain(RATE_LIMITED)
    expect(html).not.toContain(RETRY)
    expect(html).not.toContain("<article>")
    expect(html).toContain('role="alert"')
  })
})
