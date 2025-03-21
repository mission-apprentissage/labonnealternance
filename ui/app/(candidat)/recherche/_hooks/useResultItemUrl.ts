"use client"

import { useMemo } from "react"

import { useCandidatRechercheParams } from "@/app/(candidat)/recherche/_hooks/useCandidatRechercheParams"
import { getItemReference, getResultItemUrl, ItemReferenceLike } from "@/app/(candidat)/recherche/_utils/recherche.route.utils"

export function useResultItemUrl(item: ItemReferenceLike): string {
  const searchParams = useCandidatRechercheParams()

  const url = useMemo(() => {
    return getResultItemUrl(item, { ...searchParams, activeItems: [getItemReference(item)] })
  }, [item, searchParams])

  return url
}
