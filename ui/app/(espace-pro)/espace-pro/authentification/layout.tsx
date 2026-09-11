import { fr } from "@codegouvfr/react-dsfr"
import SkipLinks from "@codegouvfr/react-dsfr/SkipLinks"
import { Box } from "@mui/material"
import type { PropsWithChildren } from "react"
import { Suspense } from "react"
import { Footer } from "@/app/_components/Footer"
import { PublicHeader, PublicHeaderStatic } from "@/app/_components/PublicHeader"
import { footerId, headerId, mainId } from "@/app/_components/zone-ids"
import { getSession } from "@/utils/get-session"

export default function AuthentificationLayout({ children }: PropsWithChildren) {
  return (
    <>
      <SkipLinks
        links={[
          { label: "Menu", anchor: `#${headerId("espace-pro-authentification")}` },
          { label: "Contenu", anchor: `#${mainId("espace-pro-authentification")}` },
          { label: "Pied de page", anchor: `#${footerId("espace-pro-authentification")}` },
        ]}
      />
      <Suspense fallback={<PublicHeaderStatic zone="espace-pro-authentification" />}>
        <AuthentificationHeaderWithUser />
      </Suspense>
      <Box
        id={mainId("espace-pro-authentification")}
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
      <Footer zone="espace-pro-authentification" />
    </>
  )
}

async function AuthentificationHeaderWithUser() {
  const { user } = await getSession()
  return <PublicHeader zone="espace-pro-authentification" user={user} />
}
