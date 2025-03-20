"use client"

import { Box } from "@mui/material"
import { captureException } from "@sentry/nextjs"
import { useEffect } from "react"

import { useCandidatRechercheParams } from "@/app/(candidat)/recherche/_hooks/useCandidatRechercheParams"
import { useNavigateToRecherchePage } from "@/app/(candidat)/recherche/_hooks/useNavigateToRecherchePage"
import { RechercheForm } from "@/app/_components/RechercheForm/RechercheForm"
import { RechercheFormTitle } from "@/app/_components/RechercheForm/RechercheFormTitle"
import { apiGet } from "@/utils/api.utils"

export function CandidatRechercheForm() {
  const params = useCandidatRechercheParams()
  const navigateToRecherchePage = useNavigateToRecherchePage()

  useEffect(() => {
    const controller = new AbortController()
    if (params.geo !== null && params.geo.address === null) {
      apiGet("/_private/geo/commune/reverse", { querystring: { latitude: params.geo.latitude, longitude: params.geo.longitude } }, { signal: controller.signal })
        .then((commune) => {
          if (controller.signal.aborted) {
            return
          }

          navigateToRecherchePage({ geo: { ...params.geo, address: commune.nom } }, true)
        })
        .catch((err) => {
          if (controller.signal.aborted) {
            return
          }

          captureException(err)
        })
    }

    return () => {
      controller.abort()
    }
  }, [params, navigateToRecherchePage])

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
      <RechercheForm type="recherche" onSubmit={navigateToRecherchePage} initialValue={params} />
    </Box>
  )
}
