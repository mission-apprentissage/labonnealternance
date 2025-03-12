import { useRouter } from "next/router"

import CreationOffre from "@/app/(espace-pro)/espace-pro/(connected)/entreprise/[establishment_id]/offre/creation/page"
import { getAuthServerSideProps } from "@/common/SSR/getAuthServerSideProps"

import { Layout } from "../../../../../../../../components/espace_pro"
import { authProvider, withAuth } from "../../../../../../../../components/espace_pro/withAuth"

function OpcoEntrepriseCreationOffre() {
  const router = useRouter()
  const { establishment_id, userId, jobId } = router.query as { establishment_id: string; userId: string; jobId: string }
  return (
    <Layout footer={false}>
      <CreationOffre
        jobId={jobId === "creation" ? undefined : jobId}
        establishment_id={establishment_id}
        onSuccess={() => router.push(`/espace-pro/administration/opco/entreprise/${userId}/entreprise/${establishment_id}`)}
      />
    </Layout>
  )
}

export const getServerSideProps = async (context) => ({ props: { ...(await getAuthServerSideProps(context)) } })

export default authProvider(withAuth(OpcoEntrepriseCreationOffre))
