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
import { getSession } from "@/utils/get-session"

export default function HomeLayout({ children }: PropsWithChildren) {
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
        <EditorialWithNotionHeaderWithUser />
      </Suspense>
      <Box>{children}</Box>
      <Footer />
    </>
  )
}

async function EditorialWithNotionHeaderWithUser() {
  const { user } = await getSession()
  return <PublicHeader user={user} hideConnectionButton={true} />
}
