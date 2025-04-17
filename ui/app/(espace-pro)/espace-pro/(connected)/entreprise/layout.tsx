import { fr } from "@codegouvfr/react-dsfr"
import { Container } from "@mui/material"
import { PropsWithChildren } from "react"

import { DepotSimplifieStyling } from "@/components/espace_pro/common/components/DepotSimplifieLayout"

export default function Layout({ children }: PropsWithChildren) {
  return (
    <Container
      maxWidth="xl"
      sx={{
        marginTop: fr.spacing("4v"),
      }}
    >
      <DepotSimplifieStyling>{children}</DepotSimplifieStyling>
    </Container>
  )
}
