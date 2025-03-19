"use client"

import { usePathname, useRouter } from "next/navigation"
import { useCallback, useMemo } from "react"

import { useCandidatRechercheParams } from "@/app/(candidat)/recherche/_hooks/useCandidatRechercheParams"
import { IRecherchePageParams, PAGES } from "@/utils/routes.utils"

export function useUpdateCandidatSearchParam(): (newParams: Partial<IRecherchePageParams>, replace?: boolean) => void {
  const searchParams = useCandidatRechercheParams()
  const router = useRouter()

  const currentPath = usePathname()

  const isCandidateSearchPage = useMemo(() => {
    if (globalThis.window == null) return false

    const pagePath = new URL(PAGES.dynamic.recherche(null).getPath(), globalThis.window.location.origin).pathname

    return currentPath === pagePath
  }, [currentPath])

  const updateCandidatSearchParam = useCallback(
    (newParams: Partial<IRecherchePageParams>, replace: boolean = false): void => {
      const newUrl = PAGES.dynamic
        .recherche({
          ...searchParams,
          ...newParams,
        })
        .getPath()

      if (isCandidateSearchPage && globalThis.window != null) {
        if (replace) {
          globalThis.window.history.replaceState(null, "", newUrl)
        } else {
          globalThis.window.history.pushState(null, "", newUrl)
        }
      } else {
        router.push(newUrl)
      }
    },
    [searchParams, isCandidateSearchPage, router]
  )

  return updateCandidatSearchParam
}
