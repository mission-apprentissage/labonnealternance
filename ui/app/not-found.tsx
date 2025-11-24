"use client"

import { Box, Container } from "@mui/material"

import { Footer } from "./_components/Footer"
import NotFound from "./_components/NotFound"
import { PublicHeaderStatic } from "./_components/PublicHeader"

export default function NotFoundPage() {
  return (
    <Box sx={{ minHeight: "100vh", display: "grid", gridTemplateRows: "max-content 1fr min-content" }}>
      <PublicHeaderStatic />
      <Container maxWidth="xl">
        <NotFound />
      </Container>
      <Footer />
    </Box>
  )
}
