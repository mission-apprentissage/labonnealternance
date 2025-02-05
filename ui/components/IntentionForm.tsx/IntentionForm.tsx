import { Box, Button, Checkbox, CheckboxGroup, Flex, Stack, Text, Textarea } from "@chakra-ui/react"
import { Formik } from "formik"
import { useState } from "react"
import { useQuery } from "react-query"
import { ApplicationIntention, ApplicationIntentionDefaultText, RefusalReasons } from "shared/constants/application"
import * as Yup from "yup"

import { SuccessCircle } from "@/theme/components/icons"
import { getApplicationDataForIntention } from "@/utils/api"

import { apiPost } from "../../utils/api.utils"
import { CustomInput, LoadingEmptySpace } from "../espace_pro"
import { CustomFormControl } from "../espace_pro/CustomFormControl"

import { IntensionFormNavigation } from "./IntensionFormNavigation"
import { IntensionFormResult } from "./IntentionFormResult"

const textAreaProperties = {
  border: "none",
  background: "grey.200",
  borderRadius: "4px 4px 0px 0px",
  width: "100%",
  height: "250px",
  paddingLeft: 4,
  borderBottom: "2px solid",
}

const getText = ({
  applicant_first_name,
  applicant_last_name,
  company_recruitment_intention,
}: {
  applicant_first_name: string
  applicant_last_name: string
  company_recruitment_intention: ApplicationIntention
}): { placeholderTextArea: string; header: React.ReactNode; confirmation: string } => {
  switch (company_recruitment_intention) {
    case ApplicationIntention.ENTRETIEN:
      return {
        header: (
          <>
            <Text fontWeight={700} fontSize="16px" pt={8}>
              Personnalisez votre réponse pour apporter à {`${applicant_first_name}`} un message qui lui correspond vraiment.
            </Text>
          </>
        ),
        placeholderTextArea: ApplicationIntentionDefaultText.ENTRETIEN,
        confirmation: `Votre réponse a été enregistrée et sera automatiquement envoyée à ${applicant_first_name} ${applicant_last_name}.`,
      }
    case ApplicationIntention.REFUS:
      return {
        header: (
          <>
            <Text pt={8} fontWeight={700}>
              Personnalisez votre réponse afin d’aider {applicant_first_name} à s’améliorer pour ses prochaines candidatures.
            </Text>
          </>
        ),
        placeholderTextArea: ApplicationIntentionDefaultText.REFUS,
        confirmation: `Votre refus a été enregistré et sera automatiquement envoyé à ${applicant_first_name} ${applicant_last_name}.`,
      }
    default:
      return null
  }
}

