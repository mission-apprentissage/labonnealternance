import { useRouter } from "next/router"
import { useEffect } from "react"

import { getAuthServerSideProps } from "@/common/SSR/getAuthServerSideProps"
import { authProvider, withAuth } from "@/components/espace_pro/withAuth"

function EspacePro() {
  const router = useRouter()
  useEffect(() => {
    router.push("/espace-pro/administration/users")
  }, [])

  return <></>
}

export const getServerSideProps = async (context) => ({ props: { ...(await getAuthServerSideProps(context)) } })

export default authProvider(withAuth(EspacePro))
