import { Box, Button, Input, Radio, RadioGroup, Spinner, Stack, Text, CheckboxGroup, Checkbox } from "@chakra-ui/react"
// eslint-disable-next-line import/no-extraneous-dependencies
import emailValidator from "email-validator" // TODO_AB
import { Field, Form, Formik } from "formik"
import { useRouter } from "next/router"
import { useEffect, useState } from "react"
import * as Yup from "yup"

import { _post } from "../../../common/httpClient"
import { getReasonText, getDefaultReasonsAsFalse, getReasons } from "../../../common/utils/reasonsUtils"
import { ContactCfaComponent } from "../../../components/espace_pro/Candidat/layout/ContactCfaComponent"
import { FormLayoutComponent } from "../../../components/espace_pro/Candidat/layout/FormLayoutComponent"

/**
 * @description Form appointment page.
 * @returns {JSX.Element}
 * @constructor
 */
export default function FormCreatePage() {
  const router = useRouter()

  const [data, setData]: [
    {
      etablissement_formateur_entreprise_raison_sociale: string
      intitule_long: string
      lieu_formation_adresse: string
      code_postal: string
      localite: string
    },
    (d: any) => void,
  ] = useState(null)
  const [submitLoading, setSubmitLoading] = useState(false)
  const [error, setError] = useState()
  const [errorPhone, setErrorPhone] = useState()
  const [loading, setLoading] = useState(false)
  const [displayMessage, setDisplayMessage] = useState(false)

  const { cleMinistereEducatif, referrer } = router.query
  /**
   * @description Initialize.
   */
  useEffect(() => {
    async function fetchContext() {
      try {
        setLoading(true)

        const response = await _post(`appointment-request/context/create`, {
          idCleMinistereEducatif: cleMinistereEducatif,
          referrer,
        })

        if (response?.error) {
          throw new Error(response?.error)
        }

        setData(response)
      } catch (error) {
        setError(error.message)
      } finally {
        setLoading(false)
      }
    }
    if (referrer) fetchContext()
  }, [cleMinistereEducatif, referrer])

  /**
   * @description Validate email.
   * @param {String} value
   * @returns {string|undefined}
   */
  function validateEmail(value) {
    let error

    if (!value) {
      error = "Adresse email requise"
    } else if (!emailValidator.validate(value)) {
      error = "Adresse email invalide"
    }

    return error
  }

  /**
   * @description Validate phone number.
   * @param {String} value
   * @returns {string|undefined}
   */
  function validatePhone(value) {
    let error
    if (!value) {
      error = "Numéro de téléphone requis"
    } else if (!/^0[1-98][0-9]{8}$/i.test(value)) {
      error = "Numéro de téléphone invalide"
      setErrorPhone(error)
    } else {
      error = ""
      setErrorPhone(error)
    }
    return error
  }

  /**
   * @description Sends appointment requesT.
   * @param {Object} values
   * @param {Function} setStatus
   * @returns {Promise<void>}
   */
  const sendNewRequest = async (values, { setStatus }) => {
    try {
      setSubmitLoading(true)
      const { appointment } = await _post("appointment-request/validate", {
        firstname: values.firstname,
        lastname: values.lastname,
        phone: values.phone,
        email: values.email,
        type: values.applicantType,
        applicantMessageToCfa: values.applicantMessageToCfa,
        cleMinistereEducatif,
        applicantReasons: getReasons().filter((e) => checkedState[e]),
        appointmentOrigin: referrer,
      })

      router.push(`/form/confirm/${appointment._id}`)
      setTimeout(() => window.scroll({ top: 0, behavior: "smooth" }), 500)
    } catch ({ message }) {
      // TODO to check return if already appoitment
      setStatus({ error: message })
    } finally {
      setSubmitLoading(false)
    }
  }

  const feedback = (meta, message) => {
    return meta.touched && meta.error
      ? {
          feedback: message,
          invalid: "true",
        }
      : {}
  }

  const [checkedState, setCheckedState] = useState(getDefaultReasonsAsFalse())

  /**
   * @description Handle the check of a checkbox, according to the name of the checkbox
   */
  const handleOnChange = (checkboxName) => {
    const copyOfCheckedState = JSON.parse(JSON.stringify(checkedState))
    copyOfCheckedState[checkboxName] = !copyOfCheckedState[checkboxName]
    setCheckedState(copyOfCheckedState)
    setDisplayMessage(copyOfCheckedState["autre"])
  }

  const checkboxLine = (reason, i) => {
    return (
      <Checkbox key={i} iconSize="24px" value={reason} isChecked={checkedState[reason]} onChange={() => handleOnChange(reason)}>
        <Text as="span" lineHeight="24px">
          {getReasonText(reason)}
        </Text>
      </Checkbox>
    )
  }

  return (
    <FormLayoutComponent
      headerText={
        <>
          Envoyer <br />
          une demande de contact <br />
          <Text textStyle="h2" as="span" color="grey.700">
            au centre de formation
          </Text>
        </>
      }
      bg="white"
    >
      {loading && <Spinner display="block" mx="auto" size="xl" mt="10rem" />}
      {error && (
        <Box mt="5rem" textAlign="center">
          {error}
        </Box>
      )}
      {data && (
        <Box>
          <Formik
            initialValues={{
              firstname: "",
              lastname: "",
              phone: "",
              email: "",
              applicantMessageToCfa: "",
              applicantType: "parent",
            }}
            validationSchema={Yup.object().shape({
              firstname: Yup.string().required("Requis"),
              lastname: Yup.string().required("Requis"),
              phone: Yup.number().required("Requis"),
              email: Yup.string().required("Requis"),
              applicantMessageToCfa: Yup.string(),
              applicantType: Yup.string(),
            })}
            onSubmit={sendNewRequest}
          >
            {({ status = {} }) => {
              return (
                <Form>
                  <ContactCfaComponent
                    entrepriseRaisonSociale={data.etablissement_formateur_entreprise_raison_sociale}
                    intitule={data.intitule_long}
                    adresse={data.lieu_formation_adresse}
                    codePostal={data.code_postal}
                    ville={data.localite}
                  />
                  <Text textStyle="h6" color="info">
                    Bonjour,
                  </Text>
                  <Text mt={7} pb={2}>
                    Vous êtes{" "}
                    <Text color="redmarianne" as="span">
                      *
                    </Text>{" "}
                    :
                  </Text>
                  <Field name="applicantType">
                    {({ field }) => (
                      <RadioGroup {...field} my={4}>
                        <Stack direction="row" spacing={3}>
                          <Radio {...field} size="lg" value="parent">
                            Le parent
                          </Radio>
                          <Radio {...field} size="lg" value="etudiant">
                            L'étudiant
                          </Radio>
                        </Stack>
                      </RadioGroup>
                    )}
                  </Field>
                  <Field name="firstname">{({ field, meta }) => <Input placeholder="votre prénom" {...field} {...feedback(meta, "Prénom invalide")} />}</Field>
                  <Field name="lastname">{({ field, meta }) => <Input mt={2} placeholder="votre nom" {...field} {...feedback(meta, "Nom invalide")} />}</Field>
                  {data.intitule_long && (
                    <Text mt={5}>
                      Pour tout savoir de la formation{" "}
                      <b>
                        <u>{data.intitule_long.toUpperCase()}</u>
                      </b>
                      , laissez votre numéro et votre adresse email au centre de formation{" "}
                      <Text color="redmarianne" as="span">
                        *
                      </Text>{" "}
                      :
                    </Text>
                  )}
                  <Field name="phone" validate={validatePhone}>
                    {({ field }) => {
                      return (
                        <Box>
                          <Input mt={2} type="tel" placeholder="votre numéro de téléphone" {...field} />
                          <Text color="red" mt={2} mb={3}>
                            {errorPhone}
                          </Text>
                        </Box>
                      )
                    }}
                  </Field>
                  <Field name="email" validate={validateEmail}>
                    {({ field, meta }) => {
                      return <Input placeholder="votre adresse email" type="email" {...field} {...feedback(meta, "Adresse email invalide")} />
                    }}
                  </Field>
                  <Text mt={6} pb={4}>
                    Quel sujet souhaitez-vous aborder ?
                  </Text>
                  <CheckboxGroup>
                    <Stack direction="column" spacing={3}>
                      {getReasons().map((reason, i) => {
                        return checkboxLine(reason, i)
                      })}
                    </Stack>
                  </CheckboxGroup>

                  {displayMessage ? (
                    <Field name="applicantMessageToCfa">
                      {({ field, meta }) => {
                        return <Input placeholder="période d’inscription, horaires, etc." {...field} {...feedback(meta, "Désolé, ce champs est nécessaire")} />
                      }}
                    </Field>
                  ) : (
                    <></>
                  )}

                  <Text mt={10}>
                    <span style={{ color: "#B34000", paddingRight: "5px" }}>*</span>champs obligatoires
                  </Text>
                  <Button
                    variant="unstyled"
                    type={"submit"}
                    disabled={submitLoading}
                    bg={"grey.750"}
                    borderRadius="10px"
                    color="#FFFFFF"
                    w="269px"
                    h="44px"
                    fontWeight="700"
                    display="block"
                    mx={["auto", "0", "0", "0"]}
                    mt="2rem"
                    textAlign="center"
                  >
                    Envoyer ma demande
                  </Button>
                  {status.error && (
                    <Text color="#cd201f" textAlign="center" mt={8}>
                      {status.error}
                    </Text>
                  )}
                </Form>
              )
            }}
          </Formik>
        </Box>
      )}
    </FormLayoutComponent>
  )
}
