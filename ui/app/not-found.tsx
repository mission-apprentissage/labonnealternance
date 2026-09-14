import SkipLinks from "@codegouvfr/react-dsfr/SkipLinks"
import { Box, Container } from "@mui/material"

import type { Metadata } from "next"
import { Footer } from "./_components/Footer"
import NotFound from "./_components/NotFound"
import { PublicHeaderStatic } from "./_components/PublicHeader"
import { footerId, headerId, mainId } from "./_components/zone-ids"

export const metadata: Metadata = {
  title: "Page non trouvée - La bonne alternance",
}

export default function NotFoundPage() {
  return (
    <>
      <SkipLinks
        links={[
          { label: "Menu", anchor: `#${headerId("not-found")}` },
          { label: "Contenu", anchor: `#${mainId("not-found")}` },
          { label: "Pied de page", anchor: `#${footerId("not-found")}` },
        ]}
      />
      <Box sx={{ minHeight: "100vh", display: "grid", gridTemplateRows: "max-content 1fr min-content" }}>
        <PublicHeaderStatic zone="not-found" />
        <Container maxWidth="xl" component="main" role="main" id={mainId("not-found")} tabIndex={-1}>
          <NotFound />
        </Container>
        <Footer zone="not-found" />
      </Box>
    </>
  )
}
