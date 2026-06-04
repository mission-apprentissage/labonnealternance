import SkipLinks from "@codegouvfr/react-dsfr/SkipLinks"
import type { PropsWithChildren } from "react"
import { Footer } from "@/app/_components/Footer"
import DefaultContainer from "@/app/_components/Layout/DefaultContainer"
import { PublicHeader } from "@/app/_components/PublicHeader"
import { DepotSimplifieStyling } from "@/components/espace_pro/common/components/DepotSimplifieLayout"

export default async function HomeLayout({ children }: PropsWithChildren) {
  return (
    <>
      <SkipLinks
        links={[
          { label: "Menu", anchor: "#header-links" },
          { label: "Contenu", anchor: "#main-content" },
          { label: "Pied de page", anchor: "#footer-links" },
        ]}
      />
      <PublicHeader />

      <DefaultContainer>{children}</DefaultContainer>
      <Footer />
    </>
  )
}
