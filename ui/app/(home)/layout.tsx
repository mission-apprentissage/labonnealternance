import { SkipLinks } from "@codegouvfr/react-dsfr/SkipLinks"
import type { PropsWithChildren } from "react"

import { PublicHeader } from "@/app/(espace-pro)/_components/PublicHeader"
import { Footer } from "@/app/_components/Footer"
import { getSession } from "@/utils/getSession"

export default async function HomeLayout({ children }: PropsWithChildren) {
  const { user } = await getSession()

  return (
    <>
      <SkipLinks
        links={[
          { label: "Recherche", anchor: "#home-search-form" },
          { label: "Menu", anchor: "#fr-header-quick-access-item-0" },
          { label: "Contenu", anchor: "#home-content-container" },
          { label: "Pied de page", anchor: "#footer-links" },
        ]}
      />
      <PublicHeader user={user} hideConnectionButton={true} />
      {children}
      <Footer />
    </>
  )
}
