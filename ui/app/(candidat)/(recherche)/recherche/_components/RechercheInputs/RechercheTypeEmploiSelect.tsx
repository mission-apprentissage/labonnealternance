import { fr } from "@codegouvfr/react-dsfr"
import Checkbox from "@codegouvfr/react-dsfr/Checkbox"
import { Box, ClickAwayListener, Popper } from "@mui/material"
import { useField } from "formik"
import { useCallback, useRef, useState } from "react"
import { typedEntries } from "shared"
import { type ITypeEmploi, TYPE_EMPLOI_OPTIONS } from "shared/constants/recruteur"
import { SelectField } from "@/app/_components/FormComponents/SelectField"
import type { IUseRechercheResults } from "@/app/(candidat)/(recherche)/recherche/_hooks/useRechercheResults"
import { type DisplayedJob, matchesTypeEmploi } from "@/app/(candidat)/(recherche)/recherche/_hooks/useRechercheResults"
import { MATOMO_EVENTS, pushMatomoEvent } from "@/utils/matomoUtils"

const TYPE_EMPLOI_DESCRIPTIONS: Partial<Record<ITypeEmploi, string>> = {
  formation_incluse: "Vous devrez vous inscrire dans la formation associée à l'offre",
  candidatures_spontanees: "Entreprises susceptibles de recruter en alternance",
}

const typeEmploiEntries = typedEntries(TYPE_EMPLOI_OPTIONS)

function countByTypeEmploi(jobs: DisplayedJob[], typeEmploi: ITypeEmploi): number {
  return jobs.filter((job) => matchesTypeEmploi(job, typeEmploi)).length
}

function getLabel(selected: ITypeEmploi[]): string {
  if (selected.length === 0 || selected.length === typeEmploiEntries.length) return "Indifférent"
  if (selected.length === 1) return TYPE_EMPLOI_OPTIONS[selected[0]]
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
  const [open, setOpen] = useState(false)
  const anchorRef = useRef<HTMLDivElement>(null)

  // On utilise les jobs non filtrés (jobQuery) pour les compteurs, pas displayedJobs
  const allJobs = rechercheResults ? [...rechercheResults.jobQuery.lbaJobs, ...rechercheResults.jobQuery.partnerJobs, ...rechercheResults.jobQuery.lbaCompanies] : []

  const toggle = useCallback(
    (typeEmploi: ITypeEmploi) => {
      const isSelected = value.includes(typeEmploi)
      const newValue = isSelected ? value.filter((v) => v !== typeEmploi) : [...value, typeEmploi]
      onChange(newValue)
    },
    [value, onChange]
  )

  return (
    <Box
      ref={anchorRef}
      sx={{ display: "inline-block", position: "relative", maxWidth: { md: "650px", xs: "100%" } }}
      onClick={() => {
        setOpen((prev) => !prev)
        pushMatomoEvent({
          event: MATOMO_EVENTS.FILTER_DROPDOWN_OPENED,
          filter_name: "type_offres_emploi",
        })
      }}
    >
      <SelectField
        id="type-emploi"
        label="Type d'offres d'emploi"
        style={{
          marginBottom: 0,
          textWrap: "nowrap",
          pointerEvents: "none",
        }}
        options={[{ value: "__current__", label: getLabel(value) }]}
        nativeSelectProps={{
          value: "__current__",
          tabIndex: -1,
          style: { fontWeight: 700 },
        }}
      />
      <Popper
        open={open}
        anchorEl={anchorRef.current}
        placement="bottom-start"
        sx={{ zIndex: 1300, minWidth: anchorRef.current?.offsetWidth, width: "712px", maxWidth: { xs: "100%", md: "512px" } }}
        disablePortal
      >
        <ClickAwayListener onClickAway={() => setOpen(false)}>
          <Box
            onClick={(e) => e.stopPropagation()}
            sx={{
              background: "white",
              border: "1px solid",
              borderColor: fr.colors.decisions.border.default.grey.default,
              borderRadius: "4px",
              boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
              padding: `${fr.spacing("1v")} ${fr.spacing("1v")} ${fr.spacing("1v")} ${fr.spacing("3v")}`,
              "& .fr-fieldset": {
                margin: 0,
              },
              "& .fr-fieldset__element": {
                margin: 0,
              },
              "& .fr-checkbox-group": {
                minHeight: "auto",
                marginTop: "0 !important",
                display: "flex",
              },
              "& .fr-checkbox-group label": {
                margin: "auto !important",
                marginLeft: `${fr.spacing("5v")} !important`,
                paddingTop: fr.spacing("1v"),
                paddingBottom: fr.spacing("1v"),
              },
              "& .fr-checkbox-group label::before": {
                margin: "auto !important",
                marginLeft: `0 !important`,
              },
              "& .fr-hint-text": {
                marginTop: 0,
              },
            }}
          >
            <Checkbox
              small
              style={{ margin: 0 }}
              options={typeEmploiEntries.map(([key, label]) => {
                const count = rechercheResults?.jobQuery.status === "success" ? countByTypeEmploi(allJobs, key) : undefined
                const description = TYPE_EMPLOI_DESCRIPTIONS[key]
                return {
                  label: `${label}${count !== undefined ? ` (${count})` : ""}`,
                  hintText: description,
                  nativeInputProps: {
                    checked: value.includes(key),
                    onChange: () => {
                      toggle(key)
                      pushMatomoEvent({
                        event: "filter_type_offer_changed",
                        filter_label: key,
                        // Le nouvel état du filtre après le changement (true = cochée, false = décochée)
                        filter_checked: !value.includes(key),
                        // Le nombre des résultats affichés après le changement de filtre. On utilise countByTypeEmploi pour calculer ce nombre en fonction du nouvel état du filtre
                        filter_result_count: count ?? 0,
                        // L'état complet des filtres APRÈS le changement
                        filter_state: typeEmploiEntries.reduce(
                          (acc, [k]) => ({ ...acc, [k]: k === key ? !value.includes(k) : value.includes(k) }),
                          {} as Record<ITypeEmploi, boolean>
                        ),
                      })
                    },
                  },
                }
              })}
            />
          </Box>
        </ClickAwayListener>
      </Popper>
    </Box>
  )
}

export function RechercheTypesEmploiSelectFormik({ rechercheResults }: { rechercheResults?: IUseRechercheResults }) {
  const [field, , helper] = useField<ITypeEmploi[]>({ name: "typesEmploi" })
  const value = field.value ?? []

  return <RechercheTypesEmploiSelect rechercheResults={rechercheResults} value={value} onChange={(newValue) => helper.setValue(newValue, true)} />
}
