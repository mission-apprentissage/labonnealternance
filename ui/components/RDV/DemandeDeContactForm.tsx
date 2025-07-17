import {
  Accordion,
  AccordionButton,
  AccordionIcon,
  AccordionItem,
  AccordionPanel,
  Box,
  Checkbox,
  CheckboxGroup,
  Flex,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Input,
  Radio,
  RadioGroup,
  Stack,
  Text,
} from "@chakra-ui/react"
import Button from "@codegouvfr/react-dsfr/Button"
import emailMisspelled, { top100 } from "email-misspelled"
import { Formik, useField } from "formik"
import { useState } from "react"
import { EReasonsKey } from "shared"
import { EApplicantType } from "shared/constants/rdva"
import * as Yup from "yup"

import { DsfrLink } from "@/components/dsfr/DsfrLink"
import { RdvReasons } from "@/components/RDV/RdvReasons"
import { apiPost } from "@/utils/api.utils"
import { SendPlausibleEvent } from "@/utils/plausible"

import InfoBanner from "../InfoBanner/InfoBanner"

const emailChecker = emailMisspelled({ maxMisspelled: 3, domains: top100 })

export const DemandeDeContactForm = ({
  context: { cle_ministere_educatif, etablissement_formateur_entreprise_raison_sociale },
  referrer,
  onRdvSuccess,
}: {
  context: { cle_ministere_educatif: string; etablissement_formateur_entreprise_raison_sociale: string }
  referrer: string
  onRdvSuccess: (props: { appointmentId: string; token: string }) => void
}) => {
  const [error, setError] = useState<string | null>(null)

  return (
    <Formik
      initialValues={{
        firstname: "",
        lastname: "",
        phone: "",
        email: "",
        applicantMessageToCfa: "",
        applicantType: EApplicantType.ETUDIANT,
        applicantReasons: [],
      }}
      validationSchema={Yup.object({
        firstname: Yup.string().required("⚠ Le prénom est obligatoire"),
        lastname: Yup.string().required("⚠ Le nom est obligatoire"),
        phone: Yup.string()
          .matches(/^[0-9]{10}$/, "⚠ Numéro de téléphone invalide")
          .required("⚠ Le numéro de téléphone est obligatoire"),
        email: Yup.string().email("⚠ Adresse e-mail invalide").required("⚠ L'adresse e-mail est obligatoire"),
        applicantMessageToCfa: Yup.string(),
        applicantType: Yup.mixed().oneOf(Object.values(EApplicantType)),
        applicantReasons: Yup.array(Yup.mixed().oneOf(RdvReasons.map((item) => item.key)))
          .min(1, "Le(s) sujet(s) que je souhaite aborder doit/doivent être renseigné(s).")
          .required("Le(s) sujet(s) que je souhaite aborder doit/doivent être renseigné(s)."),
      })}
      onSubmit={async (values) => {
        try {
          const result = await apiPost("/appointment-request/validate", {
            body: {
              firstname: values.firstname,
              lastname: values.lastname,
              phone: values.phone,
              email: values.email,
              type: values.applicantType,
              applicantMessageToCfa: values.applicantMessageToCfa,
              cleMinistereEducatif: cle_ministere_educatif,
              applicantReasons: values.applicantReasons,
              appointmentOrigin: referrer,
            },
          })
          const appointmentId = result?.appointment?._id?.toString()
          const token = result?.token
          if (!appointmentId || !token) {
            setError("Une erreur inattendue est survenue.")
            return
          }
          onRdvSuccess({ appointmentId, token })
          SendPlausibleEvent("Envoi Prendre RDV - Fiche formation", {
            info_fiche: `${cle_ministere_educatif}`,
          })
        } catch (json) {
          setError(json?.message || "Une erreur inattendue est survenue.")
        }
      }}
    >
      {(formik) => {
        return (
          <form onSubmit={formik.handleSubmit}>
            <Flex direction={["column", "column", "row"]}>
              <Text mt={7} pb={2}>
                Vous êtes * :
              </Text>
              <RadioGroup
                mt={7}
                ml={10}
                data-testid="fieldset-who-type"
                value={formik.values.applicantType}
                onChange={(value) => formik.setFieldValue("applicantType", value, true)}
              >
                <Stack direction="row" spacing={3}>
                  <Radio size="lg" value={EApplicantType.ETUDIANT}>
                    L'étudiant
                  </Radio>
                  <Radio size="lg" value={EApplicantType.PARENT}>
                    Le parent
                  </Radio>
                </Stack>
              </RadioGroup>
            </Flex>
            <Flex direction={["column", "column", "row"]}>
              <FormControl data-testid="fieldset-lastname" mt={{ base: 3, md: "0" }} isInvalid={!!(formik.touched.lastname && formik.errors.lastname)}>
                <FormLabel htmlFor="lastname">Nom *</FormLabel>
                <Input
                  data-testid="lastname"
                  name="lastname"
                  type="text"
                  width={["100%", "100%", "95%"]}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  value={formik.values.lastname}
                />
                <FormErrorMessage>{formik.errors.lastname}</FormErrorMessage>
              </FormControl>
              <FormControl data-testid="fieldset-firstname" mt={{ base: 3, md: "0" }} isInvalid={!!(formik.touched.firstname && formik.errors.firstname)}>
                <FormLabel htmlFor="firstname">Prénom *</FormLabel>
                <Input
                  data-testid="firstname"
                  name="firstname"
                  type="text"
                  width={["100%", "100%", "95%"]}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  value={formik.values.firstname}
                />
                <FormErrorMessage>{formik.errors.firstname}</FormErrorMessage>
              </FormControl>
            </Flex>
            <Flex direction={["column", "column", "row"]} mt={4}>
              <EmailField />
              <FormControl data-testid="fieldset-phone" mt={{ base: 3, md: "0" }} isInvalid={!!(formik.touched.phone && formik.errors.phone)}>
                <FormLabel htmlFor="email">Téléphone *</FormLabel>
                <Input
                  data-testid="phone"
                  name="phone"
                  type="phone"
                  width={["100%", "100%", "95%"]}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  value={formik.values.phone}
                />
                <FormErrorMessage>{formik.errors.phone}</FormErrorMessage>
              </FormControl>
            </Flex>
            <Flex direction={["column", "column", "row"]} mt={4}>
              <ReasonsField formik={formik} />
            </Flex>
            <Box width="95%" my={4} fontSize="12px">
              <Text mb={2} color="grey.600" mt={6}>
                * Champs obligatoires
              </Text>
              <Text mt={4}>
                En remplissant ce formulaire, vous acceptez les{" "}
                <DsfrLink href="/conditions-generales-utilisation" external aria-description="Conditions générales d'utilisation - nouvelle fenêtre">
                  Conditions générales d&apos;utilisation
                </DsfrLink>{" "}
                du service La bonne alternance et acceptez le partage de vos informations avec l&apos;établissement {etablissement_formateur_entreprise_raison_sociale}.
                <br />
                Pour plus d'informations sur le traitement de vos données à caractère personnel, veuillez consulter la{" "}
                <DsfrLink href="/politique-de-confidentialite" external aria-description="politique de confidentialité - nouvelle fenêtre">
                  Politique de confidentialité
                </DsfrLink>{" "}
                de La bonne alternance.
              </Text>
            </Box>
            {error && (
              <Box pt={4}>
                <Text data-testid="prdv-submit-error" color="redmarianne">
                  {error}
                </Text>
              </Box>
            )}
            <InfoBanner showInfo={false} showAlert={false} showOK={false} forceEnvBanner={true} />
            <Box mb={8} textAlign="right" mr={4}>
              <Button data-tracking-id="prendre-rdv-cfa" aria-label="Envoyer la demande de contact" type="submit" disabled={formik.isSubmitting}>
                J'envoie ma demande
              </Button>
            </Box>
          </form>
        )
      }}
    </Formik>
  )
}

