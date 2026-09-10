import { fr } from "@codegouvfr/react-dsfr"
import SkipLinks from "@codegouvfr/react-dsfr/SkipLinks"
import { Box, Container } from "@mui/material"
import type { PropsWithChildren } from "react"
import { Suspense } from "react"
import { Footer } from "@/app/_components/Footer"
import { PublicHeader, PublicHeaderStatic } from "@/app/_components/PublicHeader"
import { footerId, headerId, mainId } from "@/app/_components/shell-ids"
import { getSession } from "@/utils/get-session"

export default function RecruteurLayout({ children }: PropsWithChildren) {
  return (
    <>
      <SkipLinks
        links={[
          { label: "Menu", anchor: `#${headerId("espace-pro-from-mail")}` },
          { label: "Contenu", anchor: `#${mainId("espace-pro-from-mail")}` },
          { label: "Pied de page", anchor: `#${footerId("espace-pro-from-mail")}` },
        ]}
      />
      <Suspense fallback={<PublicHeaderStatic shell="espace-pro-from-mail" />}>
        <FromMailHeaderWithUser />
      </Suspense>
      <Box component="main" role="main" id={mainId("espace-pro-from-mail")} tabIndex={-1} sx={{ marginBottom: fr.spacing("8v") }}>
        <Container maxWidth="xl" sx={{ marginTop: fr.spacing("4v") }}>
          {children}
        </Container>
      </Box>
      <Footer shell="espace-pro-from-mail" />
    </>
  )
}

async function FromMailHeaderWithUser() {
  const { user } = await getSession()
  return <PublicHeader shell="espace-pro-from-mail" user={user} />
}
