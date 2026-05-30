"use client"

import { fr } from "@codegouvfr/react-dsfr"
import Checkbox from "@codegouvfr/react-dsfr/Checkbox"
import Input from "@codegouvfr/react-dsfr/Input"
import Select from "@codegouvfr/react-dsfr/Select"
import { Box, FormControl, FormLabel, Link } from "@mui/material"
import dayjs from "dayjs"
import { useFormikContext } from "formik"
import { useParams } from "next/navigation"
import type { IAppellationsRomes } from "shared"
import { TRAINING_CONTRACT_TYPE, TRAINING_RYTHM } from "shared/constants/recruteur"
import { AUTHTYPE } from "@/common/contants"
import { debounce } from "@/common/utils/debounce"
import { DropdownCombobox } from "@/components/espace_pro"
import { useAuth } from "@/context/UserContext"
import { apiGet } from "@/utils/api.utils"
import { ChampNombre } from "./ChampNombre"

const ISO_DATE_FORMAT = "YYYY-MM-DD"

export const FormulaireEditionOffreFields = ({ onRomeChange, section }: { onRomeChange?: (rome: string, appellation: string) => void; section: "contract" | "offer" }) => {
  const { user } = useAuth()

  const { type } = useParams() as { establishment_id: string; email: string; userId: string; type: string; token: string }

  const handleJobSearch = async (search: string) => {
    if (search.trim().length !== 0) {
      try {
        const result = (await apiGet(`/v1/metiers/intitule`, { querystring: { label: search } })) as IAppellationsRomes
        return result.coupleAppellationRomeMetier
      } catch (error: any) {
        throw new Error(error)
      }
    }
    return []
  }

  const minStartDate = dayjs().startOf("day")
  const maxStartDate = dayjs().add(2, "years")

  const { values, setFieldValue, setValues, handleChange, errors, touched } = useFormikContext<any>()

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
            placeholder="Rechercher un métier.."
            dataTestId="offre-metier"
          />
        </FormControl>
        {values.rome_label && (
          <Box sx={{ mt: fr.spacing("4v") }}>
            <Input
              label="Intitulé de l'offre si différent (Facultatif)"
              hintText="Personnalisez le titre du poste."
              nativeInputProps={{
                value: values.offer_title_custom,
                type: "text",
                name: "offer_title_custom",
                onChange: async (e) => setFieldValue("offer_title_custom", e.target.value),
              }}
            />
          </Box>
        )}
      </>
    )
  }

  return (
    <>
      <Box sx={{ mt: fr.spacing("4v") }}>
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
              <Link
                href="https://www.service-public.fr/professionnels-entreprises/vosdroits/F31704"
                target="_blank"
                rel="noreferrer noopener"
                aria-label="Accès au contrat en alternance - nouvelle fenêtre"
              >
                En savoir plus
              </Link>
            </>
          }
        />
      </Box>
      <Select
        state={errors.job_level_label && touched.job_level_label ? "error" : "default"}
        stateRelatedMessage={errors.job_level_label as string}
        label="Niveau visé en fin d'études"
        nativeSelectProps={{ name: "job_level_label", defaultValue: values.job_level_label, onChange: handleChange }}
      >
        <option value="Indifférent">Indifférent</option>
        <option value="Cap, autres formations (Infrabac)">Cap, autres formations (Infrabac)</option>
        <option value="BP, Bac, autres formations (Bac)">BP, Bac, autres formations (Bac)</option>
        <option value="BTS, DEUST, autres formations (Bac+2)">BTS, DEUST, autres formations (Bac+2)</option>
        <option value="Licence, Maîtrise, autres formations (Bac+3 à Bac+4)">Licence, Maîtrise, autres formations (Bac+3 à Bac+4)</option>
        <option value="Master, titre ingénieur, autres formations (Bac+5)">Master, titre ingénieur, autres formations (Bac+5)</option>
      </Select>
      <Box sx={{ mt: fr.spacing("4v") }}>
        <Input
          label="Date de début"
          state={errors.job_start_date && touched.job_start_date ? "error" : "default"}
          stateRelatedMessage={errors.job_start_date as string}
          nativeInputProps={{
            type: "date",
            min: minStartDate.format(ISO_DATE_FORMAT),
            max: maxStartDate.format(ISO_DATE_FORMAT),
            name: "job_start_date",
            value: values.job_start_date,
            onChange: handleChange,
          }}
        />
      </Box>
      <FormControl sx={{ mt: 2, width: "100%", maxWidth: { xs: "400px", sm: "100%" } }}>
        <ChampNombre max={10} name="job_count" value={values.job_count} label="Nombre de poste(s) disponible(s)" handleChange={setFieldValue} dataTestId="offre-job-count" />
      </FormControl>
      <FormControl sx={{ mt: 2, width: "100%", maxWidth: { xs: "400px", sm: "100%" } }} error={errors.job_duration ? true : false}>
        <FormLabel sx={{ mb: fr.spacing("2v") }}>Durée du contrat (mois)</FormLabel>
        <Input
          label=""
          state={errors.job_duration ? "error" : "default"}
          stateRelatedMessage={errors.job_duration as string}
          nativeInputProps={{
            name: "job_duration",
            value: values.job_duration,
            onChange: async (e) => (parseInt(e.target.value) > 0 ? setFieldValue("job_duration", parseInt(e.target.value)) : setFieldValue("job_duration", null)),
          }}
        />
      </FormControl>
      {Boolean((user && user.type !== AUTHTYPE.ENTREPRISE) || (type && type !== AUTHTYPE.ENTREPRISE)) && (
        <FormControl sx={{ mt: 2, width: "100%" }}>
          <Select
            state={errors.job_rythm && touched.job_rythm ? "error" : "default"}
            stateRelatedMessage={errors.job_rythm as string}
            label="Rythme de l’alternance école/entreprise (Facultatif)"
            nativeSelectProps={{ name: "job_rythm", defaultValue: values.job_rythm, onChange: handleChange }}
          >
            <option value="" hidden>
              Choisissez un rythme
            </option>
            {Object.values(TRAINING_RYTHM).map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </Select>
        </FormControl>
      )}
    </>
  )
}
