import type { ReactElement } from "react"
import { describe, expect, it, vi } from "vitest"

import type { ISearchPageParams } from "./_utils/search.params.utils"
import RecherchePage from "./page"

vi.mock("./_components/RechercheSeoContent", () => ({ RechercheSeoContent: () => null }))
vi.mock("./_components/SearchPageClient", () => ({ SearchPageClient: () => null }))

describe("RecherchePage", () => {
  it("transmet au rendu SSR les valeurs d'un filtre répété sans les joindre", async () => {
    const page = (await RecherchePage({ searchParams: Promise.resolve({ q: "Data Analyst", contract_type: ["Apprentissage", "Professionnalisation"] }) })) as ReactElement<{
      children: ReactElement<{ params: ISearchPageParams }>[]
    }>
    const [seoContent] = page.props.children
    expect(seoContent.props.params.contract_type).toEqual(["Apprentissage", "Professionnalisation"])
  })
})
