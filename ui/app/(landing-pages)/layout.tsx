import { fr } from "@codegouvfr/react-dsfr"
import SkipLinks from "@codegouvfr/react-dsfr/SkipLinks"
import { Box } from "@mui/material"
import type { PropsWithChildren } from "react"
import { Suspense } from "react"

import { Footer } from "@/app/_components/Footer"
import { PublicHeader, PublicHeaderStatic } from "@/app/_components/PublicHeader"
import { footerId, headerId, mainId } from "@/app/_components/zone-ids"
import { getSession } from "@/utils/get-session"

export default function PublicLayout({ children }: PropsWithChildren) {
  return (
    <>
      <SkipLinks
        links={[
          { label: "Menu", anchor: `#${headerId("landing")}` },
          { label: "Contenu", anchor: `#${mainId("landing")}` },
          { label: "Pied de page", anchor: `#${footerId("landing")}` },
        ]}
      />
      <Suspense fallback={<PublicHeaderStatic zone="landing" />}>
        <LandingHeaderWithUser />
      </Suspense>
      <Box component="main" role="main" id={mainId("landing")} tabIndex={-1} sx={{ marginBottom: fr.spacing("8v") }}>
        {children}
      </Box>
      <Footer zone="landing" />
    </>
  )
}

async function LandingHeaderWithUser() {
  const { user } = await getSession()
  return <PublicHeader zone="landing" user={user} />
}
