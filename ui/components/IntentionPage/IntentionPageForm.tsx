import { Box, Checkbox, FormControlLabel, FormGroup, Stack, TextField } from "@mui/material"
import { FormikProvider, useFormik } from "formik"
import { useEffect, useRef } from "react"
import { zRoutes } from "shared"
import { ApplicationIntention, ApplicationIntentionDefaultText, RefusalReasons } from "shared/constants/application"
import { toFrenchNationalPhone } from "shared/validators/phone-validator"
import { CustomFormControl, getCustomFormControlErrorId } from "@/app/_components/CustomFormControl"
import CustomInput from "@/app/_components/CustomInput"
import { createSubmitWithFocusOnError } from "@/app/_components/submit-with-focus-on-error"
import { PHONE_FORMAT_ERROR, PHONE_FORMAT_HINT } from "@/utils/validation-messages"

export type IntentionPageFormValues = {
  email: string
  phone: string
  company_feedback: string
  refusal_reasons: RefusalReasons[]
}

// Le téléphone s'écrit librement (espaces, +33…) : l'API n'accepte que 10 chiffres, la validation et l'envoi portent sur la forme normalisée
const withNationalPhone = <T extends { phone?: string }>(formValues: T): T =>
  formValues.phone ? { ...formValues, phone: toFrenchNationalPhone(formValues.phone) ?? formValues.phone } : formValues

export function IntentionPageForm({
  onSubmit,
  email,
  company_recruitment_intention,
  onStateChange,
}: {
  email: string
  onSubmit: (formValues: IntentionPageFormValues) => void
  company_recruitment_intention: ApplicationIntention
  onStateChange?: (state: { isSubmitting: boolean }) => void
}) {
  const isRefusedState = company_recruitment_intention === ApplicationIntention.REFUS
  const placeholderTextArea = ApplicationIntentionDefaultText[company_recruitment_intention]
  const schema = zRoutes.post["/application/intentionComment/:id"].body

  const formik = useFormik({
    initialValues: { company_recruitment_intention, company_feedback: placeholderTextArea, email, phone: "", refusal_reasons: [] },
    // Formik transmet à onSubmit les valeurs saisies ; le champ affiche ensuite le numéro envoyé
    onSubmit: (formValues, { setFieldValue }) => {
      const submittedValues = withNationalPhone(formValues)
      setFieldValue("phone", submittedValues.phone, false)
      return onSubmit(submittedValues)
    },
    validate: validateForm,
  })

  const { values, setFieldValue, handleBlur, isSubmitting } = formik
  const formRef = useRef<HTMLFormElement>(null)
  const hasFeedbackError = Boolean(formik.touched.company_feedback && formik.errors.company_feedback)

  useEffect(() => {
    onStateChange?.({ isSubmitting })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSubmitting])

  function validateForm(formValues) {
    const currentValues = formValues ?? values
    const errorObject: Record<string, string> = {}
    schema.safeParse(withNationalPhone(currentValues)).error?.issues.forEach((issue) => {
      errorObject[issue.path[0].toString()] = issue.message ?? ""
    })
    // Contrôle de #5589 : un numéro surtaxé ou hors plan français a aussi 10 chiffres et passerait la regex de l'API
    if (currentValues.phone && toFrenchNationalPhone(currentValues.phone) === null) {
      errorObject.phone = PHONE_FORMAT_ERROR
    }
    return errorObject
  }

  return (
    <form id="intention-form" ref={formRef} noValidate onSubmit={createSubmitWithFocusOnError(formRef, formik)}>
      <FormikProvider value={formik}>
        <Box sx={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          <Box data-testid="fieldset-message">
            <CustomFormControl label="Modifiez votre message (obligatoire) :" required={false} name="company_feedback" fieldId="company_feedback">
              <TextField
                id="company_feedback"
                data-testid="company_feedback"
                name="company_feedback"
                placeholder={placeholderTextArea}
                onBlur={handleBlur}
                onChange={(event) => {
                  const value = event.target.value
                  // touched dès la saisie : une erreur apparue au blur décalerait « Envoyer maintenant » pendant le clic, qui serait perdu
                  formik.setFieldTouched("company_feedback", true, false)
                  formik.setFieldValue("company_feedback", value, true)
                }}
                value={values.company_feedback}
                error={hasFeedbackError}
                slotProps={{ htmlInput: { required: true, "aria-describedby": hasFeedbackError ? getCustomFormControlErrorId("company_feedback") : undefined } }}
                multiline={true}
                rows={10}
                fullWidth={true}
                sx={{
                  marginTop: "8px",
                  "& .MuiOutlinedInput-root": {
                    border: "none",
                    backgroundColor: "grey.200",
                    borderRadius: "4px 4px 0px 0px",
                    borderBottom: "2px solid",
                  },
                }}
              />
            </CustomFormControl>
          </Box>

          {!isRefusedState && (
            <Box sx={{ display: "flex", flexDirection: { xs: "column", md: "row" }, gap: "24px" }}>
              <Box data-testid="fieldset-email" sx={{ flex: 1 }}>
                <CustomInput
                  data-testid="email"
                  name="email"
                  required={false}
                  label="E-mail (facultatif)"
                  info="Format attendu : nom@domaine.fr. Vous serez en copie de la réponse envoyée."
                  type="email"
                  autoComplete="email"
                  value={values.email}
                />
              </Box>
              <Box data-testid="fieldset-phone" sx={{ flex: 1 }}>
                <CustomInput
                  data-testid="phone"
                  name="phone"
                  label="Téléphone (facultatif)"
                  info={`${PHONE_FORMAT_HINT}. Votre numéro apparaîtra dans l’e-mail de réponse.`}
                  type="tel"
                  autoComplete="tel-national"
                  required={false}
                />
              </Box>
            </Box>
          )}
          {isRefusedState && (
            <CustomFormControl
              label="Précisez la ou les raison(s) de votre refus (facultatif) :"
              required={false}
              name="refusal_reasons"
              group
              info="Les motifs sélectionnés seront partagés au candidat"
            >
              <FormGroup>
                <Stack
                  direction="column"
                  spacing={3}
                  sx={{
                    label: {
                      marginTop: "0 !important",
                      marginLeft: "-12px !important",
                    },
                  }}
                >
                  {Object.values(RefusalReasons).map((reason, index) => (
                    <FormControlLabel
                      key={reason}
                      htmlFor={`refusal_reasons-${index}`}
                      control={
                        <Checkbox
                          id={`refusal_reasons-${index}`}
                          name="refusal_reasons"
                          size="medium"
                          value={reason}
                          onChange={(event) => {
                            const currentValues = values.refusal_reasons || []
                            if (event.target.checked) {
                              setFieldValue("refusal_reasons", [...currentValues, reason])
                            } else {
                              setFieldValue(
                                "refusal_reasons",
                                currentValues.filter((v) => v !== reason)
                              )
                            }
                          }}
                        />
                      }
                      label={
                        <Box component="span" className="reason">
                          {reason}
                        </Box>
                      }
                    />
                  ))}
                </Stack>
              </FormGroup>
            </CustomFormControl>
          )}
        </Box>
      </FormikProvider>
    </form>
  )
}
