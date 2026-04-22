import { fr } from "@codegouvfr/react-dsfr"
import { SkipLinks } from "@codegouvfr/react-dsfr/SkipLinks"
import { Box } from "@mui/material"
import type { PropsWithChildren } from "react"
import { PublicHeader } from "@/app/_components/PublicHeader"
import { RechercheLayoutClient } from "./RechercheLayoutClient"

export default async function RechercheLayout({ children }: PropsWithChildren) {
  return (
    <>
      <SkipLinks
        links={[
          { label: "Recherche", anchor: "#search-form" },
          { label: "Contenu", anchor: "#search-content-container" },
        ]}
      />
      <RechercheLayoutClient header={<PublicHeader />}>
        <Box component="main" role="main" tabIndex={-1} sx={{ backgroundColor: fr.colors.decisions.background.default.grey.hover }}>
          {children}
        </Box>
      </RechercheLayoutClient>
    </>
  )
}
