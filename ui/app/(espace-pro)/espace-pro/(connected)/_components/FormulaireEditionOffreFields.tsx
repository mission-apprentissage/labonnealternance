"use client"

import { Checkbox, CheckboxGroup, FormErrorMessage, Select } from "@chakra-ui/react"
import { fr } from "@codegouvfr/react-dsfr"
import Input from "@codegouvfr/react-dsfr/Input"
import { Box, FormControl, FormHelperText, FormLabel, Link, Typography } from "@mui/material"
import dayjs from "dayjs"
import { useFormikContext } from "formik"
import { useParams } from "next/navigation"
import { IAppellationsRomes } from "shared"
import { TRAINING_CONTRACT_TYPE, TRAINING_RYTHM } from "shared/constants/recruteur"

import { ChampNombre } from "@/app/(espace-pro)/espace-pro/(connected)/_components/ChampNombre"
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
          label="Métier"
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
        <Box mt={2}>
          <CustomInput
            required={false}
            name="offer_title_custom"
            label="Intitulé de l'offre si différent"
            info="Personnalisez le titre du poste (Facultatif)"
            type="text"
            value={values.offer_title_custom}
          />
        </Box>
      )}
      <FormControl sx={{ width: "100%", mt: 6 }} required={true}>
        <Box mb={1}>
          <FormLabel sx={{ display: "inline-block", mb: 0 }}>Type de contrat en alternance </FormLabel>
          <Link
            href="https://www.service-public.fr/professionnels-entreprises/vosdroits/F31704"
            target="_blank"
            rel="noreferrer noopener"
            aria-label="Accès au contrat en alternance - nouvelle fenêtre"
            className={fr.cx("fr-text--xs")}
          >
            En savoir plus
          </Link>
        </Box>
        <CheckboxGroup
          onChange={(value) => {
            setFieldValue("job_type", value)
          }}
          value={values.job_type}
          defaultValue={["Apprentissage"]}
          data-testid="offre-job-type"
        >
          {Object.values(TRAINING_CONTRACT_TYPE).map((label) => (
            <Checkbox
              key={label}
              value={label}
              sx={{
                ml: 5,
                mb: 3,
                "&:first": {
                  ml: 0,
                },
              }}
            >
              <span data-testid={label}>{label}</span>
            </Checkbox>
          ))}
        </CheckboxGroup>
      </FormControl>
      <FormControl sx={{ width: "100%", mt: 6 }} required={true}>
        <FormLabel>Niveau visé en fin d’études</FormLabel>
        <Select size="md" name="job_level_label" defaultValue={values.job_level_label} onChange={handleChange}>
          <option value="Indifférent">Indifférent</option>
          <option value="Cap, autres formations niveau (Infrabac)">Cap, autres formations niveau (Infrabac)</option>
          <option value="BP, Bac, autres formations niveau (Bac)">BP, Bac, autres formations niveau (Bac)</option>
          <option value="BTS, DEUST, autres formations niveau (Bac+2)">BTS, DEUST, autres formations niveau (Bac+2)</option>
          <option value="Licence, Maîtrise, autres formations niveaux 6 (Bac+3 à Bac+4)">Licence, Maîtrise, autres formations niveaux 6 (Bac+3 à Bac+4)</option>
          <option value="Master, titre ingénieur, autres formations niveau (Bac+5)">Master, titre ingénieur, autres formations niveau (Bac+5)</option>
        </Select>
        {errors.job_level_label && touched.job_level_label && <FormErrorMessage>{errors.job_level_label as string}</FormErrorMessage>}
      </FormControl>
      <Box mt={2}>
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
      <FormControl sx={{ mt: 6, maxWidth: { xs: "400px", lg: "450px" } }} required={true}>
        <ChampNombre max={10} name="job_count" value={values.job_count} label="Nombre de poste(s) disponible(s)" handleChange={setFieldValue} dataTestId="offre-job-count" />
      </FormControl>
      <FormControl sx={{ mt: 6, maxWidth: { xs: "400px", lg: "450px" } }} error={errors.job_duration ? true : false}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Typography sx={{ flexGrow: 2 }}>Durée du contrat (mois)</Typography>
          <Input
            label=""
            className={fr.cx("fr-fieldset__element--inline", "fr-fieldset__element--number")}
            nativeInputProps={{
              name: "job_duration",
              value: values.job_duration,
              onChange: (e) => (parseInt(e.target.value) > 0 ? setFieldValue("job_duration", parseInt(e.target.value)) : setFieldValue("job_duration", null)),
            }}
          />
        </Box>
        <FormErrorMessage>
          <Box sx={{ display: "flex", flexDirection: "row", alignItems: "center" }}>
            <Warning m={0} />
            <Box sx={{ display: "flex" }} ml={1}>
              {errors.job_duration as string}
            </Box>
          </Box>
        </FormErrorMessage>
      </FormControl>
      {Boolean((user && user.type !== AUTHTYPE.ENTREPRISE) || (type && type !== AUTHTYPE.ENTREPRISE)) && (
        <FormControl sx={{ mt: 6, width: "100%" }}>
          <FormLabel>Rythme de l'alternance (formation / entreprise)</FormLabel>
          <FormHelperText sx={{ pb: 2 }}>Facultatif</FormHelperText>
          <Select variant="outline" size="md" name="job_rythm" defaultValue={values.job_rythm} onChange={handleChange}>
            <option value="" hidden>
              Choisissez un rythme
            </option>
            {Object.values(TRAINING_RYTHM).map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </Select>
          {errors.job_rythm && touched.job_rythm && <FormErrorMessage>{errors.job_rythm as string}</FormErrorMessage>}
        </FormControl>
      )}
    </>
  )
}
