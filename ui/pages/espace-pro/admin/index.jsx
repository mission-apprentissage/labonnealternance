import { Box, Heading, Spinner } from "@chakra-ui/react"
import Head from "next/head"
import React from "react"

import { useFetch } from "../../../common/hooks/useFetch"
import { RequestsBoardComponent } from "../../../components/espace_pro/Admin/RequestsBoardComponent"
import { Breadcrumb } from "../../../components/espace_pro/common/components/Breadcrumb"
import withAuth from "../../../components/espace_pro/withAuth"

function AdminPage() {
  const [data, loading] = useFetch("admin/appointments/details?limit=500")
  const appointments = data === null ? [] : data.appointments

  const title = "Tableau de bord"

  return (
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
  )
}

export default withAuth(AdminPage, "adminRva")
