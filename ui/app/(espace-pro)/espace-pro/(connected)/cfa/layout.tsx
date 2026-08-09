import { fr } from "@codegouvfr/react-dsfr"
import { Container } from "@mui/material"
import type { PropsWithChildren } from "react"

import { DepotSimplifieStyling } from "@/components/espace_pro/common/components/DepotSimplifieLayout"

// TODO: Cache Components adoption. Refactor this route so this opt-out can be removed.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false

export default async function Layout({ children }: PropsWithChildren) {
  return (
    <Container maxWidth="xl" sx={{ marginTop: fr.spacing("4v") }}>
      <DepotSimplifieStyling>{children}</DepotSimplifieStyling>
    </Container>
  )
}
