import { fr } from "@codegouvfr/react-dsfr"
import { Box } from "@mui/material"
import type { PropsWithChildren } from "react"
import { Footer } from "@/app/_components/Footer"
import { PublicHeader } from "@/app/_components/PublicHeader"
import { RechercheLayoutClient } from "./RechercheLayoutClient"
export default async function RechercheLayout({ children }: PropsWithChildren) {
  return (
    <>
      <RechercheLayoutClient header={<PublicHeader zone="recherche" />}>
        {/* Fond commun au main et au footer : le footer DSFR n'a pas de fond propre. */}
        <Box sx={{ backgroundColor: fr.colors.decisions.background.default.grey.hover }}>
          <Box component="main" role="main" tabIndex={-1}>
            {children}
          </Box>
          <Footer zone="recherche" />
        </Box>
      </RechercheLayoutClient>
    </>
  )
}
