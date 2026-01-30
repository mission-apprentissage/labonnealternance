import { Suspense } from "react"

import type { Metadata } from "next"
import { AUTHTYPE } from "@/common/contants"
import CreationCompte from "@/components/espace_pro/Authentification/CreationCompte"
import { PAGES } from "@/utils/routes.utils"

export const metadata: Metadata = {
  title: PAGES.static.espaceProCreationCfa.getMetadata().title,
  description: PAGES.static.espaceProCreationCfa.getMetadata().description,
}

export default async function Page({ params }) {
  const { origin } = (await params) as { origin: string }

  return (
    <Suspense>
      <CreationCompte type={AUTHTYPE.CFA} isWidget={false} origin={origin} />
    </Suspense>
  )
}
