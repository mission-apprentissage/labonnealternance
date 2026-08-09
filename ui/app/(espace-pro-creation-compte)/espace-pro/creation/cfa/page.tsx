import type { Metadata } from "next"
import { Suspense } from "react"
import { AUTHTYPE } from "@/common/contants"
import CreationCompte from "@/components/espace_pro/Authentification/CreationCompte"
import { PAGES } from "@/utils/routes.utils"

// TODO: Cache Components adoption. Refactor this route so this opt-out can be removed.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false

export const metadata: Metadata = {
  title: PAGES.static.espaceProCreationCfa.getMetadata().title,
  description: PAGES.static.espaceProCreationCfa.getMetadata().description,
}

export default function Page() {
  return (
    <Suspense>
      <CreationCompte type={AUTHTYPE.CFA} isWidget={false} />
    </Suspense>
  )
}
