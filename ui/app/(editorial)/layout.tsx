import { SkipLinks } from "@codegouvfr/react-dsfr/SkipLinks"
import { Box } from "@mui/material"
import type { PropsWithChildren } from "react"
import { Suspense } from "react"
import { Footer } from "@/app/_components/Footer"
import { PublicHeader, PublicHeaderStatic } from "@/app/_components/PublicHeader"
import { getSession } from "@/utils/get-session"

export default function EditorialLayout({ children }: PropsWithChildren) {
  return (
    <>
      <SkipLinks
        links={[
          { label: "Menu", anchor: "#header-links" },
          { label: "Contenu", anchor: "#editorial-content-container" },
          { label: "Pied de page", anchor: "#footer-links" },
        ]}
      />
      <Suspense fallback={<PublicHeaderStatic />}>
        <EditorialHeaderWithUser />
      </Suspense>
      <Box component="main" role="main">
        {children}
      </Box>
      <Footer />
    </>
  )
}

async function EditorialHeaderWithUser() {
  const { user } = await getSession()
  return <PublicHeader user={user} hideConnectionButton={false} />
}
