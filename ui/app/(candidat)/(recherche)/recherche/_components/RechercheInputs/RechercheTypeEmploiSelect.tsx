import { useField } from "formik"
import { useCallback } from "react"
import { type ITypeEmploi, TYPE_EMPLOI_OPTIONS } from "shared/constants/recruteur"
import { MultiSelectField, type MultiSelectOption } from "@/app/_components/FormComponents/MultiSelectField"
import type { IUseRechercheResults } from "@/app/(candidat)/(recherche)/recherche/_hooks/useRechercheResults"
import { type DisplayedJob, matchesTypeEmploi } from "@/app/(candidat)/(recherche)/recherche/_hooks/useRechercheResults"
import { MATOMO_EVENTS, pushMatomoEvent } from "@/utils/matomoUtils"

const TYPE_EMPLOI_DESCRIPTIONS: Partial<Record<ITypeEmploi, string>> = {
  [TYPE_EMPLOI_OPTIONS.formation_incluse]: "Vous devrez vous inscrire dans la formation associée à l'offre",
  [TYPE_EMPLOI_OPTIONS.candidatures_spontanees]: "Entreprises susceptibles de recruter en alternance",
}

const typeEmploiValues = Object.values(TYPE_EMPLOI_OPTIONS)

function countByTypeEmploi(jobs: DisplayedJob[], typeEmploi: ITypeEmploi): number {
  return jobs.filter((job) => matchesTypeEmploi(job, typeEmploi)).length
}

function buildOptions(allJobs: DisplayedJob[], hasResults: boolean): MultiSelectOption[] {
  return typeEmploiValues.map((value) => {
    const count = hasResults ? countByTypeEmploi(allJobs, value) : undefined
    return {
      value,
      label: `${value}${count !== undefined ? ` (${count})` : ""}`,
      hintText: TYPE_EMPLOI_DESCRIPTIONS[value],
    }
  })
}

function getLabel(selected: MultiSelectOption[], allOptions: MultiSelectOption[]): string {
  if (selected.length === 0 || selected.length === allOptions.length) return "Indifférent"
  if (selected.length === 1) return selected[0].value
  return `${selected.length} types sélectionnés`
}

export function RechercheTypesEmploiSelect({
  rechercheResults,
  value,
  onChange,
}: {
  rechercheResults?: IUseRechercheResults
  value: ITypeEmploi[]
  onChange: (value: ITypeEmploi[]) => void
}) {
  const allJobs = rechercheResults ? [...rechercheResults.jobQuery.lbaJobs, ...rechercheResults.jobQuery.partnerJobs, ...rechercheResults.jobQuery.lbaCompanies] : []
  const hasResults = rechercheResults?.jobQuery.status === "success"
  const options = buildOptions(allJobs, hasResults)

  const handleOpen = useCallback(() => {
    pushMatomoEvent({ event: MATOMO_EVENTS.FILTER_DROPDOWN_OPENED, filter_name: "type_offres_emploi" })
  }, [])

  const handleConfirm = useCallback(
    (newValue: string[]) => {
      const selectedCount = newValue.reduce((sum, value) => sum + (hasResults ? countByTypeEmploi(allJobs, value as ITypeEmploi) : 0), 0)
      pushMatomoEvent({
        event: MATOMO_EVENTS.FILTER_TYPE_OFFER_APPLIED,
        filter_result_count: selectedCount,
        filter_state: Object.fromEntries(typeEmploiValues.map((v) => [v, newValue.includes(v)])),
        filter_changed_labels: newValue.join("|"),
      })
    },
    [allJobs, hasResults]
  )

  return (
    <MultiSelectField
      id="type-emploi"
      label="Type d'offres d'emploi"
      options={options}
      value={value}
      onChange={(newValue) => onChange(newValue as ITypeEmploi[])}
      onConfirm={handleConfirm}
      onOpen={handleOpen}
      getLabel={getLabel}
      popperSx={{ width: "425px", maxWidth: { xs: "100%", md: "512px" } }}
    />
  )
}

export function RechercheTypesEmploiSelectFormik({ rechercheResults }: { rechercheResults?: IUseRechercheResults }) {
  const [field, , helper] = useField<ITypeEmploi[]>({ name: "typesEmploi" })
  const value = field.value ?? []

  return <RechercheTypesEmploiSelect rechercheResults={rechercheResults} value={value} onChange={(newValue) => helper.setValue(newValue, true)} />
}
