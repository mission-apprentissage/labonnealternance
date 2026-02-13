import type { PropsWithChildren } from "react"

import { Box } from "@mui/material"
import SkipLinks from "@codegouvfr/react-dsfr/SkipLinks"
import { fr } from "@codegouvfr/react-dsfr"
import { Footer } from "@/app/_components/Footer"
import { PublicHeader } from "@/app/_components/PublicHeader"

export default async function Layout({ children }: PropsWithChildren) {
  return (
    <>
      <SkipLinks
        links={[
          { label: "Menu", anchor: "#header-links" },
          { label: "Contenu", anchor: "#content-container" },
          { label: "Pied de page", anchor: "#footer-links" },
        ]}
      />
      <PublicHeader hideConnectionButton={false} />
      <Box id="content-container" sx={{ pt: fr.spacing("4v") }} tabIndex={-1} role="main" component="main">
        {children}
      </Box>
      <Footer />
    </>
  )
}
