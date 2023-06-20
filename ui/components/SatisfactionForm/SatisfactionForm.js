import React, { useEffect, useState } from "react"
import * as Yup from "yup"
import { useFormik } from "formik"
import submitCommentaire from "./services/submitCommentaire.js"
import SatisfactionFormSuccess from "./SatisfactionFormSuccess.js"
import SatisfactionFormNavigation from "./SatisfactionFormNavigation.js"
import { isNonEmptyString } from "../../utils/strutils"

import { getValueFromPath } from "../../utils/tools"
import { testingParameters } from "../../utils/testingParameters"
import { useRouter } from "next/router"
import { Box, Button, Flex, FormLabel, Input, Spacer, Text, Textarea } from "@chakra-ui/react"

let iv = null
let id = null
let intention = null

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

const SatisfactionForm = ({ formType }) => {
  const router = useRouter()

  const initParametersFromPath = () => {
    iv = getValueFromPath("iv")
    id = getValueFromPath("id")
    intention = getValueFromPath("intention")
  }

  const readIntention = () => {
    const { intention } = router?.query ? router.query : { intention: "intention" }
    return intention
  }

  const getFeedbackText = () => {
    const { intention, fn, ln } = router?.query ? router.query : { intention: "intention", fn: "prénom", ln: "nom" }
    let firstName = fn
    let lastName = ln
    let text = (
      <Box width="100%" maxWidth="800px" mb={8}>
        {intention === "entretien" && (
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
        {intention === "ne_sais_pas" && (
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
        {intention === "refus" && (
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
    // enregistrement en state des params provenant du path
    initParametersFromPath()
  }, [])

  const [sendingState, setSendingState] = useState("not_sent")

  const getValidationSchema = () => {
    const { intention } = router?.query ? router.query : { intention: "intention" }
    let res = Yup.object({})
    if (intention === "refus") {
      res = Yup.object({
        comment: Yup.string().nullable().required("Veuillez remplir le message"),
      })
    } else {
      res = Yup.object({
        comment: Yup.string().required("Veuillez remplir le message"),
        email: Yup.string().email("⚠ Adresse e-mail invalide").required("⚠ L'adresse e-mail est obligatoire"),
        phone: Yup.string()
          .matches(/^[0-9]{10}$/, "⚠ Le numéro de téléphone doit avoir exactement 10 chiffres")
          .required("⚠ Le téléphone est obligatoire"),
      })
    }
    return res
  }

  const formik = useFormik({
    initialValues: { comment: "" },
    validationSchema: getValidationSchema(intention),
    onSubmit: async (formikValues) => {
      await submitCommentaire(
        {
          comment: formikValues.comment,
          phone: formikValues.phone,
          email: formikValues.email,
          id,
          intention,
          iv,
          formType,
        },
        setSendingState
      )
    },
  })

  const getErrorForMessage = (message) => {
    return (
      <Box mb={message ? 2 : 0} lineHeight="20px" fontSize="12px" color="#e10600" visibility={message ? "visible" : "hidden !important"}>
        {message || "pas d'erreur"}
      </Box>
    )
  }

  const getFieldError = () => {
    let message = ""
    if (formik.touched.comment && formik.errors.comment) message = formik.errors.comment
    else if (sendingState === "not_sent_because_of_errors") message = "Une erreur technique empêche l'enregistrement de votre avis. Merci de réessayer ultérieurement"

    return getErrorForMessage(message)
  }

  const getPlaceHolderText = () => {
    const { intention } = router?.query ? router.query : { intention: "intention" }
    let res = ""
    if (intention === "ne_sais_pas") {
      res = "Bonjour, Merci pour l'intérêt que vous portez à notre établissement. Votre candidature a retenu toute notre attention et nous vous répondrons ..."
    } else if (intention === "entretien") {
      res =
        "Bonjour, Merci pour l'intérêt que vous portez à notre établissement. Votre candidature a retenu toute notre attention et nous souhaiterions échanger avec vous. Seriez-vous disponible le ... "
    } else {
      res =
        "Bonjour, Merci pour l'intérêt que vous portez à notre établissement. Nous ne sommes malheureusement pas en mesure de donner une suite favorable à votre candidature car ..."
    }
    return res
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

  const commentFieldStatus = getFieldStatus(formik, "comment")
  const emailFieldStatus = getFieldStatus(formik, "email")
  const phoneFieldStatus = getFieldStatus(formik, "phone")

  return (
    <Box>
      <SatisfactionFormNavigation />
      {sendingState !== "ok_sent" ? (
        <Flex direction="column" width="80%" maxWidth="992px" margin="auto" pt={12} alignItems="center" data-testid="SatisfactionFormSuccess">
          {getFeedbackText()}
          {isNonEmptyString(readIntention()) && (
            <Box width="100%" maxWidth="800px">
              <form onSubmit={formik.handleSubmit}>
                <Box pt={2} data-testid="fieldset-message">
                  <Textarea
                    id="comment"
                    data-testid="comment"
                    name="comment"
                    placeholder={`${getPlaceHolderText()}`}
                    onBlur={formik.handleBlur}
                    onChange={formik.handleChange}
                    value={formik.values.comment}
                    {...textAreaProperties}
                    borderBottomColor={getFieldColor(commentFieldStatus)}
                  />
                </Box>
                {getFieldError()}

                {readIntention() !== "refus" && (
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
                        value={formik.values.email || ""}
                        {...inputProperties}
                        borderBottomColor={getFieldColor(emailFieldStatus)}
                      />
                      {getErrorForMessage(formik.errors.email)}
                      {testingParameters?.simulatedRecipient ? <div>Les emails seront envoyés à {testingParameters.simulatedRecipient}</div> : ""}
                    </Box>
                    <Spacer minWidth={4} />
                    <Box data-testid="fieldset-phone" mt={{ base: 1, md: 0 }} mr={{ base: 0, md: 4 }}>
                      <FormLabel htmlFor="phone">Téléphone *</FormLabel>
                      <Input
                        id="phone"
                        data-testid="phone"
                        name="phone"
                        type="text"
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        value={formik.values.phone || ""}
                        {...inputProperties}
                        borderBottomColor={getFieldColor(phoneFieldStatus)}
                      />
                      {getErrorForMessage(formik.errors.phone)}
                    </Box>
                  </Flex>
                )}

                <Flex direction="row-reverse">
                  <Button mt={4} variant="blackButton" aria-label="Envoyer le message au candidat" type="submit">
                    {"Envoyer le message"}
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
