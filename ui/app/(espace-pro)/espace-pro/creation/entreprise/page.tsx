import { AUTHTYPE } from "@/common/contants"
import CreationCompte from "@/components/espace_pro/Authentification/CreationCompte"
import { DepotSimplifieLayout } from "@/components/espace_pro/common/components/DepotSimplifieLayout"

export default function CreationEntreprise() {
  return (
    <DepotSimplifieLayout>
      <CreationCompte type={AUTHTYPE.ENTREPRISE} isWidget={false} />
    </DepotSimplifieLayout>
  )
}
