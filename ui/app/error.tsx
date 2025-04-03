"use client"
import { Box } from "@mui/material"

import { PublicHeaderSimple } from "@/app/(espace-pro)/_components/PublicHeader"
import { ErrorComponent, type ErrorProps } from "@/app/_components/ErrorComponent"
import { Footer } from "@/app/_components/Footer"

export default function ErrorPage(props: ErrorProps) {
  return (
    <Box sx={{ minHeight: "100vh", display: "grid", gridTemplateRows: "max-content 1fr min-content" }}>
      <PublicHeaderSimple />
      <ErrorComponent {...props} />
      <Footer />
    </Box>
  )
}
