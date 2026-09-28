import { SkipLinks } from "@codegouvfr/react-dsfr/SkipLinks"
import type { PropsWithChildren } from "react"
import { Suspense } from "react"

import { Footer } from "@/app/_components/Footer"
import { PublicHeader, PublicHeaderStatic } from "@/app/_components/PublicHeader"
import { footerId, headerId, mainId, zoneScopedId } from "@/app/_components/zone-ids"
import { getSession } from "@/utils/get-session"

export default function HomeLayout({ children }: PropsWithChildren) {
  return (
    <>
      <SkipLinks
        links={[
          { label: "Recherche", anchor: `#${zoneScopedId("home", "search-form")}` },
          { label: "Menu", anchor: `#${headerId("home")}` },
          { label: "Contenu", anchor: `#${mainId("home")}` },
          { label: "Pied de page", anchor: `#${footerId("home")}` },
        ]}
      />
      <Suspense fallback={<PublicHeaderStatic zone="home" />}>
        <PublicHeaderWithUser />
      </Suspense>
      {children}
      <Footer zone="home" />
    </>
  )
}

async function PublicHeaderWithUser() {
  const { user } = await getSession()
  return <PublicHeader zone="home" user={user} />
}
