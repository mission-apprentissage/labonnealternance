"use client"

import { useRouter } from "next/navigation"
import { useCallback } from "react"

import { useCandidatRechercheParams } from "@/app/(candidat)/recherche/_hooks/useCandidatRechercheParams"
import { getResultItemUrl, type ILbaItemSignature } from "@/app/(candidat)/recherche/_hooks/useResultItemUrl"
import type { IRecherchePageParams } from "@/utils/routes.utils"

export function useNavigateToResultItemDetail(): (item: ILbaItemSignature, newParams?: Partial<IRecherchePageParams>, replace?: boolean) => void {
  const searchParams = useCandidatRechercheParams()
  const router = useRouter()

  const navigateToResultItemDetail = useCallback(
    (item: ILbaItemSignature, newParams: Partial<IRecherchePageParams> = {}, replace: boolean = false) => {
      const url = getResultItemUrl(item, {
        ...searchParams,
        selection: [item.id],
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
