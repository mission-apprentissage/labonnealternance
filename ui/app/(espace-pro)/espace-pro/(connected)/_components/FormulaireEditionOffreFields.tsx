"use client"

import { fr } from "@codegouvfr/react-dsfr"
import Checkbox from "@codegouvfr/react-dsfr/Checkbox"
import Input from "@codegouvfr/react-dsfr/Input"
import Select from "@codegouvfr/react-dsfr/Select"
import { Box, FormControl, FormLabel, Link } from "@mui/material"
import dayjs from "dayjs"
import { useField, useFormikContext } from "formik"
import { useParams } from "next/navigation"
import type React from "react"
import type { IAppellationsRomes } from "shared"
import { NIVEAU_DIPLOME_LABEL, TRAINING_CONTRACT_TYPE } from "shared/constants/recruteur"
import { AUTHTYPE } from "@/common/contants"
import { DropdownCombobox } from "@/components/espace_pro"
import { useAuth } from "@/context/UserContext"
import { apiGet } from "@/utils/api.utils"
import { debounce } from "@/utils/debounce"
import { ChampNombre } from "./ChampNombre"
import { JobStartDateFields } from "./JobStartDateFields"

const ISO_DATE_FORMAT = "YYYY-MM-DD"

export const FormulaireEditionOffreFields = ({ onRomeChange, section }: { onRomeChange?: (rome: string, appellation: string) => void; section: "contract" | "offer" }) => {
  const { user } = useAuth()

  const { type } = useParams() as { establishment_id: string; email: string; userId: string; type: string; token: string }

  const handleJobSearch = async (search: string) => {
    if (search.trim().length !== 0) {
      try {
        const result = await apiGet(`/_private/metiers/intitule`, { querystring: { label: search } })
        return result.coupleAppellationRomeMetier
      } catch (error: any) {
        throw new Error(error)
      }
    }
    return []
  }

  const minStartDate = dayjs().startOf("day")
  const maxStartDate = dayjs().add(2, "years")

  const { values, setFieldValue, setValues, handleChange, handleBlur, errors, touched } = useFormikContext<any>()
  const offerTitleCustomError = touched.offer_title_custom && (errors.offer_title_custom as string | undefined)
  const jobLevelLabelError = Boolean(errors.job_level_label && touched.job_level_label)

  if (section === "offer") {
    return (
      <>
        <FormControl required={true} sx={{ width: "100%" }}>
          <DropdownCombobox
            label="Métier"
            handleSearch={debounce(handleJobSearch, 300)}
            saveSelectedItem={(item: IAppellationsRomes["coupleAppellationRomeMetier"][number]) => {
              setTimeout(() => {
                setValues(
                  (prev) => ({
                    ...prev,
                    rome_label: item.intitule,
                    rome_appellation_label: item.appellation,
                    rome_code: [item.code_rome],
                  }),
                  true
                )
                onRomeChange?.(item.code_rome, item.appellation)
              }, 0)
            }}
            name="rome_label"
            value={values.rome_appellation_label}
            placeholder="Rechercher un métier"
            dataTestId="offre-metier"
          />
        </FormControl>
        {values.rome_label && (
          <Box sx={{ mt: fr.spacing("4v") }}>
            <Input
              label="Intitulé de l'offre si différent (Facultatif)"
              hintText="Personnalisez le titre du poste."
              state={offerTitleCustomError ? "error" : "default"}
              stateRelatedMessage={offerTitleCustomError}
              nativeInputProps={{
                value: values.offer_title_custom,
                type: "text",
                name: "offer_title_custom",
                onChange: async (e) => setFieldValue("offer_title_custom", e.target.value),
                onBlur: handleBlur,
                // aria-invalid : cf. HandiEngagementSelect
                "aria-invalid": Boolean(offerTitleCustomError),
              }}
            />
          </Box>
        )}
      </>
    )
  }

  return (
    <>
      <Box sx={{ mt: fr.spacing("4v") }} data-field-name="job_type">
        <Checkbox
          orientation="vertical"
          state={values.job_type.length === 0 ? "error" : "default"}
          stateRelatedMessage={values.job_type.length === 0 ? "Champ obligatoire" : undefined}
          options={Object.values(TRAINING_CONTRACT_TYPE).map((label) => {
            return {
              label: label,
              nativeInputProps: {
                name: label,
                checked: values.job_type.includes(label),
                onChange: (e) => {
                  setFieldValue("job_type", e.target.checked ? [...values.job_type, label] : values.job_type.filter((item) => item !== label))
                },
              },
            }
          })}
          legend={
            <>
              <FormLabel
                sx={{ ...(values.job_type.length === 0 ? { color: fr.colors.decisions.text.default.error.default } : {}), display: "inline-block", mb: 0, mr: fr.spacing("2v") }}
              >
                Type de contrat
              </FormLabel>
              <Link href="https://www.service-public.fr/professionnels-entreprises/vosdroits/F31704" target="_blank" rel="noreferrer noopener">
                En savoir plus
                <span className="fr-sr-only">{" - Accès au contrat en alternance - nouvelle fenêtre"}</span>
              </Link>
            </>
          }
        />
      </Box>
      <Select
        style={{ marginBottom: 0 }}
        state={jobLevelLabelError ? "error" : "default"}
        stateRelatedMessage={errors.job_level_label as string}
        label="Niveau de formation visé en fin de contrat"
        nativeSelectProps={{ name: "job_level_label", defaultValue: values.job_level_label || "", onChange: handleChange, "aria-invalid": jobLevelLabelError }}
      >
        <option value="" disabled hidden>
          Sélectionner une option
        </option>
        <option value={NIVEAU_DIPLOME_LABEL["3"]}>{NIVEAU_DIPLOME_LABEL["3"]}</option>
        <option value={NIVEAU_DIPLOME_LABEL["4"]}>{NIVEAU_DIPLOME_LABEL["4"]}</option>
        <option value={NIVEAU_DIPLOME_LABEL["5"]}>{NIVEAU_DIPLOME_LABEL["5"]}</option>
        <option value={NIVEAU_DIPLOME_LABEL["6"]}>{NIVEAU_DIPLOME_LABEL["6"]}</option>
        <option value={NIVEAU_DIPLOME_LABEL["7"]}>{NIVEAU_DIPLOME_LABEL["7"]}</option>
      </Select>
      <Box sx={{ mt: fr.spacing("6v"), width: "100%", maxWidth: { xs: "400px", sm: "100%" } }}>
        <Input
          label="Durée du contrat (mois)"
          hintText="Entre 6 et 36 mois, par exemple 12"
          state={errors.job_duration ? "error" : "default"}
          stateRelatedMessage={errors.job_duration as string}
          nativeInputProps={{
            name: "job_duration",
            value: values.job_duration ?? "",
            inputMode: "numeric",
            onChange: async (e) => (parseInt(e.target.value) > 0 ? setFieldValue("job_duration", parseInt(e.target.value)) : setFieldValue("job_duration", null)),
            "aria-invalid": Boolean(errors.job_duration),
          }}
        />
      </Box>
      <Box sx={{ mt: fr.spacing("6v") }}>
        <JobStartDateFields min={minStartDate.format(ISO_DATE_FORMAT)} max={maxStartDate.format(ISO_DATE_FORMAT)} />
      </Box>
      <FormControl sx={{ mt: fr.spacing("6v"), width: "100%", maxWidth: { xs: "400px", sm: "100%" } }}>
        <ChampNombre max={10} name="job_count" value={values.job_count} label="Nombre de poste(s) disponible(s)" handleChange={setFieldValue} dataTestId="offre-job-count" />
      </FormControl>

      {Boolean((user && user.type !== AUTHTYPE.ENTREPRISE) || (type && type !== AUTHTYPE.ENTREPRISE)) && (
        <Box sx={{ mt: fr.spacing("6v") }}>
          <TextInput
            label={
              <>
                Rythme de l’alternance école/entreprise <span style={{ color: "#666666" }}>(Facultatif)</span>
              </>
            }
            hintText="Ex: 1 semaine à l’école / 2 semaines en entreprise"
            name="job_rythm"
          />
        </Box>
      )}
    </>
  )
}

const TextInput = ({ name, label, hintText }: { name: string; label: React.ReactNode; hintText?: string }) => {
  const [input, meta] = useField(name)
  const { value, onChange, onBlur } = input
  const { touched, error } = meta
  const displayedErrorOpt = touched && error

  return (
    <FormControl error={Boolean(displayedErrorOpt)} fullWidth>
      <Input
        label={label}
        hintText={hintText}
        state={displayedErrorOpt ? "error" : "default"}
        stateRelatedMessage={displayedErrorOpt}
        nativeInputProps={{
          value,
          type: "text",
          name,
          onChange,
          onBlur,
          "aria-invalid": Boolean(displayedErrorOpt),
        }}
      />
    </FormControl>
  )
}
