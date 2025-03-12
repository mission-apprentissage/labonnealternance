import { useRouter } from "next/router"

import { InformationCreationCompte } from "@/components/espace_pro/Authentification/InformationCreationCompte"
import { DepotSimplifieLayout } from "@/components/espace_pro/common/components/DepotSimplifieLayout"

export default function CreationDetail() {
  const router = useRouter()
  const { siret, email, type, origin } = router.query as { siret: string; email?: string; type: "CFA" | "ENTREPRISE"; origin: string }

  return (
    <DepotSimplifieLayout>
      <InformationCreationCompte establishment_siret={siret} email={email} type={type} origin={origin} />
    </DepotSimplifieLayout>
  )
}
