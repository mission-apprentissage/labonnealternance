import { fr } from "@codegouvfr/react-dsfr"
import { Box } from "@mui/material"
import type { PropsWithChildren } from "react"
import { DepotSimplifieLayout } from "@/components/espace_pro/common/components/DepotSimplifieLayout"
export default async function Layout({ children }: PropsWithChildren) {
  return (
    <DepotSimplifieLayout>
      {/* même marge basse que la création de compte du site (cf. (espace-pro-creation-compte)/espace-pro/layout.tsx) */}
      <Box role="main" component="main" sx={{ paddingBottom: fr.spacing("16v") }}>
        {children}
      </Box>
    </DepotSimplifieLayout>
  )
}
