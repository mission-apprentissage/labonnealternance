import { fr } from "@codegouvfr/react-dsfr"
import { Box, Container } from "@mui/material"
import type { PropsWithChildren } from "react"

import { Footer } from "@/app/_components/Footer"
import { PublicHeader } from "@/app/_components/PublicHeader"
import { getSession } from "@/utils/getSession"

export default async function RecruteurLayout({ children }: PropsWithChildren) {
  const { user } = await getSession()

  return (
    <>
      <PublicHeader user={user} />
      <Box sx={{ marginBottom: fr.spacing("4w") }}>
        <Container maxWidth="xl" sx={{ marginTop: fr.spacing("4v") }}>
          {children}
        </Container>
      </Box>
      <Footer />
    </>
  )
}
