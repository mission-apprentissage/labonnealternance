"use client"

import { useRouter } from "next/navigation"
import { useCallback } from "react"
import type { ILbaItemFormation, ILbaItemLbaCompany, ILbaItemLbaJob, ILbaItemPartnerJob } from "shared"

import { useCandidatRechercheParams } from "@/app/(candidat)/recherche/_hooks/useCandidatRechercheParams"
import { getResultItemUrl, type ILbaItemSignature } from "@/app/(candidat)/recherche/_hooks/useResultItemUrl"
import type { IRecherchePageParams } from "@/utils/routes.utils"
import type { LBA_ITEM_TYPE, LBA_ITEM_TYPE_OLD } from "shared/constants/lbaitem"

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
      router.push(url)
    },
    [searchParams, router]
  )

  return navigateToResultItemDetail
}
