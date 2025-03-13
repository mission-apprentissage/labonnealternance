"use client"

import { fr } from "@codegouvfr/react-dsfr"
import { Box, Link } from "@mui/material"
import { useParams } from "next/navigation"

import { DepotRapideFin } from "@/app/(espace-pro)/_components/DepotRapideFin"
import { useUserNavigationContext } from "@/app/(espace-pro)/espace-pro/(connected)/hooks/useUserNavigationContext"
import { useConnectedSessionClient } from "@/app/(espace-pro)/espace-pro/contexts/userContext"
import { Breadcrumb } from "@/app/_components/Breadcrumb"
import { PAGES } from "@/utils/routes.utils"

export default function OffreFin() {
  const userNavigationContext = useUserNavigationContext()
  const { user } = useConnectedSessionClient()

  const { job_id } = useParams() as { job_id: string }

  return (
    <>
      <Breadcrumb
        pages={[
          PAGES.dynamic.administrationDesOffres(userNavigationContext),
          PAGES.dynamic.espaceProCreationFin({
            email: user.email,
            token: null,
            userId: user._id.toString(),
            jobId: job_id,
            fromDashboard: true,
            isWidget: false,
            withDelegation: false,
          }),
        ]}
      />

      <Box sx={{ margin: "0 auto", maxWidth: "1200px", padding: fr.spacing("4w") }}>
        <Link
          href={PAGES.dynamic
            .espaceProCreationFin({ email: user.email, token: null, userId: user._id.toString(), jobId: job_id, fromDashboard: true, isWidget: false, withDelegation: false })
            .getPath()}
        >
          Retour aux offres
        </Link>
        <DepotRapideFin />
      </Box>
    </>
  )
}
