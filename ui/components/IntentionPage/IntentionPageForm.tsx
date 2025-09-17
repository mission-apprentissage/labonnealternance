import { fr } from "@codegouvfr/react-dsfr"
import Button from "@codegouvfr/react-dsfr/Button"
import { Box, Checkbox, FormControlLabel, FormGroup, Stack, TextField, Typography } from "@mui/material"
import { Formik } from "formik"
import { ApplicationIntention, ApplicationIntentionDefaultText, RefusalReasons } from "shared/constants/application"
import * as Yup from "yup"

import { CustomFormControl } from "@/app/_components/CustomFormControl"
import CustomInput from "@/app/_components/CustomInput"
import { DsfrIcon } from "@/components/DsfrIcon"

export type IntentionPageFormValues = { email: string; phone: string; company_feedback: string; refusal_reasons: RefusalReasons[] }

export function IntentionPageForm({
  onCancel,
  onSubmit,
  email,
  phone,
  company_recruitment_intention,
}: {
  email: string
  phone: string
  onCancel: () => void
  onSubmit: (formValues: IntentionPageFormValues) => void
  company_recruitment_intention: ApplicationIntention
}) {
  const isRefusedState = company_recruitment_intention === ApplicationIntention.REFUS
  const placeholderTextArea = ApplicationIntentionDefaultText[company_recruitment_intention]

  return (
    <Formik
      initialValues={{ company_feedback: placeholderTextArea, email, phone, refusal_reasons: [] }}
      validationSchema={Yup.object().shape({
        company_feedback: Yup.string().nullable().required("Veuillez remplir le message"),
        email: isRefusedState ? Yup.string() : Yup.string().email("Adresse e-mail invalide").required("L'adresse e-mail est obligatoire"),
        phone: isRefusedState ? Yup.string() : Yup.string().matches(/^[0-9]{10}$/, "Le numéro de téléphone doit avoir exactement 10 chiffres"),
      })}
      onSubmit={(formikValues) => onSubmit(formikValues)}
    >
      {({ values, setFieldValue, handleChange, handleBlur, submitForm, isValid, isSubmitting }) => {
        return (
          <Box sx={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            <Box sx={{ pt: fr.spacing("3w") }} data-testid="fieldset-message">
              <CustomFormControl label="Modifiez votre message :" required name="company_feedback">
                <Typography sx={{ fontSize: "12px", lineHeight: "20px", color: "#666", marginTop: "4px" }}>Le candidat recevra le message suivant par courriel.</Typography>
                <TextField
                  id="company_feedback"
                  data-testid="company_feedback"
                  name="company_feedback"
                  placeholder={placeholderTextArea}
                  onBlur={handleBlur}
                  onChange={handleChange}
                  value={values.company_feedback}
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
                  <CustomInput data-testid="email" name="email" required={true} label="E-mail" type="email" value={values.email} />
                </Box>
                <Box data-testid="fieldset-phone" sx={{ flex: 1 }}>
                  <CustomInput data-testid="phone" name="phone" required={false} label="Téléphone" type="tel" value={values.phone} />
                </Box>
              </Box>
            )}
            {isRefusedState && (
              <CustomFormControl label="Précisez la ou les raison(s) de votre refus :" required={false} name="refusal_reasons">
                <Typography sx={{ fontSize: "12px", lineHeight: "20px", color: "#666666", marginTop: "8px" }}>Les motifs sélectionnés seront partagés au candidat</Typography>
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
                    {Object.values(RefusalReasons).map((reason) => (
                      <FormControlLabel
                        key={reason}
                        control={
                          <Checkbox
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

            <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
              <Box sx={{ display: "flex", flexDirection: { xs: "column", md: "row" }, gap: "24px" }}>
                <Button priority="secondary" aria-label="Annuler l’envoi de la réponse" type="button" onClick={onCancel} disabled={isSubmitting}>
                  <DsfrIcon name="fr-icon-arrow-go-back-line" size={16} />
                  Annuler les modifications
                </Button>
                <Button aria-label="Envoyer le message au candidat" type="submit" onClick={submitForm} disabled={!isValid || isSubmitting}>
                  <DsfrIcon name="fr-icon-mail-send-line" size={16} />
                  Envoyer le message
                </Button>
              </Box>
            </Box>
          </Box>
        )
      }}
    </Formik>
  )
}
