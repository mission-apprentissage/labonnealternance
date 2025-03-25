"use client"

import { useMemo } from "react"

import { getItemReference, getResultItemUrl, ItemReferenceLike, type IRecherchePageParams } from "@/app/(candidat)/recherche/_utils/recherche.route.utils"

export function useResultItemUrl(item: ItemReferenceLike, params: IRecherchePageParams): string {
  const url = useMemo(() => {
    return getResultItemUrl(item, { ...params, activeItems: [getItemReference(item)] })
  }, [item, params])

  return url
}
