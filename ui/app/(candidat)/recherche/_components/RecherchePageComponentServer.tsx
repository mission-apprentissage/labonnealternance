import { Suspense } from "react"

import { RecherchePageComponent } from "@/app/(candidat)/recherche/_components/RecherchePageComponent"
import { RecherchePageHome } from "@/app/(candidat)/recherche/_components/RechercheResultats/RecherchePageHome"
import { IRecherchePageParams } from "@/app/(candidat)/recherche/_utils/recherche.route.utils"

export function RecherchePageComponentServer(props: { params: IRecherchePageParams }) {
  return (
    <Suspense fallback={<RecherchePageHome {...props} />}>
      <RecherchePageComponent {...props} />
    </Suspense>
  )
}
