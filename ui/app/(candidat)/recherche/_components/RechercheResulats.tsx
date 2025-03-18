"use client"
import { Box } from "@mui/material"

import { RechercheCarte } from "@/app/(candidat)/recherche/_components/RechercheResultats/RechercheMap"
import { RechercheResulatsList } from "@/app/(candidat)/recherche/_components/RechercheResultats/RechercheResulatsList"
import { useCandidatRechercheParams } from "@/app/(candidat)/recherche/_hooks/useCandidatRechercheParams"

export function RechercheResulats() {
  const params = useCandidatRechercheParams()

  return (
    <Box sx={{ display: "grid", gridTemplateColumns: params.displayMap ? "1fr 1fr" : "1fr" }}>
      <RechercheResulatsList />
      {params.displayMap && <RechercheCarte />}
    </Box>
  )
}
