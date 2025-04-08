import { fr } from "@codegouvfr/react-dsfr"
import { Container } from "@mui/material"
import { PropsWithChildren } from "react"

export default function Layout({ children }: PropsWithChildren) {
  return (
    <Container
      maxWidth="xl"
      sx={{
        marginTop: fr.spacing("4v"),
      }}
    >
      {children}
    </Container>
  )
}
