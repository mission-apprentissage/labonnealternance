import { useRouter } from "next/router"
import { ADMIN } from "shared/constants"

import { getAuthServerSideProps } from "@/common/SSR/getAuthServerSideProps"
import { useAuth } from "@/context/UserContext"

import { Layout } from "../../../../../../components/espace_pro"
import CreationOffre from "../../../../../../components/espace_pro/CreationOffre"
import { authProvider, withAuth } from "../../../../../../components/espace_pro/withAuth"

function EntrepriseCreationOffrePage() {
  const router = useRouter()
  const auth = useAuth()
  const { establishment_id, jobId } = router.query as { establishment_id: string; jobId: string }
  return (
    <Layout footer={false}>
      <CreationOffre
        jobId={jobId === "creation" ? undefined : jobId}
        establishment_id={establishment_id}
        onSuccess={() => (auth.user.type === ADMIN ? router.back() : router.push(`/espace-pro/administration/entreprise/${establishment_id}`))}
      />
    </Layout>
  )
}

export const getServerSideProps = async (context) => ({ props: { ...(await getAuthServerSideProps(context)) } })

export default authProvider(withAuth(EntrepriseCreationOffrePage))
