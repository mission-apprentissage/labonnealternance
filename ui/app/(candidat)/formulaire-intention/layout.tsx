import type { PropsWithChildren } from "react"

import { Box } from "@mui/material"
import { Footer } from "@/app/_components/Footer"

export default async function Layout({ children }: PropsWithChildren) {
  return (
    <>
      <Box role="main" component="main">
        {children}
      </Box>
      <Footer />
    </>
  )
}
