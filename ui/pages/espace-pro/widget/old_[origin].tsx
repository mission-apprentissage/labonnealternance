import { useRouter } from "next/router"

import { DepotSimplifieLayout } from "@/components/espace_pro/common/components/DepotSimplifieLayout"
import { WidgetFooter } from "@/components/WidgetFooter/WidgetFooter"

import { AUTHTYPE } from "../../../common/contants"
import CreationCompte from "../../../components/espace_pro/Authentification/CreationCompte"

export default function Widget() {
  const router = useRouter()
  const { origin } = router.query
  return (
    <DepotSimplifieLayout>
      <CreationCompte type={AUTHTYPE.ENTREPRISE} isWidget={true} origin={origin as string} />
      <WidgetFooter />
    </DepotSimplifieLayout>
  )
}
