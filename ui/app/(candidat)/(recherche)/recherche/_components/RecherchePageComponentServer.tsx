import { Suspense } from "react"

import { RecherchePageComponent } from "./RecherchePageComponent"
import { RecherchePageEmpty } from "./RechercheResultats/RecherchePageEmpty"
import type { IRecherchePageParams } from "@/app/(candidat)/(recherche)/recherche/_utils/recherche.route.utils"

export function RecherchePageComponentServer(props: { rechercheParams: IRecherchePageParams }) {
  return (
    <Suspense fallback={<RecherchePageEmpty {...props} />}>
      <RecherchePageComponent {...props} />
    </Suspense>
  )
}
