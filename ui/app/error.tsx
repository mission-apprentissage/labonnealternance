"use client"
import { Box } from "@mui/material"

import { ErrorComponent, type ErrorProps } from "@/app/_components/ErrorComponent"
import { Footer } from "@/app/_components/Footer"
import { PublicHeaderStatic } from "@/app/_components/PublicHeader"

export default function ErrorPage(props: ErrorProps) {
  return (
    <Box sx={{ minHeight: "100vh", display: "grid", gridTemplateRows: "max-content 1fr min-content" }}>
      <PublicHeaderStatic />
      <ErrorComponent {...props} />
      <Footer />
    </Box>
  )
}
