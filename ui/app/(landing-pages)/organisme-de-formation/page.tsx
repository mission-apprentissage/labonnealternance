import { Box } from "@chakra-ui/react"
import type { Metadata } from "next"

import { HeroCFA } from "@/app/(landing-pages)/organisme-de-formation/_components/HeroCFA"
import { Breadcrumb } from "@/app/_components/Breadcrumb"
import DefaultContainer from "@/app/_components/Layout/DefaultContainer"
import { PAGES } from "@/utils/routes.utils"

export const metadata: Metadata = {
  title: PAGES.static.organismeDeFormation.getMetadata().title,
  description: PAGES.static.organismeDeFormation.getMetadata().description,
}

export default function OrganismeDeFormation() {
  return (
    <Box>
      <Breadcrumb pages={[PAGES.static.organismeDeFormation]} />
      <DefaultContainer>
        <HeroCFA />
      </DefaultContainer>
    </Box>
  )
}
