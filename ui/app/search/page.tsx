import type { Metadata } from "next"
import { Suspense } from "react"
import { SearchPageClient } from "./_components/SearchPageClient"
import { parseSearchPageParams } from "./_utils/search.params.utils"

type Props = {
  searchParams: Promise<Record<string, string>>
}

export const metadata: Metadata = {
  title: "Recherche — La Bonne Alternance",
}

export default async function SearchPage({ searchParams }: Props) {
  const urlSearchParams = new URLSearchParams(await searchParams)
  const params = parseSearchPageParams(urlSearchParams)

  return (
    <Suspense>
      <SearchPageClient initialParams={params} />
    </Suspense>
  )
}
