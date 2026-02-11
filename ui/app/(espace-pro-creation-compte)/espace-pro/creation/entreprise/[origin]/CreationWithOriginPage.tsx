"use client"

import { useParams } from "next/navigation"
import { Suspense } from "react"

import { AUTHTYPE } from "@/common/contants"
import CreationCompte from "@/components/espace_pro/Authentification/CreationCompte"

export default function CreationEntreprise() {
  const { origin } = useParams() as { origin: string }
  return (
    <Suspense>
      <CreationCompte type={AUTHTYPE.ENTREPRISE} origin={origin} isWidget={false} />
    </Suspense>
  )
}
