import { Container } from "@chakra-ui/react"
import { fr } from "@codegouvfr/react-dsfr"
import type { PropsWithChildren } from "react"

import { ProtectedHeader } from "@/app/(espace-pro)/_components/ProtectedHeader"
import { Footer } from "@/app/_components/Footer"

export default function AuthentificationLayout({ children }: PropsWithChildren) {
  return (
    <>
      <ProtectedHeader />
      <Container maxW="container.xl" sx={{ alignContent: "center", marginTop: fr.spacing("2v"), marginBottom: fr.spacing("2v") }}>
        {children}
      </Container>
      <Footer />
    </>
  )
}