const EmailField = () => {
  const [suggestedEmails, setSuggestedEmails] = useState([])
  const [field, meta, helper] = useField("email")

  /**
   * On email change, check if email is correct and set suggestion if not.
   */
  const onEmailChange = (e) => {
    const suggestedEmails = emailChecker(e.target.value)
    setSuggestedEmails(suggestedEmails)
    field.onChange(e)
  }

  /**
   * Set email value from suggestion.
   */
  const onClickEmailSuggestion = (e) => {
    helper.setValue(e.currentTarget.innerHTML, true)
    setSuggestedEmails([])
  }

  return (
    <FormControl data-testid="fieldset-email" mt={{ base: 3, md: "0" }} isInvalid={!!(meta.touched && meta.error)}>
      <FormLabel htmlFor="email">E-mail *</FormLabel>
      <Input data-testid="email" name="email" type="email" width={["100%", "100%", "95%"]} onChange={onEmailChange} onBlur={field.onBlur} value={field.value} />
      {suggestedEmails.length > 0 && (
        <Box mt={2} fontSize="12px" color="grey.600">
          <Text as="span" mr={2}>
            Voulez vous dire ?
          </Text>
          {suggestedEmails.map((suggestedEmail) => (
            <Button type="button" key={suggestedEmail.corrected} onClick={onClickEmailSuggestion} priority="tertiary no outline" size="small">
              {suggestedEmail.corrected}
            </Button>
          ))}
        </Box>
      )}
      <FormErrorMessage>{meta.error}</FormErrorMessage>
    </FormControl>
  )
}

