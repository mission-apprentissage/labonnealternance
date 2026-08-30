import type { Metadata } from "next"
import { Suspense } from "react"
import { RechercheSeoContent } from "./_components/RechercheSeoContent"
import { SearchPageClient } from "./_components/SearchPageClient"
import { buildRecherchePageMetadata } from "./_utils/recherche.metadata.utils"
import { parseSearchPageParamsWithLegacy } from "./_utils/search.legacy.utils"

type Props = {
  searchParams: Promise<Record<string, string>>
}

// Titre ajusté à la recherche (métier / lieu / mode), comme le moteur legacy.
// Les navigations client (router.replace) re-fetchent le payload RSC → Next met à jour
// document.title à chaque recherche. Repli sur les URL legacy `?job_name=` (cf. util) pour ne
// pas servir un titre générique aux pages métier indexées par Google.
export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  return buildRecherchePageMetadata(new URLSearchParams(await searchParams))
}

export default async function RecherchePage({ searchParams }: Props) {
  const urlSearchParams = new URLSearchParams(await searchParams)
  const params = parseSearchPageParamsWithLegacy(urlSearchParams)

  return (
    <>
      <RechercheSeoContent params={params} />
      <Suspense>
        <SearchPageClient initialParams={params} />
      </Suspense>
    </>
  )
}
