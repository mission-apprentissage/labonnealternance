import { SkipLinks } from "@codegouvfr/react-dsfr/SkipLinks"

// CSS Notion chargé ici plutôt que dans le layout racine : seules les pages de ce
// groupe rendent du contenu Notion, inutile de bloquer le rendu des autres pages avec.
import "react-notion-x/src/styles.css"
import "@/public/styles/notion.css"
import { Box } from "@mui/material"
import type { PropsWithChildren } from "react"
import { Suspense } from "react"
import { Footer } from "@/app/_components/Footer"
import { PublicHeader, PublicHeaderStatic } from "@/app/_components/PublicHeader"
import { footerId, headerId, mainId } from "@/app/_components/zone-ids"
import { getSession } from "@/utils/get-session"

export default function HomeLayout({ children }: PropsWithChildren) {
  return (
    <>
      <SkipLinks
        links={[
          { label: "Menu", anchor: `#${headerId("editorial-notion")}` },
          { label: "Contenu", anchor: `#${mainId("editorial-notion")}` },
          { label: "Pied de page", anchor: `#${footerId("editorial-notion")}` },
        ]}
      />
      <Suspense fallback={<PublicHeaderStatic zone="editorial-notion" />}>
        <EditorialWithNotionHeaderWithUser />
      </Suspense>
      <Box id={mainId("editorial-notion")} tabIndex={-1}>
        {children}
      </Box>
      <Footer zone="editorial-notion" />
    </>
  )
}

async function EditorialWithNotionHeaderWithUser() {
  const { user } = await getSession()
  return <PublicHeader zone="editorial-notion" user={user} hideConnectionButton={true} />
}
