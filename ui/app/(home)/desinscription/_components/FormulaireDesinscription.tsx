import {
  Box,
  Checkbox,
  Flex,
  FormControl,
  FormErrorMessage,
  FormHelperText,
  FormLabel,
  Heading,
  Image,
  Input,
  Link,
  Modal,
  ModalBody,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Select,
  SimpleGrid,
  Spinner,
  Text,
  useDisclosure,
} from "@chakra-ui/react"
import Button from "@codegouvfr/react-dsfr/Button"
import { Field, Form, Formik } from "formik"
import { useState } from "react"
import { UNSUBSCRIBE_EMAIL_ERRORS } from "shared/constants/recruteur"
import * as Yup from "yup"

import ModalCloseButton from "@/app/_components/ModalCloseButton"
import postUnsubscribe from "@/services/postUnsubscribe"

const UNSUBSCRIBE_REASON = {
  RECRUTEMENT_CLOS: "Nous avons déjà trouvé nos alternants pour l’année en cours",
  CANDIDATURES_INAPPROPRIEES: "Les candidatures ne correspondent pas aux activités de mon entreprise",
  AUTRES_CANAUX: "J'utilise d'autres canaux pour mes recrutements d'alternants",
  PAS_BUDGET: "Mon entreprise n’a pas la capacité financière pour recruter un alternant",
  PAS_ALTERNANT: "Mon entreprise ne recrute pas en alternance",
  OPPOSITION: "Je m'oppose au traitement des mes données par La bonne alternance",
  ENTREPRISE_FERMEE: "L’entreprise est fermée",
  AUTRE: "Autre",
}

const getSupportMailto = (complement) => (
  <Link textDecoration="underline" href={`mailto:labonnealternance@apprentissage.beta.gouv.fr?subject=Candidature%20spontanée%20-%20Déréférencement%20-%20${complement}`}>
    support
  </Link>
)

const EMAIL_ERRORS = {
  NON_RECONNU: <>Votre établissement n’est pas reconnu. Veuillez saisir une adresse email valide. Vous pouvez aussi contacter notre {getSupportMailto("Email%20inconnu")}.</>,
  ETABLISSEMENTS_MULTIPLES: (
    <>
      Plusieurs établissements correspondent à cet email, veuillez contacter notre {getSupportMailto("Plusieurs%20établissements")} pour procéder au déréférencement de tout ou
      partie de ces établissements
    </>
  ),
  unexpected_error: <>Une erreur technique s'est produite. Veuillez réessayer ultérieurement. Vous pouvez aussi contacter notre {getSupportMailto("Erreur%20technique")}</>,
}

const buildReasonOptions = () => {
  return (
    <>
      <option value="">Sélectionner un motif</option>
      {Object.keys(UNSUBSCRIBE_REASON).map((key) => {
        return (
          <option key={key} value={key}>
            {UNSUBSCRIBE_REASON[key]}
          </option>
        )
      })}
    </>
  )
}

const noPopupData = { companies: null, reason: null, email: null }

const ConfirmationDesinscription = ({
  isOpen,
  onClose,
  companies,
  reason,
  email,
  handleUnsubscribeSubmit,
  selectedSirets,
  setSelectedSirets,
  allSelected,
  setAllSelected,
  isMultipleSubmitting,
  setIsMultipleSubmitting,
}) => {
  const allSirets = companies ? companies.map((company) => company.siret) : null

  const handleMultipleUnsubscribeSubmit = () => {
    setIsMultipleSubmitting(true)
    handleUnsubscribeSubmit({ email, reason, sirets: selectedSirets })
  }

  const onCompanyCheckboxChange = (e) => {
    const checked = e.target.checked

    if (!checked) {
      setAllSelected(false)
      setSelectedSirets(selectedSirets.filter((v) => v !== e.target.value))
    } else {
      const newSelectedSirets = [...selectedSirets]
      newSelectedSirets.push(e.target.value)
      setSelectedSirets(newSelectedSirets)
    }
  }

  const selectAllSirets = (e) => {
    setAllSelected(e.target.checked)
    if (e.target.checked) {
      setSelectedSirets(allSirets)
    } else {
      setSelectedSirets([])
    }
  }

  return (
    <Modal closeOnOverlayClick={false} blockScrollOnMount={true} size="3xl" isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent mt={["0", "3.75rem"]} h={["100%", "auto"]} borderRadius={0}>
        <ModalCloseButton onClose={onClose} />
        <ModalHeader paddingTop="10px" paddingBottom="0" sx={{ textAlign: "right" }}>
          <Heading as="h2" fontSize="24px">
            <Flex>
              <Image mt={1} src="/images/icons/arrow_right.svg" alt="" width="16px" mr={1} /> Plusieurs établissements correspondent à cet email
            </Flex>
          </Heading>
        </ModalHeader>
        <ModalBody>
          <Text mb={4}>Veuillez sélectionner les établissements pour lesquels vous ne souhaitez plus recevoir de candidatures spontanées.</Text>
          <Box maxHeight={400} overflow="auto">
            {companies &&
              companies.map((company) => (
                <Flex key={company.siret} alignItems="center" border="1px solid #E5E5E5" mb={2} px={4} py={2}>
                  <Checkbox onChange={onCompanyCheckboxChange} isChecked={selectedSirets?.includes(company.siret)} value={company.siret} defaultChecked />
                  <Box ml={4}>
                    <Text mb={1}>SIRET: {company.siret}</Text>
                    <Text mb={0} color="grey.425" fontSize={12}>
                      {company.enseigne}
                      <br />
                      {company.address}
                    </Text>
                  </Box>
                </Flex>
              ))}
          </Box>
          <Flex justifyContent="space-between" my={8}>
            <Checkbox onChange={selectAllSirets} isChecked={allSelected} defaultChecked>
              Tout sélectionner
            </Checkbox>
            <Button disabled={isMultipleSubmitting || !selectedSirets?.length} onClick={handleMultipleUnsubscribeSubmit}>
              {isMultipleSubmitting && <Spinner mr={4} />}Déréférencer
            </Button>
          </Flex>
        </ModalBody>
      </ModalContent>
    </Modal>
  )
}

