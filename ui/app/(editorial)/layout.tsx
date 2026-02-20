import { SkipLinks } from "@codegouvfr/react-dsfr/SkipLinks"
import type { PropsWithChildren } from "react"

import { Box } from "@mui/material"
import { Footer } from "@/app/_components/Footer"
import { PublicHeader } from "@/app/_components/PublicHeader"
import { getSession } from "@/utils/getSession"

export default async function EditorialLayout({ children }: PropsWithChildren) {
  const { user } = await getSession()

  return (
    <>
      <SkipLinks
        links={[
          { label: "Menu", anchor: "#header-links" },
          { label: "Contenu", anchor: "#editorial-content-container" },
          { label: "Pied de page", anchor: "#footer-links" },
        ]}
      />
      <PublicHeader user={user} hideConnectionButton={false} />
      <Box component="main" role="main">
        {children}
      </Box>
      <Footer />
    </>
  )
}
