import { Suspense } from "react"

import { AUTHTYPE } from "@/common/contants"
import CreationCompte from "@/components/espace_pro/Authentification/CreationCompte"

export default async function Page({ params }) {
  const { origin } = (await params) as { origin: string }

  return (
    <Suspense>
      <CreationCompte type={AUTHTYPE.CFA} isWidget={false} origin={origin} />
    </Suspense>
  )
}
