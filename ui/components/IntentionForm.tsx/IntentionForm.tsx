import { Box, Button, Flex, Text, Textarea } from "@chakra-ui/react"
import { Formik } from "formik"
import { useState } from "react"
import { useQuery } from "react-query"
import { ApplicantIntention } from "shared/constants/application"
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
  height: "110px",
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
  company_recruitment_intention: ApplicantIntention
}): { placeholderTextArea: string; header: React.ReactNode; confirmation: string } => {
  switch (company_recruitment_intention) {
    case ApplicantIntention.ENTRETIEN:
      return {
        header: (
          <>
            <Text fontWeight={700} fontSize="16px" pt={8}>
              Personnalisez votre réponse pour apporter à {`${applicant_first_name}`} un message qui lui correspond vraiment.
            </Text>
          </>
        ),
        placeholderTextArea:
          "Bonjour, Merci pour l'intérêt que vous portez à notre établissement. Votre candidature a retenu toute notre attention et nous souhaitons échanger avec vous. Pouvez-vous me recontacter au numéro de téléphone ou via l'email ci-dessous afin que nous puissions convenir d'un rendez-vous ?",
        confirmation: `Votre réponse a été enregistrée et sera automatiquement envoyée à ${applicant_first_name} ${applicant_last_name}.`,
      }
    case ApplicantIntention.REFUS:
      return {
        header: (
          <>
            <Text pt={8} fontWeight={700}>
              Personnalisez votre réponse afin d’aider {applicant_first_name} à s’améliorer pour ses prochaines candidatures.
            </Text>
          </>
        ),
        placeholderTextArea:
          "Bonjour, Merci pour l'intérêt que vous portez à notre établissement. Nous avons étudié votre candidature avec attention. Nous ne sommes malheureusement pas en mesure de donner lui une suite favorable. Nous vous souhaitons bonne chance dans vos recherches. Bonne continuation",
        confirmation: `Votre refus a été enregistré et sera automatiquement envoyé à ${applicant_first_name} ${applicant_last_name}.`,
      }
    default:
      return null
  }
}

export const IntentionForm = ({ company_recruitment_intention, id, token }: { company_recruitment_intention: ApplicantIntention; id: string; token: string | undefined }) => {
  const { data, error } = useQuery("getApplicationDataForIntention", () => getApplicationDataForIntention(id, token), {
    retry: false,
    onError: (error: { message: string }) => console.log(`Something went wrong: ${error.message}`),
  })

  const [sendingState, setSendingState] = useState<"not_sent" | "ok_sent" | "not_sent_because_of_errors" | "canceled">("not_sent")

  const isRefusedState = company_recruitment_intention === ApplicantIntention.REFUS

  const submitForm = async ({ email, phone, company_feedback }: { email: string; phone: string; company_feedback: string }) => {
    apiPost("/application/intentionComment/:id", {
      params: { id },
      body: {
        phone,
        email,
        company_feedback,
        company_recruitment_intention,
      },
      headers: {
        authorization: `Bearer ${token}`,
      },
    })
      .then(() => setSendingState("ok_sent"))
      .catch(() => setSendingState("not_sent_because_of_errors"))
  }

  const cancelForm = async () => {
    console.log("CANCEL !!!!")
    setSendingState("canceled")
    // apiPost("/application/cancelComment/:id", {
    //   params: { id },
    //   headers: {
    //     authorization: `Bearer ${token}`,
    //   },
    // })
    //   .then(() => setSendingState("canceled"))
    //   .catch(() => setSendingState("not_sent_because_of_errors"))
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
        <Flex direction="column" width="80%" maxWidth="992px" margin="auto" pt={12} alignItems="center" data-testid="SatisfactionFormSuccess">
          <Box p={4} backgroundColor="#E1FEE8" fontWeight={700} color="#18753C" width="100%" maxWidth="800px">
            <SuccessCircle width="20px" fillHexaColor="#18753C" mr={2} />
            {text.confirmation}
          </Box>

          <Box width="100%" maxWidth="800px" mb={4}>
            {text.header}
          </Box>
          <Box width="100%" maxWidth="800px">
            <Formik
              initialValues={{ company_feedback: text.placeholderTextArea, email: data.recruiter_email ?? "", phone: data.recruiter_phone ?? "" }}
              validationSchema={Yup.object().shape({
                company_feedback: Yup.string().nullable().required("Veuillez remplir le message"),
                email: isRefusedState ? Yup.string() : Yup.string().email("Adresse e-mail invalide").required("L'adresse e-mail est obligatoire"),
                phone: isRefusedState
                  ? Yup.string()
                  : Yup.string()
                      .matches(/^[0-9]{10}$/, "Le numéro de téléphone doit avoir exactement 10 chiffres")
                      .required("Le téléphone est obligatoire"),
              })}
              onSubmit={(formikValues) => submitForm(formikValues)}
            >
              {({ values, handleChange, handleBlur, submitForm, dirty, isValid, isSubmitting }) => {
                console.log(dirty, isValid, isSubmitting)
                return (
                  <>
                    <Box pt={2} data-testid="fieldset-message">
                      <CustomFormControl label="Votre réponse :" required name="company_feedback">
                        <Text fontSize="12px" color="#666" mb={4}>
                          Le candidat recevra le message suivant {company_recruitment_intention === ApplicantIntention.ENTRETIEN && "ainsi que vos coordonnées "}par courriel.
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
                            <CustomInput data-testid="phone" name="phone" required={true} label="Téléphone" type="tel" value={values.phone} />
                          </Box>
                        </Flex>
                      </>
                    )}

                    {sendingState === "not_sent_because_of_errors" ? (
                      <Box mt={8} fontWeight={700}>
                        <Box mb={2} lineHeight="20px" fontSize="12px" color="#e10600">
                          Une erreur technique s'est produite
                        </Box>
                      </Box>
                    ) : (
                      <Flex direction="row-reverse">
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
                          mr={4}
                          variant="form"
                          aria-label="Envoyer le message au candidat"
                          type="button"
                          onClick={cancelForm}
                          disabled={!isValid || isSubmitting}
                          isActive={isValid}
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
