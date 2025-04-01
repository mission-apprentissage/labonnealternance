"use client"

import { Box, Container } from "@mui/material"

import { PublicHeader } from "@/app/(espace-pro)/_components/PublicHeader"
import { Footer } from "@/app/_components/Footer"
import NotFound from "@/app/_components/NotFound"

export default function yo() {
  return (
    <Box sx={{ minHeight: "100vh", display: "grid", gridTemplateRows: "max-content 1fr min-content" }}>
      <PublicHeader user={null} hideConnectionButton={true} />
      <Container maxWidth="xl">
        <NotFound />
      </Container>
      <Footer />
    </Box>
  )
}
