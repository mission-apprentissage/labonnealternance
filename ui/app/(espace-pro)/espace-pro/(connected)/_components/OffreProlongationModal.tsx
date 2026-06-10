import { fr } from "@codegouvfr/react-dsfr"
import Button from "@codegouvfr/react-dsfr/Button"
import Checkbox from "@codegouvfr/react-dsfr/Checkbox"
import Input from "@codegouvfr/react-dsfr/Input"
import RadioButtons from "@codegouvfr/react-dsfr/RadioButtons"
import { Typography } from "@mui/material"
import Box from "@mui/material/Box"
import FormControl from "@mui/material/FormControl"
import { Formik, useField } from "formik"
import { JOB_START_TYPE } from "shared"
import dayjs from "shared/helpers/dayjs"
import * as Yup from "yup"
import type { useDisclosure } from "@/common/hooks/useDisclosure"
import { ModalReadOnly } from "@/components/ModalReadOnly"

const ISO_DATE_FORMAT = "YYYY-MM-DD"
const FR_DATE_FORMAT = "DD/MM/YYYY"

export const OffreProlongationModal = ({
  modalControls,
  onOffreProlongationSubmit,
}: {
  modalControls: ReturnType<typeof useDisclosure>
  onOffreProlongationSubmit: (props: { job_start_type: JOB_START_TYPE; job_start_date_flexible: boolean; job_start_date: string }) => void
}) => {
  const { isOpen, onClose } = modalControls

  const minStartDate = dayjs().startOf("day")
  const maxStartDate = dayjs().add(2, "years")

  const jobStartDateYup = Yup.date()
    .min(minStartDate.toDate(), `La date de début doit être à partir du ${minStartDate.format(FR_DATE_FORMAT)}`)
    .max(maxStartDate.toDate(), `La date de début doit être avant le ${maxStartDate.format(FR_DATE_FORMAT)}`)
    .required("Champ obligatoire")

  return (
    <ModalReadOnly size="xl" isOpen={isOpen} onClose={onClose}>
      <Box
        sx={{
          pt: fr.spacing("8v"),
          maxWidth: "588px",
        }}
      >
        <Formik
          validateOnMount
          enableReinitialize={true}
          initialValues={{}}
          validationSchema={Yup.object().shape({
            job_start_type: Yup.mixed<JOB_START_TYPE>().oneOf([JOB_START_TYPE.DES_QUE_POSSIBLE, JOB_START_TYPE.PRECISE_DATE], "Champ obligatoire").required("Champ obligatoire"),
            job_start_date_flexible: Yup.boolean().default(false),
            job_start_date: jobStartDateYup,
          })}
          onSubmit={(values: any) => {
            onOffreProlongationSubmit(values)
          }}
        >
          {({ values, setFieldValue, dirty, isValid, submitForm }) => {
            return (
              <>
                <Box sx={{ px: fr.spacing("8v") }}>
                  <Typography
                    component="h1"
                    sx={{
                      fontSize: "24px",
                      lineHeight: "32px",
                      fontWeight: 700,
                      color: "#161616",
                    }}
                  >
                    Prolongez votre offre
                  </Typography>
                  <Typography
                    sx={{
                      my: fr.spacing("4v"),
                      fontSize: "16px",
                      lineHeight: "24px",
                      color: "#3A3A3A",
                    }}
                  >
                    Pour que votre offre reste valide, certaines informations nécessitent une mise à jour :
                  </Typography>
                  <Box sx={{ mt: fr.spacing("6v") }}>
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
                  </Box>
                  {Boolean(values.job_start_type) && (
                    <Box sx={{ ml: "32px" }}>
                      <DateInput
                        disabled={values.job_start_type === JOB_START_TYPE.DES_QUE_POSSIBLE}
                        min={minStartDate.format(ISO_DATE_FORMAT)}
                        max={maxStartDate.format(ISO_DATE_FORMAT)}
                        name="job_start_date"
                        label="Date"
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
                </Box>
                <Box
                  sx={(theme) => ({
                    display: "flex",
                    justifyContent: "flex-end",
                    padding: fr.spacing("8v"),
                    mt: fr.spacing("12v"),
                    gap: fr.spacing("4v"),
                    borderTop: "solid 1px #DDDDDD",
                    [theme.breakpoints.down("md")]: {
                      flexDirection: "column",
                      button: {
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        width: "100%",
                        padding: fr.spacing("4v"),
                      },
                    },
                  })}
                >
                  <Button priority="secondary" onClick={modalControls.onClose}>
                    Annuler
                  </Button>
                  <Button priority="primary" type="submit" disabled={!dirty || !isValid} onClick={submitForm}>
                    Prolonger mon offre
                  </Button>
                </Box>
              </>
            )
          }}
        </Formik>
      </Box>
    </ModalReadOnly>
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

const DateInput = ({ name, label, disabled, min, max }: { name: string; label: string; disabled?: boolean; min?: string; max?: string }) => {
  const [input, meta] = useField(name)
  const { value, onChange, onBlur } = input
  const { touched, error } = meta
  const displayedErrorOpt = touched && error

  return (
    <FormControl error={Boolean(displayedErrorOpt)} fullWidth>
      <Input
        disabled={disabled}
        label={label}
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
        }}
      />
    </FormControl>
  )
}