const ReasonsField = ({ formik }: { formik: any }) => {
  const [field, meta, helper] = useField("applicantReasons")
  const applicantReasons: EReasonsKey[] = field.value || []
  const hasApplicantReasonChecked = applicantReasons.length > 0

  /**
   * On change on applicant reasons, it updates the state.
   */
  const onChangeApplicantReasons = (values: EReasonsKey[]) => {
    helper.setValue(values, true)
  }

  return (
    <FormControl data-testid="fieldset-reasons" mt={{ base: 3, md: "0" }}>
      <FormLabel htmlFor="reasons">Quel(s) sujet(s) souhaitez-vous aborder ? *</FormLabel>
      <Accordion allowToggle borderLeftWidth={1} borderRightWidth={1} mr={4} width={["100%", "100%", "auto", "auto"]}>
        <AccordionItem _expanded={{ _last: { borderBottomWidth: "1px" } }} sx={{ _last: { borderBottomWidth: "0" } }}>
          <h2>
            <AccordionButton
              sx={{
                borderRadius: 0,
                height: "40px",
                bg: "grey.200",
                color: "grey.800",
                borderBottom: "solid 2px #000",
              }}
            >
              <Box as="span" flex="1" textAlign="left" sx={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {RdvReasons.flatMap(({ key, title }) => (applicantReasons.includes(key) ? [title] : [])).join(", ") || "Sélectionner une ou des options"}
              </Box>
              <AccordionIcon />
            </AccordionButton>
          </h2>
          <AccordionPanel pb={4}>
            <CheckboxGroup onChange={onChangeApplicantReasons}>
              <Stack direction="column" spacing={3} mt={1} ml={1}>
                {RdvReasons.map(({ key, title }, index) => {
                  const checked = applicantReasons.includes(key)
                  return (
                    <Checkbox key={key} id={`reason-${index}`} size="lg" defaultChecked={checked} value={key}>
                      {title}
                    </Checkbox>
                  )
                })}
              </Stack>
            </CheckboxGroup>
          </AccordionPanel>
        </AccordionItem>
      </Accordion>
      {applicantReasons.includes(EReasonsKey.AUTRE) && (
        <FormControl data-testid="fieldset-applicantMessageToCfa">
          <Input
            id="applicantMessageToCfa"
            data-testid="applicantMessageToCfa"
            name="applicantMessageToCfa"
            type="text"
            width="98%"
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            value={formik.values.applicantMessageToCfa}
          />
          <FormErrorMessage>{formik.errors.applicantMessageToCfa}</FormErrorMessage>
        </FormControl>
      )}
      <FormControl isInvalid={!hasApplicantReasonChecked && meta.touched}>
        <FormErrorMessage>Le(s) sujet(s) que je souhaite aborder doit/doivent être renseigné(s).</FormErrorMessage>
      </FormControl>
    </FormControl>
  )
}
