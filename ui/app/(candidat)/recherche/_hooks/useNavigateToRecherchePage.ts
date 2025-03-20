"use client"

import { useRouter } from "next/navigation"
import { useCallback } from "react"

import { useCandidatRechercheParams } from "@/app/(candidat)/recherche/_hooks/useCandidatRechercheParams"
import { IRecherchePageParams, PAGES } from "@/utils/routes.utils"

export function useNavigateToRecherchePage(): (newParams: Partial<IRecherchePageParams>, replace?: boolean) => void {
  const searchParams = useCandidatRechercheParams()
  const router = useRouter()

  const navigateToRecherchePage = useCallback(
    (newParams: Partial<IRecherchePageParams>, replace: boolean = false): void => {
      const newUrl = PAGES.dynamic
        .recherche({
          ...searchParams,
          ...newParams,
        })
        .getPath()
      

        if (replace) {
          router.replace(newUrl)
        } else {
          router.push(newUrl)
        }
    },
    [searchParams, router]
  )

  return navigateToRecherchePage
}
