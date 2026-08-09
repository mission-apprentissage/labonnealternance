import { fr } from "@codegouvfr/react-dsfr"
import { SkipLinks } from "@codegouvfr/react-dsfr/SkipLinks"
import { Box } from "@mui/material"
import type { PropsWithChildren } from "react"
import { PublicHeader } from "@/app/_components/PublicHeader"
import { RechercheLayoutClient } from "./RechercheLayoutClient"

// TODO: Cache Components adoption. Refactor this route so this opt-out can be removed.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false

export default async function RechercheLayout({ children }: PropsWithChildren) {
  return (
    <>
      <SkipLinks
        links={[
          { label: "Recherche", anchor: "#search-form" },
          { label: "Contenu", anchor: "#search-content-container" },
        ]}
      />
      <RechercheLayoutClient header={<PublicHeader />}>
        <Box component="main" role="main" tabIndex={-1} sx={{ backgroundColor: fr.colors.decisions.background.default.grey.hover, py: fr.spacing("4v") }}>
          {children}
        </Box>
      </RechercheLayoutClient>
    </>
  )
}
