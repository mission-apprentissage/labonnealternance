import { fr } from "@codegouvfr/react-dsfr"
import SkipLinks from "@codegouvfr/react-dsfr/SkipLinks"
import { Box } from "@mui/material"
import type { PropsWithChildren } from "react"
import { Footer } from "@/app/_components/Footer"
import { PublicHeader } from "@/app/_components/PublicHeader"

export default async function Layout({ children }: PropsWithChildren) {
  return (
    <>
      <SkipLinks
        links={[
          { label: "Menu", anchor: "#header-links" },
          { label: "Contenu", anchor: "#intention-content-container" },
          { label: "Pied de page", anchor: "#footer-links" },
        ]}
      />
      <PublicHeader hideConnectionButton={false} />
      <Box role="main" sx={{ py: fr.spacing("10v") }} component="main" tabIndex={-1} id="intention-content-container">
        {children}
      </Box>
      <Footer />
    </>
  )
}
