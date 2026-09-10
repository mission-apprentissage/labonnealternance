import { fr } from "@codegouvfr/react-dsfr"
import SkipLinks from "@codegouvfr/react-dsfr/SkipLinks"
import { Box } from "@mui/material"
import type { PropsWithChildren } from "react"
import { Suspense } from "react"

import { Footer } from "@/app/_components/Footer"
import { PublicHeader, PublicHeaderStatic } from "@/app/_components/PublicHeader"
import { footerId, headerId } from "@/app/_components/shell-ids"
import { getSession } from "@/utils/get-session"

export default function PublicLayout({ children }: PropsWithChildren) {
  return (
    <>
      <SkipLinks
        links={[
          { label: "Menu", anchor: `#${headerId("landing")}` },
          { label: "Contenu", anchor: "#landing-page-content" },
          { label: "Pied de page", anchor: `#${footerId("landing")}` },
        ]}
      />
      <Suspense fallback={<PublicHeaderStatic shell="landing" />}>
        <LandingHeaderWithUser />
      </Suspense>
      <Box component="main" role="main" sx={{ marginBottom: fr.spacing("8v") }}>
        {children}
      </Box>
      <Footer shell="landing" />
    </>
  )
}

async function LandingHeaderWithUser() {
  const { user } = await getSession()
  return <PublicHeader shell="landing" user={user} />
}
