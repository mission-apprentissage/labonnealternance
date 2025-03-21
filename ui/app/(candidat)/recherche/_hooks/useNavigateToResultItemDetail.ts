"use client"

import { useRouter } from "next/navigation"
import { useCallback } from "react"

import { useCandidatRechercheParams } from "@/app/(candidat)/recherche/_hooks/useCandidatRechercheParams"
import { getItemReference, getResultItemUrl, IRecherchePageParams, ItemReferenceLike } from "@/app/(candidat)/recherche/_utils/recherche.route.utils"

export function useNavigateToResultItemDetail(): (item: ItemReferenceLike, newParams?: Partial<IRecherchePageParams>, replace?: boolean) => void {
  const searchParams = useCandidatRechercheParams()
  const router = useRouter()

  const navigateToResultItemDetail = useCallback(
    (item: ItemReferenceLike, newParams: Partial<IRecherchePageParams> = {}, replace: boolean = false) => {
      const url = getResultItemUrl(item, {
        ...searchParams,
        activeItems: [getItemReference(item)],
        ...newParams,
      })

      if (replace) {
        router.replace(url)
      } else {
        router.push(url)
      }
    },
    [searchParams, router]
  )

  return navigateToResultItemDetail
}
