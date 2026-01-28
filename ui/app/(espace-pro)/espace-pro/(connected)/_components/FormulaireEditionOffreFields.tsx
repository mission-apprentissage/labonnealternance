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

import { ChampNombre } from "./ChampNombre"
import CustomInput from "@/app/_components/CustomInput"
import { AUTHTYPE } from "@/common/contants"
import { debounce } from "@/common/utils/debounce"
import { DropdownCombobox } from "@/components/espace_pro"
import { useAuth } from "@/context/UserContext"
import { Warning } from "@/theme/components/icons"
import { apiGet } from "@/utils/api.utils"

const ISO_DATE_FORMAT = "YYYY-MM-DD"

export const FormulaireEditionOffreFields = ({ onRomeChange }: { onRomeChange: (rome: string, appellation: string) => void }) => {
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

  const { values, setFieldValue, handleChange, errors, touched } = useFormikContext<any>()
  return (
    <>
      <FormControl required={true} sx={{ width: "100%" }}>
        <DropdownCombobox
          label="Métier *"
          handleSearch={debounce(handleJobSearch, 300)}
          saveSelectedItem={(values: IAppellationsRomes["coupleAppellationRomeMetier"][number]) => {
            /**
             * validator broken when using setFieldValue : https://github.com/formium/formik/issues/2266
             * work around until v3 : setTimeout
             */
            setTimeout(async () => {
              setFieldValue("rome_label", values.intitule)
              setFieldValue("rome_appellation_label", values.appellation)
              setFieldValue("rome_code", [values.code_rome])
              onRomeChange(values.code_rome, values.appellation)
            }, 0)
          }}
          name="rome_label"
          value={values.rome_appellation_label}
          placeholder="Rechercher un métier.."
          dataTestId="offre-metier"
        />
      </FormControl>
      {values.rome_label && (
        <Box
          sx={{
            mt: 2,
          }}
        >
          <Input
            label="Intitulé de l'offre"
            hintText="Personnalisez le titre du poste (Facultatif)"
            nativeInputProps={{
              value: values.offer_title_custom,
              type: "text",
              name: "offer_title_custom",
              onChange: async (e) => setFieldValue("offer_title_custom", e.target.value),
            }}
          />
        </Box>
      )}
      <Box
        sx={{
          mt: 2,
        }}
      >
        <Checkbox
          orientation="horizontal"
          state={values.job_type.length === 0 ? "error" : "default"}
          small={true}
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
              <FormLabel sx={{ ...(values.job_type.length === 0 ? { color: fr.colors.decisions.text.default.error.default } : {}), display: "inline-block", mb: 0, mr: 1 }}>
                Type de contrat en alternance *
              </FormLabel>
              <Link
                href="https://www.service-public.fr/professionnels-entreprises/vosdroits/F31704"
                target="_blank"
                rel="noreferrer noopener"
                aria-label="Accès au contrat en alternance - nouvelle fenêtre"
                className={fr.cx("fr-text--xs")}
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
        label="Niveau visé en fin d’études *"
        nativeSelectProps={{ name: "job_level_label", defaultValue: values.job_level_label, onChange: handleChange }}
      >
        <option value="Indifférent">Indifférent</option>
        <option value="Cap, autres formations (Infrabac)">Cap, autres formations (Infrabac)</option>
        <option value="BP, Bac, autres formations (Bac)">BP, Bac, autres formations (Bac)</option>
        <option value="BTS, DEUST, autres formations (Bac+2)">BTS, DEUST, autres formations (Bac+2)</option>
        <option value="Licence, Maîtrise, autres formations (Bac+3 à Bac+4)">Licence, Maîtrise, autres formations (Bac+3 à Bac+4)</option>
        <option value="Master, titre ingénieur, autres formations (Bac+5)">Master, titre ingénieur, autres formations (Bac+5)</option>
      </Select>
      <Box
        sx={{
          mt: 2,
        }}
      >
        <CustomInput
          required={true}
          name="job_start_date"
          label="Date de début"
          type="date"
          value={values.job_start_date}
          min={minStartDate.format(ISO_DATE_FORMAT)}
          max={maxStartDate.format(ISO_DATE_FORMAT)}
        />
      </Box>
      <FormControl sx={{ mt: 2, width: "100%", maxWidth: { xs: "400px", sm: "100%" } }} required={true}>
        <ChampNombre max={10} name="job_count" value={values.job_count} label="Nombre de poste(s) disponible(s)" handleChange={setFieldValue} dataTestId="offre-job-count" />
      </FormControl>
      <FormControl sx={{ mt: 2, width: "100%", maxWidth: { xs: "400px", sm: "100%" } }} error={errors.job_duration ? true : false}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <FormLabel sx={{ flexGrow: 2 }}>Durée du contrat (mois) *</FormLabel>
          <Input
            label=""
            className={fr.cx("fr-fieldset__element--inline", "fr-fieldset__element--number")}
            nativeInputProps={{
              name: "job_duration",
              value: values.job_duration,
              onChange: async (e) => (parseInt(e.target.value) > 0 ? setFieldValue("job_duration", parseInt(e.target.value)) : setFieldValue("job_duration", null)),
            }}
          />
        </Box>
        {errors.job_duration && (
          <Box sx={{ color: fr.colors.decisions.text.default.error.default, display: "flex", flexDirection: "row", alignItems: "center" }}>
            <Warning sx={{ m: 0 }} />
            <Box
              sx={{
                ml: 1,
                display: "flex",
              }}
            >
              {errors.job_duration as string}
            </Box>
          </Box>
        )}
      </FormControl>
      {Boolean((user && user.type !== AUTHTYPE.ENTREPRISE) || (type && type !== AUTHTYPE.ENTREPRISE)) && (
        <FormControl sx={{ mt: 2, width: "100%" }}>
          <Select
            state={errors.job_rythm && touched.job_rythm ? "error" : "default"}
            stateRelatedMessage={errors.job_rythm as string}
            label="Rythme de l'alternance (formation / entreprise)"
            nativeSelectProps={{ name: "job_rythm", defaultValue: values.job_rythm, onChange: handleChange }}
            hint="Facultatif"
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
