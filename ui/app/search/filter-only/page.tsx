import type { Metadata } from "next"
import { Suspense } from "react"
import { SearchFilterOnlyPageClient } from "../_components/SearchFilterOnlyPageClient"
import { parseSearchPageParams } from "../_utils/search.params.utils"

type Props = {
  searchParams: Promise<Record<string, string>>
}

export const metadata: Metadata = {
  title: "Recherche — La Bonne Alternance",
}

export default async function SearchFilterOnlyPage({ searchParams }: Props) {
  const urlSearchParams = new URLSearchParams(await searchParams)
  const params = parseSearchPageParams(urlSearchParams)

  return (
    <Suspense>
      <SearchFilterOnlyPageClient initialParams={params} />
    </Suspense>
  )
}
