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
    <Box sx={{ minHeight: "100vh", display: "grid", gridTemplateRows: "max-content 1fr min-content" }}>
      <PublicHeaderStatic zone="not-found" />
      <Container maxWidth="xl">
        <NotFound />
      </Container>
      <Footer zone="not-found" />
    </Box>
  )
}
