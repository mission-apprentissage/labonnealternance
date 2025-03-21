"use client"

import { useRouter } from "next/navigation"
import { useCallback } from "react"

import { useCandidatRechercheParams } from "@/app/(candidat)/recherche/_hooks/useCandidatRechercheParams"
import { detectModeFromParams, type IRechercheMode, type IRecherchePageParams } from "@/app/(candidat)/recherche/_utils/recherche.route.utils"
import { PAGES } from "@/utils/routes.utils"

function getUrl(params: Required<IRecherchePageParams>, mode: IRechercheMode): string {
  if (mode == "formations-only") {
    return PAGES.dynamic.rechercheFormation(params).getPath()
  }
  if (mode === "jobs-only") {
    return PAGES.dynamic.rechercheEmploi(params).getPath()
  }

  return PAGES.dynamic.recherche(params).getPath()
}

export function useNavigateToRecherchePage(): (newParams: Partial<IRecherchePageParams>, replace?: boolean) => void {
  const searchParams = useCandidatRechercheParams()
  const router = useRouter()

  const navigateToRecherchePage = useCallback(
    (newParams: Partial<IRecherchePageParams>, replace: boolean = false): void => {
      const finalParams = { ...searchParams, newParams }
      const mode = detectModeFromParams(finalParams)
      const url = getUrl(finalParams, mode)

      if (replace) {
        router.replace(url)
      } else {
        router.push(url)
      }
    },
    [searchParams, router]
  )

  return navigateToRecherchePage
}
