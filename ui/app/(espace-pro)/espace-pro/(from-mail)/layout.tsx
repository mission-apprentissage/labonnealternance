import { fr } from "@codegouvfr/react-dsfr"
import SkipLinks from "@codegouvfr/react-dsfr/SkipLinks"
import { Box, Container } from "@mui/material"
import type { PropsWithChildren } from "react"
import { Suspense } from "react"
import { Footer } from "@/app/_components/Footer"
import { PublicHeader, PublicHeaderStatic } from "@/app/_components/PublicHeader"
import { getSession } from "@/utils/get-session"

export default function RecruteurLayout({ children }: PropsWithChildren) {
  return (
    <>
      <SkipLinks
        links={[
          { label: "Menu", anchor: "#header-links" },
          { label: "Contenu", anchor: "#main-content" },
          { label: "Pied de page", anchor: "#footer-links" },
        ]}
      />
      <Suspense fallback={<PublicHeaderStatic />}>
        <FromMailHeaderWithUser />
      </Suspense>
      <Box component="main" role="main" id="main-content" tabIndex={-1} sx={{ marginBottom: fr.spacing("8v") }}>
        <Container maxWidth="xl" sx={{ marginTop: fr.spacing("4v") }}>
          {children}
        </Container>
      </Box>
      <Footer />
    </>
  )
}

async function FromMailHeaderWithUser() {
  const { user } = await getSession()
  return <PublicHeader user={user} />
}
