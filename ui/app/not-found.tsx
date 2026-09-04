import SkipLinks from "@codegouvfr/react-dsfr/SkipLinks"
import { Box, Container } from "@mui/material"

import type { Metadata } from "next"
import { Footer } from "./_components/Footer"
import NotFound from "./_components/NotFound"
import { PublicHeaderStatic } from "./_components/PublicHeader"

export const metadata: Metadata = {
  title: "Page non trouvée - La bonne alternance",
}

export default function NotFoundPage() {
  return (
    <>
      <SkipLinks
        links={[
          { label: "Menu", anchor: "#header-links" },
          { label: "Contenu", anchor: "#content-container" },
          { label: "Pied de page", anchor: "#footer-links" },
        ]}
      />
      <Box sx={{ minHeight: "100vh", display: "grid", gridTemplateRows: "max-content 1fr min-content" }}>
        <PublicHeaderStatic />
        <Container maxWidth="xl" component="main" role="main" id="content-container" tabIndex={-1}>
          <NotFound />
        </Container>
        <Footer />
      </Box>
    </>
  )
}
