"use client"

import { fr } from "@codegouvfr/react-dsfr"
import { Box } from "@mui/material"

import { DepotRapideFin } from "@/app/(espace-pro)/_components/DepotRapideFin"
import { useUserNavigationContext } from "@/app/(espace-pro)/espace-pro/(connected)/hooks/useUserNavigationContext"
import { Breadcrumb } from "@/app/_components/Breadcrumb"
import { PAGES } from "@/utils/routes.utils"

export default function OffreFin() {
  const userNavigationContext = useUserNavigationContext()

  return (
    <>
      <Breadcrumb pages={[PAGES.dynamic.administrationDesOffres(userNavigationContext)]} />
      <Box sx={{ margin: "0 auto", maxWidth: "1200px", padding: fr.spacing(6) }}>
        <DepotRapideFin />
      </Box>
    </>
  )
}
