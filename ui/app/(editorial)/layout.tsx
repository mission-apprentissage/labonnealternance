import { SkipLinks } from "@codegouvfr/react-dsfr/SkipLinks"
import { Box } from "@mui/material"
import type { PropsWithChildren } from "react"
import { Suspense } from "react"
import { Footer } from "@/app/_components/Footer"
import { PublicHeader, PublicHeaderStatic } from "@/app/_components/PublicHeader"
import { footerId, headerId, mainId } from "@/app/_components/zone-ids"
import { getSession } from "@/utils/get-session"

export default function EditorialLayout({ children }: PropsWithChildren) {
  return (
    <>
      <SkipLinks
        links={[
          { label: "Menu", anchor: `#${headerId("editorial")}` },
          { label: "Contenu", anchor: `#${mainId("editorial")}` },
          { label: "Pied de page", anchor: `#${footerId("editorial")}` },
        ]}
      />
      <Suspense fallback={<PublicHeaderStatic zone="editorial" />}>
        <EditorialHeaderWithUser />
      </Suspense>
      <Box component="main" role="main" id={mainId("editorial")} tabIndex={-1}>
        {children}
      </Box>
      <Footer zone="editorial" />
    </>
  )
}

async function EditorialHeaderWithUser() {
  const { user } = await getSession()
  return <PublicHeader zone="editorial" user={user} hideConnectionButton={false} />
}
