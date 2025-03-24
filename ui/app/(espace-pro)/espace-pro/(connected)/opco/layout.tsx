import { fr } from "@codegouvfr/react-dsfr"
import { Container } from "@chakra-ui/react"
import type { PropsWithChildren } from "react"

import { DepotSimplifieStyling } from "@/components/espace_pro/common/components/DepotSimplifieLayout"

export default async function Layout({ children }: PropsWithChildren) {
  return (
    <Container maxW="xl" sx={{ marginTop: fr.spacing("4v") }}>
      <DepotSimplifieStyling>{children}</DepotSimplifieStyling>
    </Container>
  )
}
