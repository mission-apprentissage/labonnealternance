import SkipLinks from "@codegouvfr/react-dsfr/SkipLinks"
import { Box } from "@mui/material"
import type { PropsWithChildren } from "react"
import { Suspense } from "react"
import { Footer } from "@/app/_components/Footer"
import DefaultContainer from "@/app/_components/Layout/DefaultContainer"
import { PublicHeader } from "@/app/_components/PublicHeader"
import { footerId, headerId, mainId } from "@/app/_components/zone-ids"
import LoadingEmptySpace from "@/app/(espace-pro)/_components/LoadingEmptySpace"
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
      <PublicHeader zone="rdva" />

      <Box component="main" role="main" id={mainId("rdva")} tabIndex={-1}>
        <DefaultContainer>
          {/* cf. app/(editorial)/layout.tsx */}
          <Suspense fallback={<LoadingEmptySpace />}>{children}</Suspense>
        </DefaultContainer>
      </Box>
      <Footer zone="rdva" />
    </>
  )
}
