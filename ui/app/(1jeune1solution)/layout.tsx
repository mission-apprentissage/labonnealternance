import { fr } from "@codegouvfr/react-dsfr"
import { Header as DsfrHeader } from "@codegouvfr/react-dsfr/Header"
import { SkipLinks } from "@codegouvfr/react-dsfr/SkipLinks"
import { Box } from "@mui/material"
import type { PropsWithChildren } from "react"
import { Footer } from "@/app/_components/Footer"
import { DsfrHeaderProps1J1S } from "@/app/(1jeune1solution)/components/Header1J1S"

export default async function UnJeuneUneSolutionLayout({ children }: PropsWithChildren) {
  return (
    <>
      <SkipLinks
        links={[
          { label: "Contenu", anchor: "#editorial-1j1s-content-container" },
          { label: "Pied de page", anchor: "#footer-links" },
        ]}
      />
      <Box
        sx={{
          "& .fr-header, & .fr-header__body, & .fr-header__brand": {
            filter: "none",
            width: "unset",
          },
          "& .fr-header__navbar": {
            display: "none",
          },
          "& .fr-header__tools-links": {
            display: "block",
          },
          "& .fr-header__tools": {
            flex: 1,
            marginLeft: fr.spacing("3v"),
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
