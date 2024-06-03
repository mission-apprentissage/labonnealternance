import { Heading, Spinner } from "@chakra-ui/react"
import Head from "next/head"
import { useEffect, useState } from "react"
import { IAppointment } from "shared"

import { getAuthServerSideProps } from "@/common/SSR/getAuthServerSideProps"
import { Layout } from "@/components/espace_pro"
import { apiGet } from "@/utils/api.utils"

import { RequestsBoardComponent } from "../../../components/espace_pro/Admin/RequestsBoardComponent"
import { Breadcrumb } from "../../../components/espace_pro/common/components/Breadcrumb"
import { authProvider, withAuth } from "../../../components/espace_pro/withAuth"

function AdminPage() {
  const [loading, setLoading] = useState(true)
  const [appointments, setAppointments] = useState<IAppointment[]>([])

  const title = "Tableau de bord"

  useEffect(() => {
    const fetchData = async () => {
      const { appointments } = await apiGet(`/admin/appointments/details`, {})
      setLoading(false)
      setAppointments(appointments)
    }
    fetchData().catch(console.error)
  }, [])

  return (
    <Layout footer={false} rdva>
      <Head>
        <title>{title}</title>
        <link rel="icon" href="/favicon/favicon.ico" />
      </Head>
      <Breadcrumb pages={[{ title: "Administration", to: "/espace-pro/admin" }, { title: title }]} />
      <Heading textStyle="h2" mt={5}>
        {title}
      </Heading>
      {loading ? (
        <Spinner />
      ) : (
        <>
          <RequestsBoardComponent appointments={appointments} />
        </>
      )}
    </Layout>
  )
}

export const getServerSideProps = async (context) => ({ props: { ...(await getAuthServerSideProps(context)) } })

export default authProvider(withAuth(AdminPage, "admin"))
