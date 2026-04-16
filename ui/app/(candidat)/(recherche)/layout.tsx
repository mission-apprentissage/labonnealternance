import { SkipLinks } from "@codegouvfr/react-dsfr/SkipLinks"
import { Box } from "@mui/material"
import type { PropsWithChildren } from "react"
import { PublicHeaderStatic } from "@/app/_components/PublicHeader"

export default async function RechercheLayout({ children }: PropsWithChildren) {
  return (
    <>
      <SkipLinks
        links={[
          { label: "Recherche", anchor: "#search-form" },
          { label: "Contenu", anchor: "#search-content-container" },
        ]}
      />
      <PublicHeaderStatic />
      <Box component="main" role="main" tabIndex={-1}>
        {children}
      </Box>
    </>
  )
}
