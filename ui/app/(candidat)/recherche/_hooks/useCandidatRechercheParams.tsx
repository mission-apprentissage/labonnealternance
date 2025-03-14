"use client"
import { useSearchParams } from "next/navigation"
import { useMemo } from "react"

import { IRecherchePageParams, parseRecherchePageParams } from "@/utils/routes.utils"

export function useCandidatRechercheParams(): Required<IRecherchePageParams> | null {
  const searchParams = useSearchParams()

  const params = useMemo(() => parseRecherchePageParams(searchParams), [searchParams?.toString()])

  return params
}
