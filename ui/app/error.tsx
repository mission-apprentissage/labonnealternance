"use client"
import { Box } from "@mui/material"
import type { ErrorProps } from "./_components/ErrorComponent"
import { ErrorComponent } from "./_components/ErrorComponent"
import { Footer } from "./_components/Footer"
import { PublicHeaderStatic } from "./_components/PublicHeader"

export default function ErrorPage(props: ErrorProps) {
  return (
    <Box sx={{ minHeight: "100vh", display: "grid", gridTemplateRows: "max-content 1fr min-content" }}>
      <PublicHeaderStatic />
      <ErrorComponent {...props} />
      <Footer />
    </Box>
  )
}
