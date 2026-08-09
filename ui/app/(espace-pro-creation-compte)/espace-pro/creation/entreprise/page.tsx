import type { Metadata } from "next"
import { Suspense } from "react"
import { AUTHTYPE } from "@/common/contants"
import CreationCompte from "@/components/espace_pro/Authentification/CreationCompte"
import { PAGES } from "@/utils/routes.utils"

// TODO: Cache Components adoption. Refactor this route so this opt-out can be removed.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false

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
