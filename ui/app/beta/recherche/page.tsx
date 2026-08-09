import type { Metadata } from "next"
import { Suspense } from "react"
import { SearchPageClient } from "../_components/SearchPageClient"
import { buildSearchPageTitle, parseSearchPageParams } from "../_utils/search.params.utils"

type Props = {
  searchParams: Promise<Record<string, string>>
}

// Titre ajusté à la recherche (métier / lieu / mode), comme le moteur legacy.
// Les navigations client (router.replace) re-fetchent le payload RSC → Next met à jour
// document.title à chaque recherche.
export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const params = parseSearchPageParams(new URLSearchParams(await searchParams))
  return { title: buildSearchPageTitle(params) }
}

export default async function BetaRecherchePage({ searchParams }: Props) {
  const urlSearchParams = new URLSearchParams(await searchParams)
  const params = parseSearchPageParams(urlSearchParams)

  return (
    <Suspense>
      <SearchPageClient initialParams={params} />
    </Suspense>
  )
}
