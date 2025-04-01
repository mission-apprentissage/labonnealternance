import { Suspense } from "react"

import { AUTHTYPE } from "@/common/contants"
import CreationCompte from "@/components/espace_pro/Authentification/CreationCompte"

export default function CreationEntreprise() {
  return (
    <Suspense>
      <CreationCompte type={AUTHTYPE.CFA} isWidget={false} />
    </Suspense>
  )
}
