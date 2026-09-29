import { fr } from "@codegouvfr/react-dsfr"
import { Box, Checkbox, FormControlLabel, FormGroup, Stack, TextField, Typography } from "@mui/material"
import { FormikProvider, useFormik } from "formik"
import { useEffect, useRef } from "react"
import { zRoutes } from "shared"
import { ApplicationIntention, ApplicationIntentionDefaultText, RefusalReasons } from "shared/constants/application"
import { toFormikValidationSchema } from "zod-formik-adapter"
import { CustomFormControl, getCustomFormControlErrorId } from "@/app/_components/CustomFormControl"
import CustomInput from "@/app/_components/CustomInput"
import { createSubmitWithFocusOnError } from "@/app/_components/submit-with-focus-on-error"

export type IntentionPageFormValues = {
  email: string
  phone: string
  company_feedback: string
  refusal_reasons: RefusalReasons[]
}

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
    validationSchema: toFormikValidationSchema(schema),
    onSubmit,
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
    const parseResult = schema.safeParse(formValues ?? values)
    if (parseResult.success) return
    if (parseResult.error) {
      const errorObject: Record<string, string> = {}
      const { issues } = parseResult.error
      issues.forEach((issue) => {
        const fieldName = issue.path[0].toString()
        errorObject[fieldName] = issue.message ?? ""
      })
      return errorObject
    }
    return {}
  }

  return (
    <form id="intention-form" ref={formRef} noValidate onSubmit={createSubmitWithFocusOnError(formRef, formik)}>
      <FormikProvider value={formik}>
        <Box sx={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          <Box data-testid="fieldset-message">
            <Typography sx={{ fontSize: "12px", my: fr.spacing("6v"), color: "#666", marginTop: "4px" }}>
              Tous les champs sont obligatoires, sauf mention contraire “facultatif”.
            </Typography>
            <CustomFormControl label="Modifiez votre message :" required={false} name="company_feedback" fieldId="company_feedback">
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
                slotProps={{ htmlInput: { "aria-describedby": hasFeedbackError ? getCustomFormControlErrorId("company_feedback") : undefined } }}
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
                  info="10 chiffres, par exemple 0612345678. Votre numéro apparaîtra dans l’e-mail de réponse."
                  type="tel"
                  inputProps={{ inputMode: "numeric" }}
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
