import { fr } from "@codegouvfr/react-dsfr"
import { Container } from "@mui/material"
import type { PropsWithChildren } from "react"

import { DepotSimplifieStyling } from "@/components/espace_pro/common/components/DepotSimplifieLayout"
import InfoBanner from "@/components/InfoBanner/InfoBanner"

export default function Layout({ children }: PropsWithChildren) {
  return (
    <Container
      maxWidth="xl"
      sx={{
        marginTop: fr.spacing("4v"),
      }}
    >
      <InfoBanner showInfo={true} showAlert={false} showOK={false} showEnvAlert={false} />
      <DepotSimplifieStyling>{children}</DepotSimplifieStyling>
    </Container>
  )
}
