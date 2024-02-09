import { Box, Button, Flex, FormLabel, Input, Spacer, Text, Textarea } from "@chakra-ui/react"
import { useFormik } from "formik"
import { useRouter } from "next/router"
import { useEffect, useState } from "react"
import { ApplicantIntention } from "shared/constants/application"
import * as Yup from "yup"

import { apiPost } from "../../utils/api.utils"
import { isNonEmptyString } from "../../utils/strutils"
import { testingParameters } from "../../utils/testingParameters"

import SatisfactionFormNavigation from "./SatisfactionFormNavigation"
import SatisfactionFormSuccess from "./SatisfactionFormSuccess"

const textAreaProperties = {
  border: "none",
  background: "grey.200",
  borderRadius: "4px 4px 0px 0px",
  width: "100%",
  height: "110px",
  paddingLeft: 4,
  borderBottom: "2px solid",
}

const inputProperties = {
  border: "none",
  background: "grey.200",
  borderRadius: "4px 4px 0px 0px",
  width: { base: "100%", md: "280px", lg: "380px" },
  height: "40px",
  paddingLeft: 4,
  borderBottom: "2px solid",
}

const getFieldColor = (status) => {
  return status === "is-valid-true" ? "#008941" : status === "is-valid-false" ? "#e10600" : "grey.600"
}

