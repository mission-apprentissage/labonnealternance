import { useSearchParams } from "next/navigation"
import { useMemo } from "react"

import { IRecherchePageParams, parseRecherchePageParams } from "@/app/(candidat)/recherche/_utils/recherche.route.utils"

export function useCandidatRechercheParams(): Required<IRecherchePageParams> | null {
  const searchParams = useSearchParams()

  const params = useMemo(() => parseRecherchePageParams(searchParams), [searchParams])

  return params
}
