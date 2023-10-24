import { CloseIcon } from "@chakra-ui/icons"
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
  Input,
  Link,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
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
import React, { useEffect, useState } from "react"
import * as Yup from "yup"

enum ReasonsKey {
  MODALITE = "modalite",
  CONTENU = "contenu",
  PORTE = "porte",
  FRAIS = "frais",
  PLACE = "place",
  HORAIRE = "horaire",
  PLUS = "plus",
  ACCOMPAGNEMENT = "accompagnement",
  LIEU = "lieu",
  SUIVI = "suivi",
  AUTRE = "autre",
}

enum EApplicantType {
  PARENT = "parent",
  ETUDIANT = "etudiant",
}

const reasons = [
  {
    key: ReasonsKey.MODALITE,
    title: "Modalités d'inscription",
    checked: false,
  },
  {
    key: ReasonsKey.CONTENU,
    title: "Contenu de la formation",
    checked: false,
  },
  {
    key: ReasonsKey.PORTE,
    title: "Portes ouvertes",
    checked: false,
  },
  {
    key: ReasonsKey.FRAIS,
    title: "Frais d'inscription",
    checked: false,
  },
  {
    key: ReasonsKey.PLACE,
    title: "Places disponibles",
    checked: false,
  },
  {
    horaire: ReasonsKey.HORAIRE,
    title: "Horaires / rythme de la formation",
    checked: false,
  },
  {
    key: ReasonsKey.PLUS,
    title: "En savoir plus sur l'alternance",
    checked: false,
  },
  {
    key: ReasonsKey.ACCOMPAGNEMENT,
    title: "Accompagnement dans la recherche d'entreprise",
    checked: false,
  },
  {
    key: ReasonsKey.LIEU,
    title: "Lieu de la formation",
    checked: false,
  },
  {
    key: ReasonsKey.SUIVI,
    title: "Suivi de ma candidature",
    checked: false,
  },
  {
    key: ReasonsKey.AUTRE,
    title: "Autre :",
    checked: false,
  },
]

/**
 * "Demande de contact" modal.
 */
