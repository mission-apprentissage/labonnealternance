import type { Metadata } from "next"
import { Suspense } from "react"
import { AUTHTYPE } from "@/common/contants"
import CreationCompte from "@/components/espace_pro/Authentification/CreationCompte"
import { METADATA } from "@/utils/routes.metadata.utils"
export const metadata: Metadata = {
  title: METADATA.static.espaceProCreationCfa().title,
  description: METADATA.static.espaceProCreationCfa().description,
}

export default function Page() {
  return (
    <Suspense>
      <CreationCompte type={AUTHTYPE.CFA} isWidget={false} />
    </Suspense>
  )
}
