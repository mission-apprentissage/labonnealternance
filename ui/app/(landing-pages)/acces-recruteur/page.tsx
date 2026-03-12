import { Box } from "@mui/material"
import type { Metadata } from "next"
import { Breadcrumb } from "@/app/_components/Breadcrumb"
import DefaultContainer from "@/app/_components/Layout/DefaultContainer"
import { PAGES } from "@/utils/routes.utils"
import { HeroRecruteur } from "./_components/HeroRecruteur"

export const metadata: Metadata = {
  title: PAGES.static.accesRecruteur.getMetadata().title,
  description: PAGES.static.accesRecruteur.getMetadata().description,
}

export default function AccesRecruteur() {
  return (
    <Box>
      <Breadcrumb pages={[PAGES.static.accesRecruteur]} />
      <DefaultContainer>
        <HeroRecruteur />
      </DefaultContainer>
    </Box>
  )
}
