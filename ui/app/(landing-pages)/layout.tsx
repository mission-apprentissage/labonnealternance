import { fr } from "@codegouvfr/react-dsfr"
import SkipLinks from "@codegouvfr/react-dsfr/SkipLinks"
import { Box } from "@mui/material"
import type { PropsWithChildren } from "react"

import { Footer } from "@/app/_components/Footer"
import { PublicHeader } from "@/app/_components/PublicHeader"
import { getSession } from "@/utils/getSession"

export default async function PublicLayout({ children }: PropsWithChildren) {
  const { user } = await getSession()

  return (
    <>
      <SkipLinks
        links={[
          { label: "Menu", anchor: "#header-links" },
          { label: "Contenu", anchor: "#home-pro-content" },
          { label: "Pied de page", anchor: "#footer-links" },
        ]}
      />
      <PublicHeader user={user} />
      <Box component="main" role="main" sx={{ marginBottom: fr.spacing("8v") }}>
        {children}
      </Box>
      <Footer />
    </>
  )
}
