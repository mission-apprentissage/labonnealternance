"use client"
import SkipLinks from "@codegouvfr/react-dsfr/SkipLinks"
import { Box } from "@mui/material"
import { footerId, headerId } from "@/app/_components/shell-ids"
import type { ErrorProps } from "./_components/ErrorComponent"
import { ErrorComponent } from "./_components/ErrorComponent"
import { Footer } from "./_components/Footer"
import { PublicHeaderStatic } from "./_components/PublicHeader"

export default function ErrorPage(props: ErrorProps) {
  return (
    <>
      <SkipLinks
        links={[
          { label: "En-tête", anchor: `#${headerId("error")}` },
          { label: "Contenu", anchor: "#content-container" },
          { label: "Pied de page", anchor: `#${footerId("error")}` },
        ]}
      />
      <Box sx={{ minHeight: "100vh", display: "grid", gridTemplateRows: "max-content 1fr min-content" }}>
        <PublicHeaderStatic shell="error" />
        <ErrorComponent {...props} />
        <Footer shell="error" />
      </Box>
    </>
  )
}
