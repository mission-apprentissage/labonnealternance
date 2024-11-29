import { Box, Button, Flex, Text, Textarea } from "@chakra-ui/react"
import { Formik } from "formik"
import { useEffect, useState } from "react"
import { ApplicantIntention } from "shared/constants/application"
import * as Yup from "yup"

import { apiPost } from "../../utils/api.utils"
import { CustomInput } from "../espace_pro"
import { CustomFormControl } from "../espace_pro/CustomFormControl"

import SatisfactionFormNavigation from "./SatisfactionFormNavigation"
import { SatisfactionFormSuccess } from "./SatisfactionFormSuccess"

const textAreaProperties = {
  border: "none",
  background: "grey.200",
  borderRadius: "4px 4px 0px 0px",
  width: "100%",
  height: "110px",
  paddingLeft: 4,
  borderBottom: "2px solid",
}

export const SatisfactionForm = ({
  company_recruitment_intention,
  id,
  firstName,
  lastName,
  token,
}: {
  company_recruitment_intention: ApplicantIntention
  id: string
  firstName: string
  lastName: string
  token: string | undefined
}) => {
  const [sendingState, setSendingState] = useState<"not_sent" | "ok_sent" | "not_sent_because_of_errors">("not_sent")
  useEffect(() => {
    apiPost("/application/intention/:id", {
      params: { id },
      body: { company_recruitment_intention },
      headers: { authorization: `Bearer ${token}` },
    })
  }, [])

  const isRefusedState = company_recruitment_intention === ApplicantIntention.REFUS

  const intentionVariants: Record<ApplicantIntention, { placeholderTextArea: string; header: React.ReactNode }> = {
    [ApplicantIntention.ENTRETIEN]: {
      header: (
        <>
          <Text fontWeight={700} fontSize="16px" pt={8}>
            Personnalisez votre réponse pour apporter à {`${firstName}`} un message qui lui correspond vraiment.
          </Text>
        </>
      ),
      placeholderTextArea:
        "Bonjour, Merci pour l'intérêt que vous portez à notre établissement. Votre candidature a retenu toute notre attention et nous souhaiterions échanger avec vous. Seriez-vous disponible le ... ",
    },
    [ApplicantIntention.NESAISPAS]: {
      header: (
        <>
          <Text pt={8}>La candidature de {`${firstName} ${lastName}`} vous intéresse, mais vous ne souhaitez pas prendre votre décision aujourd’hui ?</Text>
          <Text fontWeight={700}>Indiquez-lui que vous lui apporterez une réponse prochainement.</Text>
          <Text pt={8}>Rédigez votre réponse personnalisée.</Text>
        </>
      ),
      placeholderTextArea: "Bonjour, Merci pour l'intérêt que vous portez à notre établissement. Votre candidature a retenu toute notre attention et nous vous répondrons ...",
    },
    [ApplicantIntention.REFUS]: {
      header: (
        <>
          <Text pt={8} fontWeight={700}>
            Personnalisez votre réponse afin d’aider {`${firstName}`} à s’améliorer pour ses prochaines candidatures.
          </Text>
        </>
      ),
      placeholderTextArea:
        "Bonjour, Merci pour l'intérêt que vous portez à notre établissement. Nous ne sommes malheureusement pas en mesure de donner une suite favorable à votre candidature car ...",
    },
  }

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

  return (
    <Box>
      <SatisfactionFormNavigation />
      {sendingState !== "ok_sent" && (
        <Flex direction="column" width="80%" maxWidth="992px" margin="auto" pt={12} alignItems="center" data-testid="SatisfactionFormSuccess">
          <Box width="100%" maxWidth="800px" mb={4}>
            {intentionVariants[company_recruitment_intention].header}
          </Box>
          <Box width="100%" maxWidth="800px">
            <Formik
              initialValues={{ company_feedback: "", email: "", phone: "" }}
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
                return (
                  <>
                    <Box pt={2} data-testid="fieldset-message">
                      <CustomFormControl label="Votre réponse :" required name="company_feedback">
                        <Text fontSize="12px" color="#666" mb={4}>
                          Le candidat recevra le message suivant ainsi que vos coordonnées par courriel.
                        </Text>
                        <Textarea
                          id="company_feedback"
                          data-testid="company_feedback"
                          name="company_feedback"
                          placeholder={intentionVariants[company_recruitment_intention].placeholderTextArea}
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
                          disabled={!dirty || !isValid || isSubmitting}
                          isActive={isValid}
                          isLoading={isSubmitting}
                        >
                          Envoyer le message
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
      {sendingState === "ok_sent" && <SatisfactionFormSuccess intention={company_recruitment_intention} />}
    </Box>
  )
}
