import { ExternalLinkIcon } from "@chakra-ui/icons"
import {
  Accordion,
  AccordionButton,
  AccordionIcon,
  AccordionItem,
  AccordionPanel,
  Box,
  Button,
  Checkbox,
  CheckboxGroup,
  Flex,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Image,
  Input,
  Link,
  Modal,
  ModalBody,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Radio,
  RadioGroup,
  Stack,
  Text,
  useDisclosure,
} from "@chakra-ui/react"
import emailMisspelled, { top100 } from "email-misspelled"
import { useFormik } from "formik"
import { useEffect, useState } from "react"
import { EReasonsKey } from "shared"
import { EApplicantType } from "shared/constants/rdva"
import { IAppointmentRequestContextCreateFormAvailableResponseSchema } from "shared/routes/appointments.routes"
import * as Yup from "yup"

import { reasons } from "@/components/RDV/types"
import { BarberGuy } from "@/theme/components/icons"
import { apiGet, apiPost } from "@/utils/api.utils"
import { localStorageSet } from "@/utils/localStorage"
import { SendPlausibleEvent } from "@/utils/plausible"

import InfoBanner from "../InfoBanner/InfoBanner"
import LBAModalCloseButton from "../lbaModalCloseButton"

type Props = {
  context: IAppointmentRequestContextCreateFormAvailableResponseSchema
  referrer: string
  showInModal: boolean
}

/**
 * "Demande de contact" modal.
 */
