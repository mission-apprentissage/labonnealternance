import { Box } from "@mui/material"
import type { PropsWithChildren } from "react"

import { DepotSimplifieStyling } from "@/components/espace_pro/common/components/DepotSimplifieLayout"

export default async function Layout({ children }: PropsWithChildren) {
  return (
    <Box
      sx={{
        maxWidth: 1200,
        marginX: "auto",
      }}
    >
      <DepotSimplifieStyling>{children}</DepotSimplifieStyling>
    </Box>
  )
}