const DemandeDeContact = ({ item }) => {
  const { isOpen, onOpen, onClose } = useDisclosure()
  const [suggestedEmails, setSuggestedEmails] = useState([])
  const [applicantReasons, setApplicantReasons] = useState(reasons)
  const [applicantType, setApplicantType] = useState<EApplicantType>(EApplicantType.PARENT)

  const emailChecker = emailMisspelled({ maxMisspelled: 3, domains: top100 })

  const yupInputs = {
    firstname: Yup.string().required("Requis"),
    lastname: Yup.string().required("Requis"),
    phone: Yup.string()
      .matches(/^[0-9]{10}$/, "Requis")
      .required("Requis"),
    email: Yup.string().required("Requis"),
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

  useEffect(() => {
    onOpen()
    // onClose()
  }, [item])

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
    onSubmit: async () => {
      alert("SUBMIT")
    },
  })

  /**
   * On change on applicant reasons, it updates the state.
   */
  const onChangeApplicantReasons = (values: ReasonsKey[]) => {
    const applicantReasonsUpdated = applicantReasons.map((reason) => ({
      ...reason,
      checked: values.includes(reason.key),
    }))

    setApplicantReasons(applicantReasonsUpdated)
  }

  return (
    <Box data-testid="DemandeDeContact">
      Formulaire prise de RDV
      <Box>
        <Box my={4}>
          <Button
            ml={1}
            padding="8px 24px"
            color="white"
            background="bluefrance.500"
            borderRadius="8px"
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
          <Modal isOpen={isOpen} onClose={onClose} closeOnOverlayClick={false} size="3xl">
            <ModalOverlay />
            <ModalContent>
              <ModalHeader mt={4} paddingTop="10px" paddingBottom="0" sx={{ textAlign: "right" }}>
                <Button
                  fontSize="14px"
                  color="bluefrance.500"
                  fontWeight={400}
                  background="none"
                  alignItems="baseline"
                  height="1.5rem"
                  sx={{
                    _hover: {
                      background: "none",
                      textDecoration: "none",
                    },
                    _active: {
                      background: "none",
                    },
                  }}
                  onClick={onClose}
                >
                  Fermer <CloseIcon w={2} h={2} ml={2} />
                </Button>
              </ModalHeader>
              <form>
                <ModalBody data-testid="modalbody-nominal" mx={4}>
                  <Text as="h1" fontWeight={700} fontSize="24px" data-testid="CandidatureSpontaneeTitle">
                    Envoyer une demande de contact
                  </Text>
                  <Flex direction={["column", "column", "row"]} mt={3}>
                    <Text mt={7} pb={2}>
                      Vous êtes{" "}
                      <Text color="redmarianne" as="span">
                        *
                      </Text>{" "}
                      :
                    </Text>
                    <RadioGroup mt={7} ml={10} data-testid="fieldset-who-type" value={applicantType} onChange={(value) => setApplicantType(value as EApplicantType)}>
                      <Stack direction="row" spacing={3}>
                        <Radio size="lg" value={EApplicantType.PARENT}>
                          Le parent
                        </Radio>
                        <Radio size="lg" value={EApplicantType.ETUDIANT}>
                          L'étudiant
                        </Radio>
                      </Stack>
                    </RadioGroup>
                  </Flex>
                  <Flex direction={["column", "column", "row"]} mt={6}>
                    <FormControl data-testid="fieldset-lastname" mt={{ base: 3, md: "0" }}>
                      <FormLabel htmlFor="lastname">Nom *</FormLabel>
                      <Input
                        id="lastname"
                        data-testid="lastname"
                        name="lastname"
                        type="text"
                        width="95%"
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        value={formik.values.lastname}
                      />
                      <FormErrorMessage>{formik.errors.lastname}</FormErrorMessage>
                    </FormControl>
                    <FormControl data-testid="fieldset-email" mt={{ base: 3, md: "0" }} isInvalid={true}>
                      <FormLabel htmlFor="email">E-mail *</FormLabel>
                      <Input id="email" data-testid="email" name="email" type="text" width="95%" onChange={onEmailChange} onBlur={formik.handleBlur} value={formik.values.email} />
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
                  </Flex>
                  <Flex direction={["column", "column", "row"]}>
                    <FormControl data-testid="fieldset-firstname" mt={{ base: 3, md: "0" }}>
                      <FormLabel htmlFor="firstname">Prénom *</FormLabel>
                      <Input
                        id="firstname"
                        data-testid="firstname"
                        name="firstname"
                        type="text"
                        width="95%"
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        value={formik.values.firstname}
                      />
                      <FormErrorMessage>{formik.errors.firstname}</FormErrorMessage>
                    </FormControl>
                    <FormControl data-testid="fieldset-phone" mt={{ base: 3, md: "0" }}>
                      <FormLabel htmlFor="email">Téléphone *</FormLabel>
                      <Input
                        id="phone"
                        data-testid="phone"
                        name="phone"
                        type="text"
                        width="95%"
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
                      <Accordion allowToggle borderLeftWidth={1} borderRightWidth={1} mr={4}>
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
                                {applicantReasons.filter(({ checked }) => checked).length
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
                                {applicantReasons.map(({ key, checked, title }) => (
                                  <Checkbox key={key} size="lg" defaultChecked={checked} value={key}>
                                    {title}
                                  </Checkbox>
                                ))}
                              </Stack>
                            </CheckboxGroup>
                          </AccordionPanel>
                        </AccordionItem>
                      </Accordion>
                      {applicantReasons.find(({ key, checked }) => key === ReasonsKey.AUTRE && checked) && (
                        <FormControl data-testid="fieldset-applicantMessageToCfa">
                          <Input
                            id="applicantMessageToCfa"
                            data-testid="applicantMessageToCfa"
                            name="applicantMessageToCfa"
                            type="text"
                            width="98%"
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            value={formik.values.lastname}
                          />
                          <FormErrorMessage>{formik.errors.lastname}</FormErrorMessage>
                        </FormControl>
                      )}
                    </FormControl>
                  </Flex>
                  <Box width="95%" my={4}>
                    <Text mb={2} fontSize="14px" color="grey.600" mt={10}>
                      * Champs obligatoires
                    </Text>
                    <Text mt={4}>
                      En remplissant ce formulaire, vous acceptez les{" "}
                      <Link href="/cgu" color="grey.800" textDecoration="underline" target="_blank">
                        Conditions générales d&apos;utilisation
                      </Link>{" "}
                      du service La bonne alternance et acceptez le partage de vos informations avec l&apos;établissement .
                      <br />
                      Pour plus d'informations sur le traitement de vos données à caractère personnel, veuillez consulter la{" "}
                      <Link href="/politique-de-confidentialite" color="grey.800" textDecoration="underline" target="_blank">
                        Politique de confidentialité
                      </Link>{" "}
                      de La bonne alternance.
                    </Text>
                  </Box>
                </ModalBody>
                <ModalFooter mb={8}>
                  <Button aria-label="Envoyer la demande de cntact" variant="blackButton" type="submit">
                    J'envoie ma demande
                  </Button>
                </ModalFooter>
              </form>
            </ModalContent>
          </Modal>
        </Box>
      </Box>
    </Box>
  )
}

export default DemandeDeContact
