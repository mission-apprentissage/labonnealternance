import { SkipLinks } from "@codegouvfr/react-dsfr/SkipLinks"
import type { PropsWithChildren } from "react"
import { Suspense } from "react"

import { Footer } from "@/app/_components/Footer"
import { PublicHeader, PublicHeaderStatic } from "@/app/_components/PublicHeader"
import { footerId, headerId } from "@/app/_components/shell-ids"
import { getSession } from "@/utils/get-session"

export default function HomeLayout({ children }: PropsWithChildren) {
  return (
    <>
      <SkipLinks
        links={[
          { label: "Recherche", anchor: "#search-form" },
          { label: "Menu", anchor: `#${headerId("home")}` },
          { label: "Contenu", anchor: "#home-content-container" },
          { label: "Pied de page", anchor: `#${footerId("home")}` },
        ]}
      />
      <Suspense fallback={<PublicHeaderStatic shell="home" />}>
        <PublicHeaderWithUser />
      </Suspense>
      {children}
      <Footer shell="home" />
    </>
  )
}

async function PublicHeaderWithUser() {
  const { user } = await getSession()
  return <PublicHeader shell="home" user={user} />
}
