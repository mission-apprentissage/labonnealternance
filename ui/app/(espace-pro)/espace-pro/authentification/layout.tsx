import { fr } from "@codegouvfr/react-dsfr"
import SkipLinks from "@codegouvfr/react-dsfr/SkipLinks"
import { Box } from "@mui/material"
import type { PropsWithChildren } from "react"
import { Suspense } from "react"
import { Footer } from "@/app/_components/Footer"
import { PublicHeader, PublicHeaderStatic } from "@/app/_components/PublicHeader"
import { getSession } from "@/utils/get-session"

export default function AuthentificationLayout({ children }: PropsWithChildren) {
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
        <AuthentificationHeaderWithUser />
      </Suspense>
      <Box
        id="main-content"
        tabIndex={-1}
        role="main"
        component="main"
        sx={{
          maxWidth: 1200,
          paddingTop: fr.spacing("3v"),
          paddingBottom: fr.spacing("3v"),
          marginX: "auto",
        }}
      >
        {children}
      </Box>
      <Footer />
    </>
  )
}

async function AuthentificationHeaderWithUser() {
  const { user } = await getSession()
  return <PublicHeader user={user} />
}
