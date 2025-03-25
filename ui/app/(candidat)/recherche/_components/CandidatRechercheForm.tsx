"use client"

import { createModal } from "@codegouvfr/react-dsfr/Modal"
import { prDsfrLoaded } from "@codegouvfr/react-dsfr/start"
import { Box } from "@mui/material"
import { captureException } from "@sentry/nextjs"
import { useCallback, useEffect } from "react"

import { useNavigateToRecherchePage } from "@/app/(candidat)/recherche/_hooks/useNavigateToRecherchePage"
import type { IRecherchePageParams, WithRecherchePageParams } from "@/app/(candidat)/recherche/_utils/recherche.route.utils"
import { RechercheForm } from "@/app/_components/RechercheForm/RechercheForm"
import { RechercheFormTitle } from "@/app/_components/RechercheForm/RechercheFormTitle"
import { apiGet } from "@/utils/api.utils"

export const candidatRechercheFormModal = createModal({
  id: "candidat-recherche-form-modal",
  isOpenedByDefault: false,
})

export function CandidatRechercheForm(props: WithRecherchePageParams) {
  const navigateToRecherchePage = useNavigateToRecherchePage(props.params)

  const onSubmit = useCallback(
    (result: Pick<IRecherchePageParams, "romes" | "diploma" | "job_name" | "geo" | "job_type" | "activeItems">) => {
      prDsfrLoaded.then(() => {
        candidatRechercheFormModal.close()
      })
      navigateToRecherchePage(result)
    },
    [navigateToRecherchePage]
  )

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

  return (
    <Box>
      <Box
        sx={{
          display: {
            xs: "block",
            md: "none",
          },
        }}
      >
        <candidatRechercheFormModal.Component title={<RechercheFormTitle />} topAnchor size="large">
          <RechercheForm type="recherche" onSubmit={onSubmit} initialValue={props.params} />
        </candidatRechercheFormModal.Component>
      </Box>

      <Box
        sx={{
          display: {
            xs: "none",
            md: "block",
          },
        }}
      >
        <RechercheForm type="recherche" onSubmit={onSubmit} initialValue={props.params} />
      </Box>
    </Box>
  )
}
