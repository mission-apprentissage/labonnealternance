import { DepotSimplifieLayout } from "@/components/espace_pro/common/components/DepotSimplifieLayout"

import { AUTHTYPE } from "../../../../common/contants"
import CreationCompte from "../../../../components/espace_pro/Authentification/CreationCompte"

export default function CreationEntreprise() {
  return (
    <DepotSimplifieLayout>
      <CreationCompte type={AUTHTYPE.ENTREPRISE} widget={false} />
    </DepotSimplifieLayout>
  )
}
