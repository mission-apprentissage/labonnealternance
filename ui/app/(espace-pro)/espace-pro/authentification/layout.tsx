import { Container } from "@chakra-ui/react"
import { fr } from "@codegouvfr/react-dsfr"
import type { PropsWithChildren } from "react"

import { PublicHeader } from "@/app/(espace-pro)/_components/PublicHeader"
import { Footer } from "@/app/_components/Footer"
import { getSession } from "@/utils/getSession"

export default async function AuthentificationLayout({ children }: PropsWithChildren) {
  const { user } = await getSession()

  return (
    <>
      <PublicHeader user={user} />
      <Container maxW="container.xl" sx={{ alignContent: "center", marginTop: fr.spacing("2v"), marginBottom: fr.spacing("2v") }}>
        {children}
      </Container>
      <Footer />
    </>
  )
}
