import { fr } from "@codegouvfr/react-dsfr"
import { Box } from "@mui/material"
import type { PropsWithChildren } from "react"

import { DepotSimplifieStyling } from "@/components/espace_pro/common/components/DepotSimplifieLayout"

export default async function Layout({ children }: PropsWithChildren) {
  return (
    <Box maxWidth={1200} paddingTop={fr.spacing("4v")} paddingBottom={fr.spacing("4v")} marginX="auto">
      <DepotSimplifieStyling>{children}</DepotSimplifieStyling>
    </Box>
  )
}
