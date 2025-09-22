"use client"

import { useRouter } from "next/navigation"
import { useCallback } from "react"

import { detectModeFromParams, IRecherchePageParams } from "@/app/(candidat)/(recherche)/recherche/_utils/recherche.route.utils"
import { PAGES } from "@/utils/routes.utils"

export function useNavigateToRecherchePage(searchParams: IRecherchePageParams): (newParams: Partial<IRecherchePageParams>, replace?: boolean) => void {
  const router = useRouter()

  const navigateToRecherchePage = useCallback(
    (newParams: Partial<IRecherchePageParams>, replace: boolean = false): void => {
      const finalParams = { ...searchParams, ...newParams }
      const mode = detectModeFromParams(finalParams)
      const url = PAGES.dynamic.genericRecherche({ rechercheParams: finalParams, mode }).getPath()

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
