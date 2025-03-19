"use client"

import { useRouter } from "next/navigation"
import { useCallback } from "react"
import type { ILbaItemFormation, ILbaItemLbaCompany, ILbaItemLbaJob, ILbaItemPartnerJob } from "shared"

import { useCandidatRechercheParams } from "@/app/(candidat)/recherche/_hooks/useCandidatRechercheParams"
import { getResultItemUrl } from "@/app/(candidat)/recherche/_hooks/useResultItemUrl"

export function useNavigateToResultItemDetail(): (item: ILbaItemLbaCompany | ILbaItemLbaJob | ILbaItemPartnerJob | ILbaItemFormation) => void {
  const searchParams = useCandidatRechercheParams()
  const router = useRouter()

  const navigateToResultItemDetail = useCallback(
    (item: ILbaItemLbaCompany | ILbaItemLbaJob | ILbaItemPartnerJob | ILbaItemFormation) => {
      const url = getResultItemUrl(item, searchParams)
      router.push(url)
    },
    [searchParams, router]
  )

  return navigateToResultItemDetail
}
