"use client"

import { Box } from "@mui/material"

import { useCandidatRechercheParams } from "@/app/(candidat)/recherche/_hooks/useCandidatRechercheParams"
import { useUpdateCandidatSearchParam } from "@/app/(candidat)/recherche/_hooks/useUpdateCandidatSearchParam"
import { RechercheForm } from "@/app/_components/RechercheForm/RechercheForm"
import { RechercheFormTitle } from "@/app/_components/RechercheForm/RechercheFormTitle"

export function CandidatRechercheForm() {
  const params = useCandidatRechercheParams()
  const onSubmit = useUpdateCandidatSearchParam()

  return (
    <Box>
      <Box
        sx={{
          display: {
            xs: "block",
            lg: "none",
          },
        }}
      >
        <RechercheFormTitle />
      </Box>
      <RechercheForm type="recherche" onSubmit={onSubmit} initialValue={params} />
    </Box>
  )
}
