import { Box, Heading, Spinner } from "@chakra-ui/react"
import Head from "next/head"
import { useEffect, useState } from "react"
import { IAppointment } from "shared"

import LayoutAdminRdvA from "../../../components/espace_pro/Admin/Layout"
import { RequestsBoardComponent } from "../../../components/espace_pro/Admin/RequestsBoardComponent"
import { Breadcrumb } from "../../../components/espace_pro/common/components/Breadcrumb"
import withAuth from "../../../components/espace_pro/withAuth"
import { getAppointmentsDetails } from "../../../utils/api"

function AdminPage() {

  const [loading, setLoading] = useState(true)
  const [appointments, setAppointments] = useState<IAppointment[]>([])
  // const appointments = data === null ? [] : data.appointments

  const title = "Tableau de bord"

  useEffect(() => {
    getAppointmentsDetails()
      .then(({ data }) => {
        setLoading(false)
        setAppointments(data.appointments)
      })
      .catch(console.error)
  }, [])

  return (
    <LayoutAdminRdvA>
      <Box w="100%" pt={[4, 8]} px={[1, 1, 12, 24]} pb={40}>
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
      </Box>
    </LayoutAdminRdvA>
  )
}

export default withAuth(AdminPage, "adminRva")
