import type { Metadata } from "next"
import { Suspense } from "react"
import { AUTHTYPE } from "@/common/contants"
import CreationCompte from "@/components/espace_pro/Authentification/CreationCompte"
import { METADATA } from "@/utils/routes.metadata.utils"
export const metadata: Metadata = {
  title: METADATA.static.espaceProCreationEntreprise().title,
  description: METADATA.static.espaceProCreationEntreprise().description,
}

export default function CreationEntreprise() {
  return (
    <Suspense>
      <CreationCompte type={AUTHTYPE.ENTREPRISE} isWidget={false} />
    </Suspense>
  )
}
