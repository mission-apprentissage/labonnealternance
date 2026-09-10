import { SkipLinks } from "@codegouvfr/react-dsfr/SkipLinks"
import { Box } from "@mui/material"
import type { PropsWithChildren } from "react"
import { Suspense } from "react"
import { Footer } from "@/app/_components/Footer"
import { PublicHeader, PublicHeaderStatic } from "@/app/_components/PublicHeader"
import { footerId, headerId } from "@/app/_components/shell-ids"
import { getSession } from "@/utils/get-session"

export default function EditorialLayout({ children }: PropsWithChildren) {
  return (
    <>
      <SkipLinks
        links={[
          { label: "Menu", anchor: `#${headerId("editorial")}` },
          { label: "Contenu", anchor: "#editorial-content-container" },
          { label: "Pied de page", anchor: `#${footerId("editorial")}` },
        ]}
      />
      <Suspense fallback={<PublicHeaderStatic shell="editorial" />}>
        <EditorialHeaderWithUser />
      </Suspense>
      <Box component="main" role="main">
        {children}
      </Box>
      <Footer shell="editorial" />
    </>
  )
}

async function EditorialHeaderWithUser() {
  const { user } = await getSession()
  return <PublicHeader shell="editorial" user={user} hideConnectionButton={false} />
}
