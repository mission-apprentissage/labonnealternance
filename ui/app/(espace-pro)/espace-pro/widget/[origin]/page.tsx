import { AUTHTYPE } from "@/common/contants"
import CreationCompte from "@/components/espace_pro/Authentification/CreationCompte"
import { DepotSimplifieLayout } from "@/components/espace_pro/common/components/DepotSimplifieLayout"
import { WidgetFooter } from "@/components/WidgetFooter/WidgetFooter"

export default async function Widget({ params }: { params: Promise<{ origin: string }> }) {
  const { origin } = await params
  return (
    <DepotSimplifieLayout>
      <CreationCompte type={AUTHTYPE.ENTREPRISE} isWidget={true} origin={origin} />
      <WidgetFooter />
    </DepotSimplifieLayout>
  )
}
