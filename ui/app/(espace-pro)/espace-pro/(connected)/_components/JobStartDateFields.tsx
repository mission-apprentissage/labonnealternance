"use client"

import { fr } from "@codegouvfr/react-dsfr"
import Checkbox from "@codegouvfr/react-dsfr/Checkbox"
import Input from "@codegouvfr/react-dsfr/Input"
import RadioButtons from "@codegouvfr/react-dsfr/RadioButtons"
import { Box } from "@mui/material"
import { useField, useFormikContext } from "formik"
import dayjs from "shared/helpers/dayjs"
import { JOB_START_TYPE } from "shared/models/job.model"

const ISO_DATE_FORMAT = "YYYY-MM-DD"
const FR_DATE_FORMAT = "DD/MM/YYYY"

/**
 * Type de démarrage, date de début et « Date flexible », communs à l'étape 1 du dépôt d'offre et à la
 * modale de prolongation. `min` et `max` sont au format ISO (YYYY-MM-DD).
 */
export const JobStartDateFields = ({ min, max }: { min: string; max: string }) => {
  const { values, setFieldValue } = useFormikContext<any>()

  return (
    <>
      <RadioInput
        label="Date de début de contrat souhaitée"
        name="job_start_type"
        options={[
          {
            value: JOB_START_TYPE.DES_QUE_POSSIBLE,
            label: "Démarrer dès que possible",
            hintText: "Votre offre indiquera la mention “recrutement urgent”",
          },
          {
            value: JOB_START_TYPE.PRECISE_DATE,
            label: "Indiquer une date",
          },
        ]}
        onChange={async ({ value }) => {
          if (value === JOB_START_TYPE.DES_QUE_POSSIBLE) {
            await setFieldValue("job_start_date", dayjs().format(ISO_DATE_FORMAT))
            await setFieldValue("job_start_date_flexible", false, true)
          }
        }}
      />
      {Boolean(values.job_start_type) && (
        <Box sx={{ ml: "32px" }}>
          <DateInput
            disabled={values.job_start_type === JOB_START_TYPE.DES_QUE_POSSIBLE}
            min={min}
            max={max}
            name="job_start_date"
            label="Date de début du contrat"
            hintText={`Format attendu : JJ/MM/AAAA, entre le ${dayjs(min).format(FR_DATE_FORMAT)} et le ${dayjs(max).format(FR_DATE_FORMAT)}`}
          />
          {values.job_start_type === JOB_START_TYPE.PRECISE_DATE && (
            <Box sx={{ mt: fr.spacing("3v") }}>
              <Checkbox
                options={[
                  {
                    label: "Date flexible",
                    nativeInputProps: {
                      name: "job_start_date_flexible",
                      checked: values.job_start_date_flexible,
                      onChange: (e) => setFieldValue("job_start_date_flexible", e.target.checked),
                    },
                  },
                ]}
              />
            </Box>
          )}
        </Box>
      )}
    </>
  )
}

const RadioInput = <T extends { label: string; value: any; hintText?: string }>({
  name,
  options,
  label,
  onChange,
}: {
  name: string
  options: T[]
  label: string
  onChange?: (item: T) => void
}) => {
  const [input, meta, helper] = useField(name)
  const { value } = input
  const { touched, error } = meta
  const displayedErrorOpt = touched && error

  return (
    <RadioButtons
      style={{
        marginBottom: 0,
      }}
      name={name}
      legend={label}
      options={options.map((option) => ({
        label: option.label,
        hintText: option.hintText,
        nativeInputProps: {
          checked: value === option.value,
          onChange: () => {
            helper.setValue(option.value, true)
            onChange?.(option)
          },
        },
      }))}
      state={displayedErrorOpt ? "error" : "default"}
      stateRelatedMessage={displayedErrorOpt ? `${error}` : undefined}
    />
  )
}

const DateInput = ({ name, label, hintText, disabled, min, max }: { name: string; label: string; hintText: string; disabled?: boolean; min: string; max: string }) => {
  const [input, meta] = useField(name)
  const { value, onChange, onBlur } = input
  const { touched, error } = meta
  const displayedErrorOpt = touched && error

  return (
    <Input
      disabled={disabled}
      label={label}
      hintText={hintText}
      state={displayedErrorOpt ? "error" : "default"}
      stateRelatedMessage={displayedErrorOpt}
      nativeInputProps={{
        type: "date",
        min,
        max,
        name,
        value,
        onChange,
        onBlur,
        // aria-invalid : cf. HandiEngagementSelect
        "aria-invalid": Boolean(displayedErrorOpt),
      }}
    />
  )
}
