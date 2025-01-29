import { DepotSimplifieLayout } from "@/components/espace_pro/common/components/DepotSimplifieLayout"

import { AUTHTYPE } from "../../../../common/contants"
import CreationCompte from "../../../../components/espace_pro/Authentification/CreationCompte"

export default function CreationCFA() {
  return (
    <DepotSimplifieLayout>
      <CreationCompte type={AUTHTYPE.CFA} isWidget={false} />
    </DepotSimplifieLayout>
  )
}
