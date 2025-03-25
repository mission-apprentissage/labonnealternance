"use client"

import { Box } from "@mui/material"
import { captureException } from "@sentry/nextjs"
import { Suspense, useEffect } from "react"

import { useNavigateToRecherchePage } from "@/app/(candidat)/recherche/_hooks/useNavigateToRecherchePage"
import type { WithRecherchePageParams } from "@/app/(candidat)/recherche/_utils/recherche.route.utils"
import { RechercheForm, type RechercheFormProps } from "@/app/_components/RechercheForm/RechercheForm"
import { RechercheFormTitle } from "@/app/_components/RechercheForm/RechercheFormTitle"
import { apiGet } from "@/utils/api.utils"

export function CandidatRechercheFormUi(props: Pick<RechercheFormProps, "initialValue" | "onSubmit">) {
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
      <RechercheForm type="recherche" onSubmit={props.onSubmit} initialValue={props.initialValue} />
    </Box>
  )
}

function CandidatRechercheFormComponent(props: WithRecherchePageParams) {
  const navigateToRecherchePage = useNavigateToRecherchePage(props.params)

  useEffect(() => {
    const controller = new AbortController()
    if (props.params.geo !== null && props.params.geo.address === null) {
      apiGet("/_private/geo/commune/reverse", { querystring: { latitude: props.params.geo.latitude, longitude: props.params.geo.longitude } }, { signal: controller.signal })
        .then((commune) => {
          if (controller.signal.aborted) {
            return
          }

          navigateToRecherchePage({ geo: { ...props.params.geo, address: commune.nom } }, true)
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
  }, [props.params, navigateToRecherchePage])

  return <CandidatRechercheFormUi onSubmit={navigateToRecherchePage} initialValue={props.params} />
}

export function CandidatRechercheForm(props: WithRecherchePageParams) {
  return (
    <Suspense fallback={<CandidatRechercheFormUi onSubmit={null} initialValue={null} />}>
      <CandidatRechercheFormComponent {...props} />
    </Suspense>
  )
}