const SatisfactionForm = () => {
  const router = useRouter()
  const { company_recruitment_intention, id, fn, ln, token } = router.query as {
    company_recruitment_intention: string
    id: string
    fn: string
    ln: string
    token: string | undefined
  }

  const isRefusedState = company_recruitment_intention === ApplicantIntention.REFUS

  const getFeedbackText = () => {
    const firstName = fn
    const lastName = ln
    const text = (
      <Box width="100%" maxWidth="800px" mb={8}>
        {company_recruitment_intention === ApplicantIntention.ENTRETIEN && (
          <Box>
            <Text pt={8}>Vous souhaitez rencontrer le/la candidat(e) ?</Text>
            <Text fontWeight={700}>Répondez à {`${firstName} ${lastName}`} et proposez-lui une date de rencontre.</Text>
            <Text pt={8}>Rédigez votre réponse personnalisée.</Text>
            <Text>
              <Text as="small" color="grey.425">
                Le candidat recevra votre commentaire ainsi que vos coordonnées directement sur sa boîte mail.
              </Text>
            </Text>
          </Box>
        )}
        {company_recruitment_intention === ApplicantIntention.NESAISPAS && (
          <Box>
            <Text pt={8}>La candidature de {`${firstName} ${lastName}`} vous intéresse, mais vous ne souhaitez pas prendre votre décision aujourd’hui ?</Text>
            <Text fontWeight={700}>Indiquez-lui que vous lui apporterez une réponse prochainement.</Text>
            <Text pt={8}>Rédigez votre réponse personnalisée.</Text>
            <Text>
              <Text as="small" color="grey.425">
                Le candidat recevra votre commentaire ainsi que vos coordonnées directement sur sa boîte mail.
              </Text>
            </Text>
          </Box>
        )}
        {company_recruitment_intention === ApplicantIntention.REFUS && (
          <Box>
            <Text pt={8}>Vous souhaitez refuser la candidature ?</Text>
            <Text fontWeight={700}>Indiquez au candidat {`${firstName} ${lastName}`} les raisons de ce refus. Une réponse personnalisée l’aidera pour ses futures recherches.</Text>
            <Text pt={8}>Rédigez votre réponse personnalisée.</Text>
            <Text>
              <Text as="small" color="grey.425">
                Le candidat recevra votre message directement sur sa boîte mail.
              </Text>
            </Text>
          </Box>
        )}
      </Box>
    )

    return text
  }

  useEffect(() => {
    if (!router.isReady) return
    const sendIntention = async () => {
      await apiPost("/application/intention/:id", {
        params: { id },
        body: {
          company_recruitment_intention,
        },
        headers: {
          authorization: `Bearer ${token}`,
        },
      })
    }
    sendIntention()
  }, [router.isReady])

  const [sendingState, setSendingState] = useState("not_sent")

  const submitForm = async ({ email, phone, company_feedback }) =>
    await apiPost("/application/intentionComment/:id", {
      params: { id },
      body: {
        phone: phone,
        email: email,
        company_feedback,
        company_recruitment_intention,
      },
      headers: {
        authorization: `Bearer ${token}`,
      },
    })

  const formik = useFormik({
    initialValues: { company_feedback: "", email: "", phone: "" },
    validationSchema: Yup.object().shape({
      company_feedback: Yup.string().nullable().required("Veuillez remplir le message"),
      email: isRefusedState ? Yup.string() : Yup.string().email("⚠ Adresse e-mail invalide").required("⚠ L'adresse e-mail est obligatoire"),
      phone: isRefusedState
        ? Yup.string()
        : Yup.string()
            .matches(/^[0-9]{10}$/, "⚠ Le numéro de téléphone doit avoir exactement 10 chiffres")
            .required("⚠ Le téléphone est obligatoire"),
    }),
    onSubmit: async (formikValues) => {
      await submitForm(formikValues)
        .then(() => setSendingState("ok_sent"))
        .catch(() => setSendingState("not_sent_because_of_errors"))
    },
  })

  const getErrorForMessage = (message) => {
    return (
      // @ts-expect-error: TODO
      <Box mb={message ? 2 : 0} lineHeight="20px" fontSize="12px" color="#e10600" visibility={message ? "visible" : "hidden !important"}>
        {message || "pas d'erreur"}
      </Box>
    )
  }

  const getPlaceHolderText = () => {
    switch (company_recruitment_intention) {
      case ApplicantIntention.NESAISPAS:
        return "Bonjour, Merci pour l'intérêt que vous portez à notre établissement. Votre candidature a retenu toute notre attention et nous vous répondrons ..."

      case ApplicantIntention.ENTRETIEN:
        return "Bonjour, Merci pour l'intérêt que vous portez à notre établissement. Votre candidature a retenu toute notre attention et nous souhaiterions échanger avec vous. Seriez-vous disponible le ... "

      default:
        return "Bonjour, Merci pour l'intérêt que vous portez à notre établissement. Nous ne sommes malheureusement pas en mesure de donner une suite favorable à votre candidature car ..."
    }
  }

  const getFieldStatus = (formikObj, target) => {
    let res = "is-not-validated"
    if (formikObj.errors[target]) {
      res = "is-valid-false"
    } else if (formikObj.values[target]) {
      res = "is-valid-true"
    }
    return res
  }

  const commentFieldStatus = getFieldStatus(formik, "company_feedback")
  const emailFieldStatus = getFieldStatus(formik, "email")
  const phoneFieldStatus = getFieldStatus(formik, "phone")

  return (
    <Box>
      <SatisfactionFormNavigation />
      {sendingState !== "ok_sent" ? (
        <Flex direction="column" width="80%" maxWidth="992px" margin="auto" pt={12} alignItems="center" data-testid="SatisfactionFormSuccess">
          {getFeedbackText()}
          {isNonEmptyString(company_recruitment_intention) && (
            <Box width="100%" maxWidth="800px">
              <form onSubmit={formik.handleSubmit}>
                <Box pt={2} data-testid="fieldset-message">
                  <Textarea
                    id="company_feedback"
                    data-testid="company_feedback"
                    name="company_feedback"
                    placeholder={`${getPlaceHolderText()}`}
                    onBlur={formik.handleBlur}
                    onChange={formik.handleChange}
                    value={formik.values.company_feedback}
                    {...textAreaProperties}
                    borderBottomColor={formik.touched.company_feedback && formik.errors.company_feedback && getFieldColor(commentFieldStatus)}
                  />
                </Box>
                {formik.touched.company_feedback && formik.errors.company_feedback && getErrorForMessage(formik.errors.company_feedback)}

                {company_recruitment_intention !== ApplicantIntention.REFUS && (
                  <>
                    <Text mt={6} mb={4}>
                      Indiquez au candidat <strong>vos coordonnées</strong>, afin qu'il puisse vous recontacter.
                    </Text>
                    <Flex direction={{ base: "column", md: "row" }}>
                      <Box data-testid="fieldset-email" mt={{ base: 1, md: 0 }} mr={{ base: 0, md: 4 }}>
                        <FormLabel htmlFor="email">E-mail *</FormLabel>
                        <Input
                          id="email"
                          data-testid="email"
                          name="email"
                          type="email"
                          onChange={formik.handleChange}
                          onBlur={formik.handleBlur}
                          value={formik.values.email}
                          {...inputProperties}
                          borderBottomColor={formik.touched.email && formik.errors.email && getFieldColor(emailFieldStatus)}
                        />
                        {formik.touched.email && formik.errors.email && getErrorForMessage(formik.errors.email)}
                        {testingParameters?.simulatedRecipient ? <div>Les emails seront envoyés à {testingParameters.simulatedRecipient}</div> : ""}
                      </Box>
                      <Spacer minWidth={4} />
                      <Box data-testid="fieldset-phone" mt={{ base: 1, md: 0 }} mr={{ base: 0, md: 4 }}>
                        <FormLabel htmlFor="phone">Téléphone *</FormLabel>
                        <Input
                          id="phone"
                          data-testid="phone"
                          name="phone"
                          type="tel"
                          maxLength={10}
                          onChange={formik.handleChange}
                          onBlur={formik.handleBlur}
                          value={formik.values.phone}
                          {...inputProperties}
                          borderBottomColor={formik.touched.phone && formik.errors.phone && getFieldColor(phoneFieldStatus)}
                        />
                        {formik.touched.phone && formik.errors.phone && getErrorForMessage(formik.errors.phone)}
                      </Box>
                    </Flex>
                  </>
                )}

                <Flex direction="row-reverse">
                  <Button mt={4} variant="blackButton" aria-label="Envoyer le message au candidat" type="submit">
                    Envoyer le message
                  </Button>
                </Flex>
              </form>
            </Box>
          )}
        </Flex>
      ) : (
        <SatisfactionFormSuccess />
      )}
    </Box>
  )
}

export default SatisfactionForm
