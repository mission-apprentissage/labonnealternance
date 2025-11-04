"use client"

import { useMemo } from "react"

import type { ItemReferenceLike, getItemReference, getResultItemUrl, type IRecherchePageParams } from "@/app/(candidat)/(recherche)/recherche/_utils/recherche.route.utils";

export function useResultItemUrl(item: ItemReferenceLike, rechercheParams: IRecherchePageParams): string {
  const url = useMemo(() => {
    return item ? getResultItemUrl(item, { ...rechercheParams, activeItems: [getItemReference(item)] }) : null
  }, [item, rechercheParams])

  return url
}
