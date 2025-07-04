import { fr } from "@codegouvfr/react-dsfr"
import { Box } from "@mui/material"
import type { Metadata } from "next"

import { ConnectionActions } from "@/app/(espace-pro)/_components/ConnectionActions"
import { FollowLinkedIn } from "@/app/(espace-pro)/_components/FollowLinkedIn"
import { OffresGratuites } from "@/app/(espace-pro)/_components/OffresGratuites"
import { PromoRessources } from "@/app/(espace-pro)/_components/promoRessources"
import { AlgoRecruiter } from "@/app/(landing-pages)/acces-recruteur/_components/AlgoRecruiter"
import { Entreprise } from "@/app/(landing-pages)/acces-recruteur/_components/Entreprise"
import { GerezOffres } from "@/app/(landing-pages)/acces-recruteur/_components/GerezOffres"
import { OrganismesMandataires } from "@/app/(landing-pages)/acces-recruteur/_components/OrganismesMandataires"
import { PostezVotreOffre } from "@/app/(landing-pages)/acces-recruteur/_components/PostezVotreOffre"
import PageContainer from "@/app/_components/Layout/PageContainer"

import { PAGES } from "../../../utils/routes.utils"
import { Breadcrumb } from "../../_components/Breadcrumb"

export const metadata: Metadata = {
  title: PAGES.static.accesRecruteur.getMetadata().title,
  description: PAGES.static.accesRecruteur.getMetadata().description,
}

export default function AccesRecruteur() {
  return (
    <Box>
      <Box>
        <Breadcrumb pages={[PAGES.static.accesRecruteur]} />
        <PageContainer>
          <Entreprise />

          <Box sx={{ p: fr.spacing("3w"), borderRadius: "10px", backgroundColor: fr.colors.decisions.background.default.grey.hover }}>
            <PostezVotreOffre />
            <OffresGratuites />
            <OrganismesMandataires />
          </Box>

          <GerezOffres />

          <Box>
            <AlgoRecruiter withLinks={true} />
          </Box>

          <Box sx={{ backgroundColor: fr.colors.decisions.background.default.grey.default, pb: fr.spacing("12w") }}>
            <PromoRessources target="recruteur" />
          </Box>

          <Box sx={{ backgroundColor: fr.colors.decisions.background.default.grey.default, pb: fr.spacing("24v") }}>
            <Box sx={{ typography: "h2", textAlign: "center" }}> Vous souhaitez recruter un alternant pour votre entreprise ?</Box>
            <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
              <ConnectionActions service="entreprise" />
            </Box>
          </Box>

          <Box />

          <FollowLinkedIn />
        </PageContainer>
      </Box>
    </Box>
  )
}
