import type { PropsWithChildren } from "react"

import { Box } from "@mui/material"
import { DepotSimplifieLayout } from "@/components/espace_pro/common/components/DepotSimplifieLayout"

export default async function Layout({ children }: PropsWithChildren) {
  return (
    <DepotSimplifieLayout>
      <Box role="main" component="main">
        {children}
      </Box>
    </DepotSimplifieLayout>
  )
}
