import { Box } from "@mui/material"
import type { Metadata } from "next"

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
        </DefaultContainer>
      </Box>
    </Box>
  )
}
