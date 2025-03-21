"use client"

import { usePathname, useSearchParams } from "next/navigation"
import { useMemo } from "react"

import { IRecherchePageParams, parseRecherchePageParams, type IRechercheMode } from "@/app/(candidat)/recherche/_utils/recherche.route.utils"
import { PAGES } from "@/utils/routes.utils"

function useRechercheMode(): IRechercheMode {
  const currentPath = usePathname()

  return useMemo(() => {
    if (globalThis.window == null) {
      return "default"
    }

    const formationPath = new URL(PAGES.dynamic.rechercheFormation(null).getPath(), globalThis.window.location.origin).pathname
    const emploiPath = new URL(PAGES.dynamic.rechercheEmploi(null).getPath(), globalThis.window.location.origin).pathname

    if (currentPath === formationPath) {
      return "formations-only"
    }

    if (currentPath === emploiPath) {
      return "jobs-only"
    }

    return "default"
  }, [currentPath])
}

export function useCandidatRechercheParams(): Required<IRecherchePageParams> | null {
  const searchParams = useSearchParams()
  const mode = useRechercheMode()

  const params = useMemo(() => {
    return parseRecherchePageParams(searchParams, mode)
  }, [searchParams, mode])

  return params
}
