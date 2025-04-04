import { fr } from "@codegouvfr/react-dsfr"
import { Box } from "@mui/material"
import type { PropsWithChildren } from "react"

import { DepotSimplifieLayout } from "@/components/espace_pro/common/components/DepotSimplifieLayout"
import { WidgetFooter } from "@/components/WidgetFooter/WidgetFooter"

export default async function Layout({ children }: PropsWithChildren) {
  return (
    <Box marginTop={fr.spacing("1w")}>
      <DepotSimplifieLayout>
        {children}

        <WidgetFooter />
      </DepotSimplifieLayout>
    </Box>
  )
}
