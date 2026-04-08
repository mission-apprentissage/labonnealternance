import { useRouter } from "next/navigation"
import { useCallback } from "react"

import type { ISearchPageParams } from "../_utils/search.params.utils"
import { buildSearchUrl } from "../_utils/search.params.utils"

export function useNavigateToSearchPage() {
  const router = useRouter()

  const navigate = useCallback(
    (newParams: ISearchPageParams) => {
      router.push(buildSearchUrl(newParams))
    },
    [router]
  )

  const navigateSilent = useCallback(
    (newParams: ISearchPageParams) => {
      router.replace(buildSearchUrl(newParams))
    },
    [router]
  )

  return { navigate, navigateSilent }
}
