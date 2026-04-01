import { fr } from "@codegouvfr/react-dsfr"
import SkipLinks from "@codegouvfr/react-dsfr/SkipLinks"
import { Box } from "@mui/material"
import type { PropsWithChildren } from "react"
import { Footer } from "@/app/_components/Footer"
import { PublicHeader } from "@/app/_components/PublicHeader"
import { getSession } from "@/utils/getSession"

export default async function AuthentificationLayout({ children }: PropsWithChildren) {
  const { user } = await getSession()

  return (
    <>
      <SkipLinks
        links={[
          { label: "Menu", anchor: "#header-links" },
          { label: "Contenu", anchor: "#main-content" },
          { label: "Pied de page", anchor: "#footer-links" },
        ]}
      />
      <PublicHeader user={user} />
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
