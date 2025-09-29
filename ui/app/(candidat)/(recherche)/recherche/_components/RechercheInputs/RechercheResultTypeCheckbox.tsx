import { fr } from "@codegouvfr/react-dsfr"
import { Box, CircularProgress } from "@mui/material"
import { useField } from "formik"
import { assertUnreachable } from "shared"

import { IUseRechercheResults, QueryStatus } from "@/app/(candidat)/(recherche)/recherche/_hooks/useRechercheResults"
import { UserItemTypes } from "@/app/_components/RechercheForm/RechercheForm"

export const RechercheResultTypeCheckboxFormik = ({
  rechercheResults,
  canDisplayCounts,
  forceMobileStyle,
}: {
  rechercheResults?: IUseRechercheResults
  canDisplayCounts?: boolean
  forceMobileStyle?: boolean
}) => {
  const [field, _meta, helper] = useField({ name: "displayedItemTypes" })
  const checkedLabels: UserItemTypes[] = field.value || []

  return (
    <RechercheResultTypeCheckbox
      forceMobileStyle={forceMobileStyle}
      checked={checkedLabels}
      onChange={(newValues) => {
        helper.setValue(newValues, true)
      }}
      rechercheResults={rechercheResults}
      errorMessage={_meta.error}
      canDisplayCounts={canDisplayCounts}
    />
  )
}

export const RechercheResultTypeCheckbox = ({
  id = "displayedItemTypes",
  checked,
  onChange,
  rechercheResults,
  errorMessage,
  canDisplayCounts = true,
  forceMobileStyle = false,
}: {
  id?: string
  checked: UserItemTypes[]
  onChange: (checked: UserItemTypes[]) => void
  rechercheResults?: IUseRechercheResults
  errorMessage?: string
  canDisplayCounts?: boolean
  forceMobileStyle?: boolean
}) => {
  const isChecked = (label: UserItemTypes) => checked.includes(label)

  const toggleValue = (label: UserItemTypes, wasChecked: boolean) => {
    const newCheckedLabels = wasChecked ? checked.filter((labelIte) => labelIte !== label) : [...checked, label]
    onChange(newCheckedLabels)
  }

  const counts = rechercheResults ? getItemCounts(rechercheResults) : null

  const messagesId = `${id}-messages`
  const errorMessageId = `${messagesId}-error`
  const hasError = Boolean(errorMessage)
  return (
    <Box
      sx={{
        marginTop: {
          xs: fr.spacing("1w"),
          md: forceMobileStyle ? fr.spacing("1w") : 0,
        },
        fieldset: {
          maxWidth: {
            xs: "inherit",
            md: forceMobileStyle ? "inherit" : canDisplayCounts ? "180px" : "164px",
          },
        },
      }}
    >
      <fieldset className={`fr-fieldset ${hasError ? "fr-fieldset--error" : ""}`} id={id} aria-labelledby={messagesId} style={{ marginBottom: 0 }}>
        {Object.values(UserItemTypes).map((itemType) => {
          const checked = isChecked(itemType)
          const count = counts?.[itemType]
          const displayLoading: boolean = rechercheResults ? getQueryStatus(rechercheResults, itemType) === "loading" : false
          const checkboxId = `${id}-${itemType}`
          return (
            <Box
              key={itemType}
              className={`fr-fieldset__element`}
              sx={{ marginBottom: "0.5rem", flex: { xs: "0 0 auto", md: forceMobileStyle ? "0 0 auto" : "1 1 100%" } }}
              onClick={(event) => {
                event.preventDefault()
                event.stopPropagation()
                toggleValue(itemType, checked)
                return event
              }}
            >
              <div className="fr-checkbox-group fr-checkbox-group--sm">
                <input name={itemType} id={checkboxId} type="checkbox" checked={checked} data-fr-js-checkbox-input={checked} readOnly />
                <label className="fr-label" htmlFor={checkboxId}>
                  {itemType}
                  {count !== undefined ? ` (${count})` : displayLoading ? <CircularProgress size={14} style={{ marginLeft: fr.spacing("1w") }} /> : null}
                </label>
              </div>
            </Box>
          )
        })}
        <div className="fr-messages-group" id={messagesId} aria-live="polite">
          {hasError && (
            <p className="fr-message fr-message--error" id={errorMessageId}>
              {errorMessage}
            </p>
          )}
        </div>
      </fieldset>
    </Box>
  )
}

function getQueryStatus(rechercheResult: IUseRechercheResults, itemType: UserItemTypes): QueryStatus {
  switch (itemType) {
    case UserItemTypes.EMPLOI:
      return rechercheResult.jobQuery.status
    case UserItemTypes.FORMATIONS:
      return rechercheResult.formationQuery.status
    default:
      assertUnreachable(itemType)
  }
}

function getItemCounts(rechercheResults: IUseRechercheResults) {
  const {
    formationQuery,
    formationQuery: { formations },
    jobQuery,
    jobQuery: { lbaCompanies, lbaJobs, partnerJobs },
  } = rechercheResults
  const jobTotal = lbaCompanies.length + lbaJobs.length + partnerJobs.length
  const result = {
    [UserItemTypes.EMPLOI]: jobQuery.status === "success" ? jobTotal : undefined,
    [UserItemTypes.FORMATIONS]: formationQuery.status === "success" ? formations.length : undefined,
  }
  return result
}
