import SkipLinks from "@codegouvfr/react-dsfr/SkipLinks"
import type { PropsWithChildren } from "react"
import { Footer } from "@/app/_components/Footer"
import DefaultContainer from "@/app/_components/Layout/DefaultContainer"
import { PublicHeader } from "@/app/_components/PublicHeader"
import { footerId, headerId, mainId } from "@/app/_components/shell-ids"
import { DepotSimplifieStyling } from "@/components/espace_pro/common/components/DepotSimplifieLayout"
export default async function HomeLayout({ children }: PropsWithChildren) {
  return (
    <>
      <SkipLinks
        links={[
          { label: "Menu", anchor: `#${headerId("rdva")}` },
          { label: "Contenu", anchor: `#${mainId("rdva")}` },
          { label: "Pied de page", anchor: `#${footerId("rdva")}` },
        ]}
      />
      <PublicHeader shell="rdva" />

      <DefaultContainer>{children}</DefaultContainer>
      <Footer shell="rdva" />
    </>
  )
}
