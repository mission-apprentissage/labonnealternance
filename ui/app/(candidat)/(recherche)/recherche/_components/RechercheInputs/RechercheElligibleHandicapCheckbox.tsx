import Button from "@codegouvfr/react-dsfr/Button"
import { Box } from "@mui/material"
import { useField } from "formik"

import { useRechercheResults } from "@/app/(candidat)/(recherche)/recherche/_hooks/useRechercheResults"
import type { IRecherchePageParams } from "@/app/(candidat)/(recherche)/recherche/_utils/recherche.route.utils"
import { DsfrLink } from "@/components/dsfr/DsfrLink"
import { InfoTooltipOrModal } from "@/components/InfoTooltipOrModal"
import { MATOMO_EVENTS, pushMatomoEvent } from "@/utils/matomoUtils"

const infoIconButtonId = "recherche-elligible-handicap-tooltip-button"

const trackOnChange = (newValue: boolean, rechercheResults: ReturnType<typeof useRechercheResults>) => {
  pushMatomoEvent({
    event: MATOMO_EVENTS.FILTER_HANDI_CHANGED,
    filter_checked: newValue, // false = filtre désactivé ou true = filtre activé
    filter_total_results: rechercheResults.elligibleHandicapCount, // Nombre total de résultats affichés après application du filtre
  })
}

export function RechercheElligibleHandicapCheckboxFormik({ rechercheParams }: { rechercheParams: IRecherchePageParams }) {
  const [field, _meta, helper] = useField({ name: "elligibleHandicapFilter" })

  return <RechercheElligibleHandicapCheckbox value={field.value} onChange={async (newValue) => helper.setValue(newValue, true)} rechercheParams={rechercheParams} />
}

export function RechercheElligibleHandicapCheckbox({
  value,
  onChange,
  rechercheParams,
}: {
  value: boolean
  onChange: (newValue: boolean) => void
  rechercheParams: IRecherchePageParams
}) {
  const rechercheResults = useRechercheResults(rechercheParams)

  const displayedCount = rechercheResults.jobQuery.status === "success" ? rechercheResults.elligibleHandicapCount : null

  const id = "elligible-handicap"
  const checkboxId = `${id}-checkbox`

  const label = (
    <>
      Employeur handi-accueillant{displayedCount === null ? "" : ` (${displayedCount})`}
      <InfoTooltipOrModal
        tooltipContent={
          <Box sx={{ maxWidth: "800px" }}>
            La bonne alternance met en avant les employeurs engagés pour l’emploi en faveur des personnes en situation de handicap. Ces entreprises sont vérifiées par France
            Travail, Cap emploi et leurs partenaires.{" "}
            <DsfrLink href="/faq?engagement-handicap=1" external aria-label="Accéder à la FAQ - Qu'est-ce qu'un employeur engagé handicap - nouvelle fenêtre">
              En savoir plus
            </DsfrLink>
          </Box>
        }
      >
        <Button priority="tertiary no outline" iconId="ri-question-line" size="small" title="Informations sur les employeurs engagés handicap" id={infoIconButtonId} />
      </InfoTooltipOrModal>
    </>
  )

  return (
    <Box sx={{ marginBottom: "auto" }}>
      <fieldset
        className="fr-fieldset"
        id={id}
        style={{
          marginBottom: "auto !important",
          minWidth: "298px",
        }}
      >
        <Box
          className="fr-fieldset__element"
          sx={{
            marginBottom: "auto",
            marginTop: "auto",
            flex: {
              xs: "0 0 auto",
              md: "1 1 100%",
            },
            "& .fr-label:before": {
              marginTop: "9px !important",
            },
          }}
          onClick={(event) => {
            const { target } = event
            event.preventDefault()
            event.stopPropagation()
            if ("id" in target && target.id === infoIconButtonId) {
              return false
            }
            onChange(!value)
            trackOnChange(!value, rechercheResults)
            return false
          }}
        >
          <div className="fr-checkbox-group fr-checkbox-group--sm">
            <input name={id} id={checkboxId} type="checkbox" checked={value} data-fr-js-checkbox-input={value} readOnly />
            <label className="fr-label" htmlFor={checkboxId}>
              {label}
            </label>
          </div>
        </Box>
      </fieldset>
    </Box>
  )
}
