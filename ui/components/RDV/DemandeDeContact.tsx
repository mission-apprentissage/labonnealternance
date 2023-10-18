import { CloseIcon } from "@chakra-ui/icons"
import {
  Box,
  Button,
  Flex, FormControl, FormErrorMessage, FormLabel,
  Input, Link,
  Modal, ModalBody,
  ModalContent, ModalFooter,
  ModalHeader,
  ModalOverlay, Radio, RadioGroup, Stack,
  Text,
  useDisclosure,
} from "@chakra-ui/react"
import emailMisspelled, { top100 } from "email-misspelled"
import { useFormik } from "formik"
import React, { useEffect, useState } from "react"
import * as Yup from "yup"


/**
 * "Demande de contact" modal.
 */
const DemandeDeContact = ({ item }) => {
  const { isOpen, onOpen, onClose } = useDisclosure()
  const [suggestedEmails, setSuggestedEmails] = useState([])

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
      applicantType: "parent",
    },
    validationSchema: Yup.object({
      ...yupInputs,
    }),
    onSubmit: async () => {
      alert('SUBMIT')
    },
  })

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
                    <ModalHeader mt={4} paddingTop="10px" paddingBottom="0" sx={{textAlign:"right"}}>
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
                      <ModalBody data-testid="modalbody-nominal">
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
                          <RadioGroup mt={7} ml={10} data-testid="fieldset-who-type">
                            <Stack direction="row" spacing={3}>
                              <Radio size="lg" value="parent">
                                Le parent
                              </Radio>
                              <Radio size="lg" value="etudiant">
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
                          <Flex direction={["column", "column", "row"]} mt={[null, null, 4]}>
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
                              <Input id="phone" data-testid="phone" name="phone" type="text" width="95%" onChange={formik.handleChange} onBlur={formik.handleBlur} value={formik.values.phone} />
                              <FormErrorMessage>{formik.errors.phone}</FormErrorMessage>
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
