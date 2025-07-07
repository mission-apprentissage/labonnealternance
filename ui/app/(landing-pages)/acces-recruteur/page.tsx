import { fr } from "@codegouvfr/react-dsfr"
import { Box } from "@mui/material"
import type { Metadata } from "next"

import { ConnectionActions } from "@/app/(espace-pro)/_components/ConnectionActions"
import { FollowLinkedIn } from "@/app/(espace-pro)/_components/FollowLinkedIn"
import { PromoRessources } from "@/app/(espace-pro)/_components/promoRessources"
import { AlgoRecruiter } from "@/app/(landing-pages)/acces-recruteur/_components/AlgoRecruiter"
import { Entreprise } from "@/app/(landing-pages)/acces-recruteur/_components/Entreprise"
import { HeroRecruteur } from "@/app/(landing-pages)/acces-recruteur/_components/HeroRecruteur"
import DefaultContainer from "@/app/_components/Layout/DefaultContainer"

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

        <DefaultContainer>
          <Entreprise />

          <HeroRecruteur />

          {/* <GerezOffres /> */}

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
        </DefaultContainer>
      </Box>
    </Box>
  )
}
