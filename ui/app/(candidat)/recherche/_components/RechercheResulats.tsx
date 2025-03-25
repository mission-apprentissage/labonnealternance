"use client"
import { Box } from "@mui/material"

import { RechercheCarte } from "@/app/(candidat)/recherche/_components/RechercheResultats/RechercheMap"
import { RechercheResulatsList } from "@/app/(candidat)/recherche/_components/RechercheResultats/RechercheResulatsList"
import type { WithRecherchePageParams } from "@/app/(candidat)/recherche/_utils/recherche.route.utils"

export function RechercheResulats(props: WithRecherchePageParams) {
  return (
    <Box sx={{ display: "grid", gridTemplateColumns: props.params.displayMap ? "1fr 1fr" : "1fr", overflow: "hidden" }}>
      <RechercheResulatsList {...props} />
      {props.params.displayMap && <RechercheCarte item={null} variant="recherche" {...props} />}
    </Box>
  )
}
