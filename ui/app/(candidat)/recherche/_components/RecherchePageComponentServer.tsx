import { Suspense } from "react"

import { RecherchePageComponent } from "@/app/(candidat)/recherche/_components/RecherchePageComponent"
import { RecherchePageEmpty } from "@/app/(candidat)/recherche/_components/RechercheResultats/RecherchePageEmpty"
import { IRecherchePageParams } from "@/app/(candidat)/recherche/_utils/recherche.route.utils"

export function RecherchePageComponentServer(props: { rechercheParams: IRecherchePageParams }) {
  return (
    <Suspense fallback={<RecherchePageEmpty {...props} />}>
      <RecherchePageComponent {...props} />
    </Suspense>
  )
}
