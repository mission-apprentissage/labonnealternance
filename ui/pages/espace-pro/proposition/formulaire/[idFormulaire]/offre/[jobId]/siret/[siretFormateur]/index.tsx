import { useRouter } from "next/router"

import { PropositionOffreId } from "@/components/espace_pro/Proposition/Offre/PropositionOffreId"

import { Layout } from "../../../../../../../../../components/espace_pro"

export default function PropositionOffreIdSiretPage() {
  const router = useRouter()
  const { idFormulaire, jobId, siretFormateur, token } = router.query as { idFormulaire: string; jobId: string; siretFormateur: string; token: string }

  return (
    <Layout displayNavigationMenu={false}>
      <PropositionOffreId idFormulaire={idFormulaire} jobId={jobId} siretFormateur={siretFormateur} token={token} />
    </Layout>
  )
}
