import { Container } from "@chakra-ui/react"
import { fr } from "@codegouvfr/react-dsfr"
import type { PropsWithChildren } from "react"

import { DepotSimplifieStyling } from "@/components/espace_pro/common/components/DepotSimplifieLayout"

export default async function Layout({ children }: PropsWithChildren) {
  return (
    <Container maxW="container.xl" sx={{ marginTop: fr.spacing("4v") }}>
      <DepotSimplifieStyling>{children}</DepotSimplifieStyling>
    </Container>
  )
}
