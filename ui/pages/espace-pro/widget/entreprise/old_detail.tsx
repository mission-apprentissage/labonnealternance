import { useRouter } from "next/router"

import { InformationCreationCompte } from "@/app/(espace-pro-creation-compte)/_components/InformationCreationCompte/InformationCreationCompte"
import { DepotSimplifieLayout } from "@/components/espace_pro/common/components/DepotSimplifieLayout"
import { WidgetFooter } from "@/components/WidgetFooter/WidgetFooter"

export const WidgetEntrepriseDetail = () => {
  const router = useRouter()
  const { siret, type, origin } = router.query as { siret: string; type: "CFA" | "ENTREPRISE"; origin: string }

  return (
    <DepotSimplifieLayout>
      <InformationCreationCompte isWidget={true} establishment_siret={siret} type={type} origin={origin} />
      <WidgetFooter />
    </DepotSimplifieLayout>
  )
}

export default WidgetEntrepriseDetail
