import { SkipLinks } from "@codegouvfr/react-dsfr/SkipLinks"
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
          { label: "Recherche", anchor: "#search-form" },
          { label: "Menu", anchor: "#header-links" },
          { label: "Contenu", anchor: "#home-content-container" },
          { label: "Pied de page", anchor: "#footer-links" },
        ]}
      />
      <Suspense fallback={<PublicHeaderStatic />}>
        <PublicHeaderWithUser />
      </Suspense>
      {children}
      <Footer />
    </>
  )
}

async function PublicHeaderWithUser() {
  const { user } = await getSession()
  return <PublicHeader user={user} />
}
