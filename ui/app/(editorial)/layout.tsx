import { SkipLinks } from "@codegouvfr/react-dsfr/SkipLinks"
import { Box } from "@mui/material"
import type { PropsWithChildren } from "react"
import { Suspense } from "react"
import { Footer } from "@/app/_components/Footer"
import { PublicHeader, PublicHeaderStatic } from "@/app/_components/PublicHeader"
import { footerId, headerId, mainId } from "@/app/_components/zone-ids"
import LoadingEmptySpace from "@/app/(espace-pro)/_components/LoadingEmptySpace"
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
        {/* Un notFound() levé pendant le rendu serveur bascule la <Suspense> la plus proche en rendu client.
            Sans celle-ci, c'est celle de app/loading.tsx, qui englobe ce layout : il se retrouve en double dans le DOM (#5547). */}
        <Suspense fallback={<LoadingEmptySpace />}>{children}</Suspense>
      </Box>
      <Footer zone="editorial" />
    </>
  )
}

async function EditorialHeaderWithUser() {
  const { user } = await getSession()
  return <PublicHeader zone="editorial" user={user} hideConnectionButton={false} />
}
