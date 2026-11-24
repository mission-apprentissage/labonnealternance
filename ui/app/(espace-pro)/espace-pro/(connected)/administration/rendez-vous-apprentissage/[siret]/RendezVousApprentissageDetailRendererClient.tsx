"use client"

import { fr } from "@codegouvfr/react-dsfr"
import { Box, Typography } from "@mui/material"
import { useParams } from "next/navigation"
import type { IETFAParametersJson, IEtablissementJson } from "shared"
import { Breadcrumb } from "@/app/_components/Breadcrumb"
import EtablissementComponent from "@/app/(espace-pro)/espace-pro/(connected)/administration/_components/EtablissementComponent"
import { PAGES } from "@/utils/routes.utils"
import { FormationsTable } from "./FormationsTable"

export default function RendezVousApprentissageDetailRendererClient({
  eligibleTrainingsForAppointmentResult,
  etablissement,
}: {
  eligibleTrainingsForAppointmentResult: IETFAParametersJson | null
  etablissement: IEtablissementJson | null
}) {
  const { siret } = useParams() as { siret: string }

  return (
    <>
      <Breadcrumb pages={[PAGES.static.backAdminHome, PAGES.static.rendezVousApprentissageRecherche, PAGES.dynamic.rendezVousApprentissageDetail({ siret })]} />
      <Typography variant="h2" component="h1" gutterBottom>
        Gestion de l'établissement
      </Typography>
      {eligibleTrainingsForAppointmentResult ? (
        <Box sx={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr)", gap: fr.spacing("10v") }}>
          <EtablissementComponent id={etablissement?._id.toString()} />
          <FormationsTable formations={eligibleTrainingsForAppointmentResult.parameters} />
        </Box>
      ) : (
        <Typography>Etablissement introuvable</Typography>
      )}
    </>
  )
}
