"use client"

import { useRouter } from "next/navigation"
import { useCallback } from "react"

import { RechercheForm } from "@/app/(home)/_components/RechercheForm"
import { IRecherchePageParams, PAGES } from "@/utils/routes.utils"

export function HomeRechercheForm() {
  const router = useRouter()

  const onSubmit = useCallback((params: IRecherchePageParams) => {
    router.push(PAGES.dynamic.recherche(params).getPath())
  }, [])

  return <RechercheForm onSubmit={onSubmit} />
}
