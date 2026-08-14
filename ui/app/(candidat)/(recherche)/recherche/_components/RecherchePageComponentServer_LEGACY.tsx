import { Suspense } from "react"
import type { IRecherchePageParams } from "@/app/(candidat)/(recherche)/recherche/_utils/recherche.route.utils"
import { RecherchePageComponent } from "./RecherchePageComponent_LEGACY"
import { RecherchePageEmpty } from "./RechercheResultats/RecherchePageEmpty_LEGACY"

export function RecherchePageComponentServer(props: { rechercheParams: IRecherchePageParams }) {
  return (
    <Suspense fallback={<RecherchePageEmpty {...props} />}>
      <RecherchePageComponent {...props} />
    </Suspense>
  )
}
