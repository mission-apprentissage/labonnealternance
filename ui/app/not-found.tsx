"use client"

import { Box, Container } from "@mui/material"

import { PublicHeaderStatic } from "@/app/(espace-pro)/_components/PublicHeader"
import { Footer } from "@/app/_components/Footer"
import NotFound from "@/app/_components/NotFound"

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
