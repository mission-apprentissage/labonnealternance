import { Suspense } from "react"

import type { Metadata } from "next"
import { AUTHTYPE } from "@/common/contants"
import CreationCompte from "@/components/espace_pro/Authentification/CreationCompte"
import { PAGES } from "@/utils/routes.utils"

export const metadata: Metadata = {
  title: PAGES.static.espaceProCreationEntreprise.getMetadata().title,
  description: PAGES.static.espaceProCreationEntreprise.getMetadata().description,
}

export default function CreationEntreprise() {
  return (
    <Suspense>
      <CreationCompte type={AUTHTYPE.ENTREPRISE} isWidget={false} />
    </Suspense>
  )
}
