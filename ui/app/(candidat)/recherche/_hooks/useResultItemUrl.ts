"use client"

import { useMemo } from "react"
import type { ILbaItemFormation, ILbaItemLbaCompany, ILbaItemLbaJob, ILbaItemPartnerJob } from "shared"
import { LBA_ITEM_TYPE, oldItemTypeToNewItemType } from "shared/constants/lbaitem"

import { useCandidatRechercheParams } from "@/app/(candidat)/recherche/_hooks/useCandidatRechercheParams"
import { IRecherchePageParams, PAGES } from "@/utils/routes.utils"

export function getResultItemUrl(item: ILbaItemLbaCompany | ILbaItemLbaJob | ILbaItemPartnerJob | ILbaItemFormation, searchParams: Partial<IRecherchePageParams> = {}): string {
  const type = oldItemTypeToNewItemType(item.ideaType)
  if (type === LBA_ITEM_TYPE.FORMATION) {
    return PAGES.dynamic
      .formationDetail({
        jobId: item.id,
        ...searchParams,
      })
      .getPath()
  }

  return PAGES.dynamic
    .jobDetail({
      type: type,
      jobId: item.id,
      ...searchParams,
    })
    .getPath()
}

export function useResultItemUrl(item: ILbaItemLbaCompany | ILbaItemLbaJob | ILbaItemPartnerJob | ILbaItemFormation): string {
  const searchParams = useCandidatRechercheParams()

  const url = useMemo(() => {
    return getResultItemUrl(item, searchParams)
  }, [item, searchParams])

  return url
}
