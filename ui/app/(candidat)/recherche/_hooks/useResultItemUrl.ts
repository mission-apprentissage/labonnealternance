"use client"

import { useMemo } from "react"
import type { ILbaItemFormation, ILbaItemLbaCompany, ILbaItemLbaJob, ILbaItemPartnerJob } from "shared"
import { LBA_ITEM_TYPE, oldItemTypeToNewItemType, type LBA_ITEM_TYPE_OLD } from "shared/constants/lbaitem"

import { useCandidatRechercheParams } from "@/app/(candidat)/recherche/_hooks/useCandidatRechercheParams"
import { IRecherchePageParams, PAGES } from "@/utils/routes.utils"

export type ILbaItemSignature = {
  id?: string
  ideaType?: LBA_ITEM_TYPE | LBA_ITEM_TYPE_OLD
}

export function getResultItemUrl(item: ILbaItemSignature, searchParams: Partial<IRecherchePageParams> = {}): string {
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

export function useResultItemUrl(item: ILbaItemSignature): string {
  const searchParams = useCandidatRechercheParams()

  const url = useMemo(() => {
    return getResultItemUrl(item, { ...searchParams, selection: [item.id] })
  }, [item, searchParams])

  return url
}