export const IntentionForm = ({ company_recruitment_intention, id, token }: { company_recruitment_intention: ApplicationIntention; id: string; token: string | undefined }) => {
  const { data, error } = useQuery("getApplicationDataForIntention", () => getApplicationDataForIntention(id, company_recruitment_intention, token), {
    retry: false,
    onError: (error: { message: string }) => console.log(`Something went wrong: ${error.message}`),
  })

  const [sendingState, setSendingState] = useState<"not_sent" | "ok_sent" | "not_sent_because_of_errors" | "canceled">("not_sent")

  const isRefusedState = company_recruitment_intention === ApplicationIntention.REFUS

  const submitForm = async ({ email, phone, company_feedback, refusal_reasons }: { email: string; phone: string; company_feedback: string; refusal_reasons: RefusalReasons[] }) => {
    apiPost("/application/intentionComment/:id", {
      params: { id },
      body: {
        phone,
        email,
        company_feedback,
        company_recruitment_intention,
        refusal_reasons,
      },
      headers: {
        authorization: `Bearer ${token}`,
      },
    })
      .then(() => setSendingState("ok_sent"))
      .catch(() => setSendingState("not_sent_because_of_errors"))
  }

  const cancelForm = async () => {
    apiPost("/application/intention/cancel/:id", {
      params: { id },
      headers: {
        authorization: `Bearer ${token}`,
      },
    })
      .then(() => setSendingState("canceled"))
      .catch(() => setSendingState("not_sent_because_of_errors"))
  }

  if (!data && !error) {
    return (
      <Box>
        <IntensionFormNavigation />
        <LoadingEmptySpace />
      </Box>
    )
  }

  if (error) {
    return (
      <Box>
        <IntensionFormNavigation />
        <Flex width="80%" maxWidth="800px" margin="auto" pt={20}>
          <Box fontSize="20px" margin="auto">
            {error.message}
          </Box>
        </Flex>
      </Box>
    )
  }

  const text = getText({ applicant_first_name: data.applicant_first_name, applicant_last_name: data.applicant_last_name, company_recruitment_intention })

  return (
    <Box>
      <IntensionFormNavigation />
      {!["ok_sent", "canceled"].includes(sendingState) && (
        <Flex direction="column" width="80%" maxWidth="992px" margin="auto" pt={12} alignItems="center" data-testid="IntentionFormSuccess">
          <Box p={4} backgroundColor="#E1FEE8" fontWeight={700} color="#18753C" width="100%" maxWidth="800px">
            <SuccessCircle width="20px" fillHexaColor="#18753C" mr={2} />
            {text.confirmation}
          </Box>

          <Box width="100%" maxWidth="800px" mb={4}>
            {text.header}
          </Box>
          <Box width="100%" maxWidth="800px">
            <Formik
              initialValues={{ company_feedback: text.placeholderTextArea, email: data.recruiter_email ?? "", phone: data.recruiter_phone ?? "", refusal_reasons: [] }}
              validationSchema={Yup.object().shape({
                company_feedback: Yup.string().nullable().required("Veuillez remplir le message"),
                email: isRefusedState ? Yup.string() : Yup.string().email("Adresse e-mail invalide").required("L'adresse e-mail est obligatoire"),
                phone: isRefusedState ? Yup.string() : Yup.string().matches(/^[0-9]{10}$/, "Le numéro de téléphone doit avoir exactement 10 chiffres"),
              })}
              onSubmit={(formikValues) => submitForm(formikValues)}
            >
              {({ values, setFieldValue, handleChange, handleBlur, submitForm, isValid, isSubmitting }) => {
                return (
                  <>
                    <Box pt={2} data-testid="fieldset-message">
                      <CustomFormControl label="Votre réponse :" required name="company_feedback">
                        <Text fontSize="12px" color="#666" mb={4}>
                          Le candidat recevra le message suivant {company_recruitment_intention === ApplicationIntention.ENTRETIEN && "ainsi que vos coordonnées "}par courriel.
                        </Text>
                        <Textarea
                          id="company_feedback"
                          data-testid="company_feedback"
                          name="company_feedback"
                          placeholder={text.placeholderTextArea}
                          onBlur={handleBlur}
                          onChange={handleChange}
                          value={values.company_feedback}
                          {...textAreaProperties}
                        />
                      </CustomFormControl>
                    </Box>

                    {!isRefusedState && (
                      <>
                        <Text mt={6} mb={4}>
                          Indiquez au candidat <strong>vos coordonnées</strong>, afin qu'il puisse vous recontacter.
                        </Text>
                        <Flex direction={{ base: "column", md: "row" }} gap={8}>
                          <Box data-testid="fieldset-email" flex={1}>
                            <CustomInput data-testid="email" name="email" required={true} label="E-mail" type="email" value={values.email} />
                          </Box>
                          <Box data-testid="fieldset-phone" flex={1}>
                            <CustomInput data-testid="phone" name="phone" required={false} label="Téléphone" type="tel" value={values.phone} />
                          </Box>
                        </Flex>
                      </>
                    )}
                    {isRefusedState && (
                      <Box pt={2} data-testid="fieldset-message">
                        <CustomFormControl label="Précisez la ou les raison(s) de votre refus :" required={false} name="refusal_reasons">
                          <CheckboxGroup
                            onChange={(value) => {
                              console.log("value : ", value)
                              setFieldValue("refusal_reasons", value)
                            }}
                          >
                            <Stack direction="column" spacing={3} mt={1} ml={1}>
                              {Object.values(RefusalReasons).map((key) => (
                                <Checkbox key={key} size="lg" value={key}>
                                  {key}
                                </Checkbox>
                              ))}
                            </Stack>
                          </CheckboxGroup>
                        </CustomFormControl>
                      </Box>
                    )}

                    {sendingState === "not_sent_because_of_errors" ? (
                      <Box mt={8} mb={8} fontWeight={700}>
                        <Box mb={2} lineHeight="20px" fontSize="12px" color="#e10600">
                          Une erreur technique s'est produite
                        </Box>
                      </Box>
                    ) : (
                      <Flex direction={{ base: "column-reverse", md: "row-reverse" }} mb={8}>
                        <Button
                          mt={4}
                          variant="form"
                          aria-label="Envoyer le message au candidat"
                          type="submit"
                          onClick={submitForm}
                          disabled={!isValid || isSubmitting}
                          isActive={isValid}
                          isLoading={isSubmitting}
                        >
                          Envoyer le message
                        </Button>

                        <Button
                          mt={4}
                          mr={{ base: 0, md: 4 }}
                          variant="cancelForm"
                          aria-label="Annuler l’envoi de la réponse"
                          type="button"
                          onClick={cancelForm}
                          disabled={isSubmitting}
                          isLoading={isSubmitting}
                        >
                          Annuler l'envoi de la réponse
                        </Button>
                      </Flex>
                    )}
                  </>
                )
              }}
            </Formik>
          </Box>
        </Flex>
      )}
      {sendingState === "ok_sent" && <IntensionFormResult intention={company_recruitment_intention} />}
      {sendingState === "canceled" && <IntensionFormResult intention={company_recruitment_intention} canceled={true} />}
    </Box>
  )
}
