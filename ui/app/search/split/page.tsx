import type { Metadata } from "next"
import { Suspense } from "react"
import { SearchSplitPageClient } from "../_components/SearchSplitPageClient"
import { parseSearchPageParams } from "../_utils/search.params.utils"

type Props = {
  searchParams: Promise<Record<string, string>>
}

export const metadata: Metadata = {
  title: "Recherche — La Bonne Alternance",
}

export default async function SearchSplitPage({ searchParams }: Props) {
  const urlSearchParams = new URLSearchParams(await searchParams)
  const params = parseSearchPageParams(urlSearchParams)

  return (
    <Suspense>
      <SearchSplitPageClient initialParams={params} />
    </Suspense>
  )
}
