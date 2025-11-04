"use client"
import { Box } from "@mui/material"

import { Footer } from "./_components/Footer"
import { PublicHeaderStatic } from "./_components/PublicHeader"
import { ErrorComponent  } from "./_components/ErrorComponent"
import type {ErrorProps} from "./_components/ErrorComponent";

export default function ErrorPage(props: ErrorProps) {
  return (
    <Box sx={{ minHeight: "100vh", display: "grid", gridTemplateRows: "max-content 1fr min-content" }}>
      <PublicHeaderStatic />
      <ErrorComponent {...props} />
      <Footer />
    </Box>
  )
}
