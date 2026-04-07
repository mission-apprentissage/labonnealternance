import { Header as DsfrHeader } from "@codegouvfr/react-dsfr/Header"
import { SkipLinks } from "@codegouvfr/react-dsfr/SkipLinks"
import { Box } from "@mui/material"
import type { PropsWithChildren } from "react"
import { Footer } from "@/app/_components/Footer"
import { DsfrHeaderProps1J1S } from "@/app/(candidat)/(1jeune1solution)/components/Header1J1S"

export default async function RechercheLayout({ children }: PropsWithChildren) {
  return (
    <>
      <SkipLinks
        links={[
          { label: "Menu", anchor: "#header-links" },
          { label: "Contenu", anchor: "#editorial-content-container" },
          { label: "Pied de page", anchor: "#footer-links" },
        ]}
      />
      <Box
        sx={{
          "& .fr-header, & .fr-header__body, & .fr-header__brand": {
            filter: "none",
          },
        }}
      >
        <DsfrHeader {...DsfrHeaderProps1J1S} />
      </Box>
      <Box component="main" role="main">
        {children}
      </Box>
      <Footer />
    </>
  )
}
