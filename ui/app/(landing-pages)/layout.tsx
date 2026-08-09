import { fr } from "@codegouvfr/react-dsfr"
import SkipLinks from "@codegouvfr/react-dsfr/SkipLinks"
import { Box } from "@mui/material"
import type { PropsWithChildren } from "react"
import { Suspense } from "react"

import { Footer } from "@/app/_components/Footer"
import { PublicHeader, PublicHeaderStatic } from "@/app/_components/PublicHeader"
import { getSession } from "@/utils/get-session"

export default function PublicLayout({ children }: PropsWithChildren) {
  return (
    <>
      <SkipLinks
        links={[
          { label: "Menu", anchor: "#header-links" },
          { label: "Contenu", anchor: "#landing-page-content" },
          { label: "Pied de page", anchor: "#footer-links" },
        ]}
      />
      <Suspense fallback={<PublicHeaderStatic />}>
        <LandingHeaderWithUser />
      </Suspense>
      <Box component="main" role="main" sx={{ marginBottom: fr.spacing("8v") }}>
        {children}
      </Box>
      <Footer />
    </>
  )
}

async function LandingHeaderWithUser() {
  const { user } = await getSession()
  return <PublicHeader user={user} />
}
