import { UNSUBSCRIBE_EMAIL_ERRORS } from "@/../shared/constants/recruteur"
import {
  ModalBody,
  Box,
  Button,
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
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Select,
  SimpleGrid,
  Spinner,
  Text,
  useDisclosure,
} from "@chakra-ui/react"
import { Formik, Field, Form } from "formik"
import { useRouter } from "next/router"
import React, { useState } from "react"
import * as Yup from "yup"

import postUnsubscribe from "../../services/postUnsubscribe"
import LBAModalCloseButton from "../lbaModalCloseButton"

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

const ConfirmationDesinscription = ({ isOpen, onClose }) => {
  return (
    <Modal closeOnOverlayClick={false} blockScrollOnMount={true} size="3xl" isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent mt={["0", "3.75rem"]} h={["100%", "auto"]} borderRadius={0}>
        <ModalHeader mt={4} paddingTop="10px" paddingBottom="0" sx={{ textAlign: "right" }}>
          <LBAModalCloseButton onClose={onClose} />
          <Heading as="h2" fontSize="24px">
            <Flex>
              <Image mt={1} src="/images/icons/arrow_right.svg" alt="" width="16px" mr={1} /> Plusieurs établissements correspondent à cet email
            </Flex>
          </Heading>
        </ModalHeader>
        <ModalBody pb={6}>Veuillez sélectionner les établissements pour lesquels vous ne souhaitez plus recevoir de candidatures spontanées.</ModalBody>
      </ModalContent>
    </Modal>
  )
}

const FormulaireDesinscription = ({ handleUnsubscribeSuccess }) => {
  const [emailError, setEmailError] = useState(null)
  const [popupData /*, setPopupData*/] = useState({})
  const validationPopup = useDisclosure()
  const router = useRouter()

  const handleUnsubsribeSubmit = async (values) => {
    setEmailError(null)
    const response = await postUnsubscribe(values)

    if (response.result === "OK") {
      handleUnsubscribeSuccess()
    } else if (response.result === UNSUBSCRIBE_EMAIL_ERRORS.ETABLISSEMENTS_MULTIPLES) {
      validationPopup.onOpen()
      /**
       * Si siret mutliple alors ouvrir popup avec liste de siret
       * construire la liste
       * submit desinscription avec la liste de siret et l'adresse email et le motif
       * Gérer state de liste de siret
       * gérer state de submitting popup
       * gérer state de liste de siret sélectionnés
       * gérer state de values
       *
       * modifier endpoint pour pouvoir retourner liste de siret si plusieurs
       * modifier endpoint pour accepter liste de siret optionnels
       *
       *
       */
    } else {
      setEmailError(EMAIL_ERRORS[response.result])
    }
  }

  return (
    <Box as="section" p={3} mb={{ base: "2", md: "0" }} backgroundColor="white">
      <ConfirmationDesinscription {...popupData} {...validationPopup} />
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
            initialValues={{ email: router?.query?.email || "", reason: "" }}
            onSubmit={handleUnsubsribeSubmit}
            enableReinitialize={true}
          >
            {({ isSubmitting, errors, touched, submitCount }) => (
              <Form>
                <FormControl isInvalid={errors.email && touched && submitCount > 0}>
                  <FormLabel color={touched && submitCount > 0 && errors.email ? "red.500" : "gray.800"}>Email de l'établissement</FormLabel>
                  <FormHelperText pb={2}>Indiquer l'email sur lequel sont actuellement reçues les candidatures</FormHelperText>
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
                  <FormHelperText pb={2}>Indiquer la raison pour laquelle vous ne souhaitez plus recevoir de candidature?</FormHelperText>
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

                  <Button variant="primary" disabled={isSubmitting} type={"submit"} fontSize="16px" px={6} py={2} fontWeight="400">
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
