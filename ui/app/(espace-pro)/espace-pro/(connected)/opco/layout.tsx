import { fr } from "@codegouvfr/react-dsfr"
import { Container } from "@mui/material"
import type { PropsWithChildren } from "react"

export default async function Layout({ children }: PropsWithChildren) {
  return (
    <Container maxWidth="xl" sx={{ marginTop: fr.spacing("4v") }}>
      {children}
    </Container>
  )
}