const DemandeDeContact = (props: Props) => {
  const { isOpen, onOpen, onClose } = useDisclosure()
  const [suggestedEmails, setSuggestedEmails] = useState([])
  const [applicantReasons, setApplicantReasons] = useState<typeof reasons>(reasons)
  const [showApplicantReasonError, setShowApplicantReasonError] = useState(false)
  const [applicantType, setApplicantType] = useState<EApplicantType>(EApplicantType.ETUDIANT)
  const [onSuccessSubmitResponse, setOnSuccessSubmitResponse] = useState(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      SendPlausibleEvent("Clic Prendre RDV - Fiche formation", {
        info_fiche: `${props.context.cle_ministere_educatif}`,
      })
    }
  }, [props.context.cle_ministere_educatif, isOpen])

  useEffect(() => {
    resetForm()
  }, [props.context.cle_ministere_educatif])

  const emailChecker = emailMisspelled({ maxMisspelled: 3, domains: top100 })

  const yupInputs = {
    firstname: Yup.string().required("⚠ Le prénom est obligatoire"),
    lastname: Yup.string().required("⚠ Le nom est obligatoire"),
    phone: Yup.string()
      .matches(/^[0-9]{10}$/, "⚠ Numéro de téléphone invalide")
      .required("⚠ Le numéro de téléphone est obligatoire"),
    email: Yup.string().email("⚠ Adresse e-mail invalide").required("⚠ L'adresse e-mail est obligatoire"),
    applicantMessageToCfa: Yup.string(),
    applicantType: Yup.string(),
  }

  /**
   * On email change, check if email is correct and set suggestion if not.
   */
  const onEmailChange = (e) => {
    const checkedEmail = emailChecker(e.target.value)
    setSuggestedEmails(checkedEmail)
    formik.handleChange(e)
  }

  /**
   * Set email value from suggestion.
   */
  const onClickEmailSuggestion = (e) => {
    formik.setFieldValue("email", e.currentTarget.innerHTML)
    setSuggestedEmails([])
  }

  const formik = useFormik({
    initialValues: {
      firstname: "",
      lastname: "",
      phone: "",
      email: "",
      applicantMessageToCfa: "",
      applicantType,
    },
    validationSchema: Yup.object({
      ...yupInputs,
    }),
    onSubmit: async (values) => {
      try {
        const result = await apiPost("/appointment-request/validate", {
          body: {
            firstname: values.firstname,
            lastname: values.lastname,
            phone: values.phone,
            email: values.email,
            type: applicantType,
            applicantMessageToCfa: values.applicantMessageToCfa,
            cleMinistereEducatif: props.context.cle_ministere_educatif,
            applicantReasons: applicantReasons.filter(({ checked }) => checked).map(({ key }) => key),
            appointmentOrigin: props.referrer,
          },
        })

        const response = await apiGet("/appointment-request/context/short-recap", {
          querystring: { appointmentId: result.appointment._id.toString() },
          headers: {
            authorization: `Bearer ${result.token}`,
          },
        })

        localStorageSet(`application-formation-${props.context.cle_ministere_educatif}`, Date.now().toString())

        SendPlausibleEvent("Envoi Prendre RDV - Fiche formation", {
          info_fiche: `${props.context.cle_ministere_educatif}`,
        })

        setOnSuccessSubmitResponse(response)
      } catch (json) {
        setError(json?.message || "Une erreur inattendue est survenue.")
      }
    },
  })

  /**
   * On change on applicant reasons, it updates the state.
   */
  const onChangeApplicantReasons = (values: EReasonsKey[]) => {
    const applicantReasonsUpdated = applicantReasons.map((reason) => ({
      ...reason,
      checked: values.includes(reason.key),
    }))

    setApplicantReasons(applicantReasonsUpdated)
    setShowApplicantReasonError(!hasApplicantReasonChecked())
  }

  const hasApplicantReasonChecked = () => applicantReasons.filter(({ checked }) => checked).length > 0

  const submitForm = async (e) => {
    e.preventDefault()
    setShowApplicantReasonError(!hasApplicantReasonChecked())
    if (hasApplicantReasonChecked()) {
      await formik.submitForm()
    } else {
      formik.setTouched({ firstname: true, lastname: true, phone: true, email: true }, true)
    }
  }

  const resetForm = () => {
    formik.resetForm()
    setShowApplicantReasonError(false)
    setOnSuccessSubmitResponse(null)
    setError(null)
  }

  const formElement = () => (
    <form>
      <Flex direction={["column", "column", "row"]}>
        <Text mt={7} pb={2}>
          Vous êtes * :
        </Text>
        <RadioGroup mt={7} ml={10} data-testid="fieldset-who-type" value={applicantType} onChange={(value) => setApplicantType(value as EApplicantType)}>
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
      <Flex direction={["column", "column", "row"]} mt={6}>
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
        <FormControl data-testid="fieldset-email" mt={{ base: 3, md: "0" }} isInvalid={!!(formik.touched.email && formik.errors.email)}>
          <FormLabel htmlFor="email">E-mail *</FormLabel>
          <Input data-testid="email" name="email" type="email" width={["100%", "100%", "95%"]} onChange={onEmailChange} onBlur={formik.handleBlur} value={formik.values.email} />
          {suggestedEmails.length > 0 && (
            <Box mt={2} fontSize="12px" color="grey.600">
              <Text as="span" mr={2}>
                Voulez vous dire ?
              </Text>
              {suggestedEmails.map((suggestedEmail) => (
                <Button
                  key={suggestedEmail.corrected}
                  onClick={onClickEmailSuggestion}
                  textAlign="center"
                  fontSize="12px"
                  width="fit-content"
                  px="5px"
                  pb="3px"
                  mr="5px"
                  mt="3px"
                  color="bluefrance.500"
                  bg="#e3e3fd"
                  borderRadius="40px"
                >
                  {suggestedEmail.corrected}
                </Button>
              ))}
            </Box>
          )}
          <FormErrorMessage>{formik.errors.email}</FormErrorMessage>
        </FormControl>
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
        <FormControl data-testid="fieldset-reasons" mt={{ base: 3, md: "0" }}>
          <FormLabel htmlFor="reasons">Quel(s) sujet(s) souhaitez-vous aborder ? *</FormLabel>
          <Accordion allowToggle borderLeftWidth={1} borderRightWidth={1} mr={4} width={["100%", "100%", "auto", "auto"]}>
            <AccordionItem>
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
                    {hasApplicantReasonChecked()
                      ? applicantReasons
                          .filter(({ checked }) => checked)
                          .map(({ title }) => title)
                          .join(", ")
                      : "Sélectionner une ou des options"}
                  </Box>
                  <AccordionIcon />
                </AccordionButton>
              </h2>
              <AccordionPanel pb={4}>
                <CheckboxGroup onChange={onChangeApplicantReasons}>
                  <Stack direction="column" spacing={3} mt={1} ml={1}>
                    {applicantReasons.map(({ key, checked, title }, index) => (
                      <Checkbox key={key} id={`reason-${index}`} size="lg" defaultChecked={checked} value={key}>
                        {title}
                      </Checkbox>
                    ))}
                  </Stack>
                </CheckboxGroup>
              </AccordionPanel>
            </AccordionItem>
          </Accordion>
          {applicantReasons.find(({ key, checked }) => key === EReasonsKey.AUTRE && checked) && (
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
          <FormControl isInvalid={!hasApplicantReasonChecked() && showApplicantReasonError}>
            <FormErrorMessage>Le(s) sujet(s) que je souhaite aborder doit/doivent être renseigné(s).</FormErrorMessage>
          </FormControl>
        </FormControl>
      </Flex>
      <Box width="95%" my={4} fontSize="12px">
        <Text mb={2} color="grey.600" mt={6}>
          * Champs obligatoires
        </Text>
        <Text mt={4}>
          En remplissant ce formulaire, vous acceptez les{" "}
          <Link href="/cgu" color="grey.800" textDecoration="underline" isExternal title="Conditions générales d'utilisation - nouvelle fenêtre">
            Conditions générales d&apos;utilisation <ExternalLinkIcon mx="2px" />
          </Link>{" "}
          du service La bonne alternance et acceptez le partage de vos informations avec l&apos;établissement {props.context.etablissement_formateur_entreprise_raison_sociale}.
          <br />
          Pour plus d'informations sur le traitement de vos données à caractère personnel, veuillez consulter la{" "}
          <Link href="/politique-de-confidentialite" color="grey.800" textDecoration="underline" isExternal title="politique de confidentialité - nouvelle fenêtre">
            Politique de confidentialité <ExternalLinkIcon mx="2px" />
          </Link>{" "}
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
        <Button
          data-tracking-id="prendre-rdv-cfa"
          aria-label="Envoyer la demande de contact"
          variant="blackButton"
          type="submit"
          fontWeight="700"
          onClick={submitForm}
          isDisabled={formik.isSubmitting}
        >
          J'envoie ma demande
        </Button>
      </Box>
    </form>
  )

  const formConfirmed = () => (
    <Box mt={2}>
      <Flex alignItems="center">
        <Image mr={2} src="/images/paperplane2.svg" aria-hidden={true} alt="" />
        <Text mb={2} as="h1" fontWeight={700} fontSize="20px" data-testid="DemandeDeContactConfirmationTitle">
          Voilà une bonne chose de faite {onSuccessSubmitResponse.user.firstname} {onSuccessSubmitResponse.user.lastname} !
        </Text>
      </Flex>
      <Box mt={6}>
        <Text fontWeight="700" color="grey.750">
          {onSuccessSubmitResponse.formation.etablissement_formateur_raison_sociale.toUpperCase()} pourra donc vous contacter au{" "}
          <Text color="bluefrance.500" as="span">
            {onSuccessSubmitResponse.user.phone.match(/.{1,2}/g).join(".")}
          </Text>{" "}
          ou sur{" "}
          <Text color="bluefrance.500" as="span">
            {onSuccessSubmitResponse.user.email}
          </Text>{" "}
          pour répondre à vos questions.
        </Text>
        <Text mt={6}>Vous allez recevoir un email de confirmation de votre demande de contact sur votre adresse email.</Text>
      </Box>
      <Flex bg="#F9F8F6" mt="32px">
        <Box w="100px" px="40px" py="16px">
          <BarberGuy w="34px" h="38px" />
        </Box>
        <Box mt="12px" pb="24px" pr="10px">
          <Text fontSize="20px" fontWeight="700" mt="6px">
            Psst, nous avons une{" "}
            <Box as="span" color="bluefrance.500">
              info pour vous !
            </Box>
          </Text>
          <Text fontSize="16px" mt="12px">
            <b>Pour préparer votre premier contact avec le centre formation,</b> répondez à notre quiz{" "}
            <Link href="https://dinum.didask.com/courses/demonstration/60abc18c075edf000065c987" isExternal title="Prendre contact avec une école - nouvelle fenêtre">
              <u>Prendre contact avec une école</u> <ExternalLinkIcon mt="-5px" />
            </Link>
          </Text>
        </Box>
      </Flex>
    </Box>
  )

  return props.showInModal ? (
    <Box data-testid="DemandeDeContact">
      <Box>
        <Box my={4}>
          <Button
            ml={1}
            padding="8px 24px"
            color="white"
            background="bluefrance.500"
            borderRadius="8px"
            data-testid="prdvButton"
            sx={{
              textDecoration: "none",
              _hover: {
                background: "bluesoft.500",
              },
            }}
            onClick={onOpen}
            aria-label="Ouvrir le formulaire de demande de contact"
          >
            Je prends rendez-vous
          </Button>
          <Modal isOpen={isOpen} onClose={onClose} closeOnOverlayClick={false} size={["full", "full", "full", "3xl"]}>
            <ModalOverlay />
            <ModalContent>
              <ModalHeader mt={4} paddingTop="10px" paddingBottom="0" sx={{ textAlign: "right" }}>
                <LBAModalCloseButton onClose={onClose} />
              </ModalHeader>
              <ModalBody data-testid="modalbody-contact-confirmation" mx={onSuccessSubmitResponse ? [0, 0, 12, 12] : [0, 0, 4, 4]}>
                {onSuccessSubmitResponse ? (
                  formConfirmed()
                ) : (
                  <>
                    <Text as="h1" fontWeight={700} fontSize="24px" data-testid="DemandeDeContactFormTitle" mb={4}>
                      Contacter {props.context.etablissement_formateur_entreprise_raison_sociale}
                    </Text>
                    {formElement()}
                  </>
                )}
              </ModalBody>
            </ModalContent>
          </Modal>
        </Box>
      </Box>
    </Box>
  ) : (
    <Box>{onSuccessSubmitResponse ? formConfirmed() : formElement()}</Box>
  )
}

export default DemandeDeContact