const FormulaireDesinscription = ({ companyEmail, handleUnsubscribeSuccess }) => {
  const [emailError, setEmailError] = useState(null)
  const [popupData, setPopupData] = useState(noPopupData)
  const [selectedSirets, setSelectedSirets] = useState([])
  const [allSelected, setAllSelected] = useState(true)
  const [isMultipleSubmitting, setIsMultipleSubmitting] = useState(false)
  const validationPopup = useDisclosure()

  const handleUnsubscribeSubmit = async (values) => {
    setEmailError(null)
    const response = await postUnsubscribe(values)

    validationPopup.onClose()

    if (response.result === "OK") {
      setPopupData(noPopupData)
      handleUnsubscribeSuccess()
    } else if (response.result === UNSUBSCRIBE_EMAIL_ERRORS.ETABLISSEMENTS_MULTIPLES) {
      setSelectedSirets(response.companies.map((company: any) => company.siret))
      setPopupData({ companies: response.companies, email: values.email, reason: values.reason })
      validationPopup.onOpen()
    } else {
      setPopupData(noPopupData)
      setEmailError(EMAIL_ERRORS["unexpected_error"])
    }
    setIsMultipleSubmitting(false)
  }

  return (
    <Box as="section" p={3} mb={{ base: "2", md: "0" }} backgroundColor="white">
      <ConfirmationDesinscription
        handleUnsubscribeSubmit={handleUnsubscribeSubmit}
        companies={popupData.companies}
        reason={popupData.reason}
        email={popupData.email}
        isOpen={validationPopup.isOpen}
        onClose={validationPopup.onClose}
        selectedSirets={selectedSirets}
        setSelectedSirets={setSelectedSirets}
        allSelected={allSelected}
        setAllSelected={setAllSelected}
        isMultipleSubmitting={isMultipleSubmitting}
        setIsMultipleSubmitting={setIsMultipleSubmitting}
      />
      <SimpleGrid columns={{ md: 1, lg: 2 }} spacing="40px" mb={12}>
        <Box>
          <Text as="h1" variant="homeEditorialH1" mb={3}>
            Vous êtes une entreprise
          </Text>
          <Text as="h2" variant="homeEditorialH2" mb={{ base: "3", lg: "5" }}>
            Vous souhaitez ne plus recevoir de candidatures spontanées de La bonne alternance
          </Text>
          <Box fontWeight={"500"}>Veuillez remplir le formulaire ci-contre.</Box>
        </Box>
        <Box>
          <Formik
            validationSchema={Yup.object().shape({
              reason: Yup.string().required("Vous devez sélectionner un motif"),
              email: Yup.string().email("Veuillez saisir une adresse email valide").required("Veuillez saisir une adresse email valide"),
            })}
            initialValues={{ email: companyEmail || "", reason: "" }}
            onSubmit={handleUnsubscribeSubmit}
            enableReinitialize={true}
          >
            {({ isSubmitting, errors, touched, submitCount }) => (
              <Form>
                <FormControl isInvalid={errors.email && touched && submitCount > 0}>
                  <FormLabel color={touched && submitCount > 0 && errors.email ? "red.500" : "gray.800"}>Email de l'établissement</FormLabel>
                  <FormHelperText pb={2}>Indiquez l'email sur lequel sont actuellement reçues les candidatures</FormHelperText>
                  <Field name="email">
                    {({ field }) => {
                      return <Input placeholder="Adresse email de contact de la société..." {...field} />
                    }}
                  </Field>
                  {emailError && (
                    <Flex mt={2} align="flex-start">
                      <Image mt={1} src="/images/icons/error_info.svg" alt="" mr={1} />
                      <Text fontSize="12px" color="#0063CB">
                        {emailError}
                      </Text>
                    </Flex>
                  )}
                  {touched && submitCount > 0 && errors.email && !emailError && <FormErrorMessage mb={2}>{errors.email as string}</FormErrorMessage>}
                </FormControl>

                <FormControl mt={3} isInvalid={errors.reason && touched && submitCount > 0}>
                  <FormLabel color={touched && submitCount > 0 && errors.reason ? "red.500" : "gray.800"}>Motif</FormLabel>
                  <FormHelperText pb={2}>Indiquez la raison pour laquelle vous ne souhaitez plus recevoir de candidature</FormHelperText>
                  <Field name="reason">
                    {({ field }) => {
                      return (
                        <Select name="reason" {...field}>
                          {buildReasonOptions()}
                        </Select>
                      )
                    }}
                  </Field>
                  {touched && submitCount > 0 && errors.reason && <FormErrorMessage>{errors.reason as string}</FormErrorMessage>}
                </FormControl>

                <Flex mt={5} justifyContent="space-between">
                  <Text mt={1} fontSize="12px">
                    Tous les champs sont obligatoires
                  </Text>

                  <Button disabled={isSubmitting} type="submit">
                    {isSubmitting && <Spinner mr={4} />}Confirmer
                  </Button>
                </Flex>
              </Form>
            )}
          </Formik>
        </Box>
      </SimpleGrid>
    </Box>
  )
}

export default FormulaireDesinscription
