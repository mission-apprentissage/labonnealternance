"use client"

import { useRouter } from "next/navigation"
import { useCallback } from "react"

import { getItemReference, getResultItemUrl, IRecherchePageParams, ItemReferenceLike } from "@/app/(candidat)/recherche/_utils/recherche.route.utils"

export function useNavigateToResultItemDetail(params: IRecherchePageParams): (item: ItemReferenceLike, newParams?: Partial<IRecherchePageParams>, replace?: boolean) => void {
  const router = useRouter()

  const navigateToResultItemDetail = useCallback(
    (item: ItemReferenceLike, newParams: Partial<IRecherchePageParams> = {}, replace: boolean = false) => {
      const url = getResultItemUrl(item, {
        ...params,
        activeItems: [getItemReference(item)],
        ...newParams,
      })

      if (replace) {
        router.replace(url)
      } else {
        router.push(url)
      }
    },
    [params, router]
  )

  return navigateToResultItemDetail
}
