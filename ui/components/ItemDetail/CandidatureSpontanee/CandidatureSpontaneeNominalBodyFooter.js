import React, { useState } from "react"
import CandidatureSpontaneeSubmit from "./CandidatureSpontaneeSubmit"
import CandidatureSpontaneeFileDropzone from "./CandidatureSpontaneeFileDropzone"
import CandidatureSpontaneeMessage from "./CandidatureSpontaneeMessage"
import CandidatureSpontaneeMandataireMessage from "./CandidatureSpontaneeMandataireMessage"
import { testingParameters } from "../../../utils/testingParameters"
import emailMisspelled, { top100 } from "email-misspelled"
import { Box, Button, Container, Flex, FormControl, FormErrorMessage, FormLabel, Input, Link, ModalBody, ModalFooter, Text } from "@chakra-ui/react"

const emailChecker = emailMisspelled({ maxMisspelled: 3, domains: top100 })

const PostulerBody = (props) => {
  return props.fromWidget ? <Container maxW="2xl">{props.children}</Container> : <ModalBody data-testid="modalbody-nominal">{props.children}</ModalBody>
}

const PostulerFooter = (props) => {
  return props.fromWidget ? <Container maxW="2xl">{props.children}</Container> : <ModalFooter>{props.children}</ModalFooter>
}

const CandidatureSpontaneeNominalBodyFooter = ({ formik, sendingState, company, item, kind, fromWidget = false }) => {
  const setFileValue = (fileValue) => {
    formik.values.fileName = fileValue?.fileName || null
    formik.values.fileContent = fileValue?.fileContent || null
  }

  const [suggestedEmails, setSuggestedEmails] = useState([])

  const onEmailChange = (e) => {
    const checkedEmail = emailChecker(e.target.value)
    setSuggestedEmails(checkedEmail)
    formik.handleChange(e)
  }

  const clickSuggestion = (e) => {
    formik.setFieldValue("email", e.currentTarget.innerHTML)
    setSuggestedEmails([])
  }

  return (
    <>
      <PostulerBody fromWidget={fromWidget}>
        <Text as="h1" fontWeight={700} fontSize="24px" data-testid="CandidatureSpontaneeTitle">
          {kind === "matcha" ? (
            <>
              Postuler à l&apos;offre {fromWidget ? `${item.title} ` : ""}de {company}
            </>
          ) : (
            <>Candidature spontanée{fromWidget ? ` auprès de ${company}` : ""}</>
          )}
        </Text>

        <Flex direction={["column", "column", "row"]} mt={6}>
          <FormControl data-testid="fieldset-lastname" mt={{ base: 3, md: "0" }} isInvalid={formik.touched.lastName && formik.errors.lastName}>
            <FormLabel htmlFor="lastName">Nom *</FormLabel>
            <Input
              id="lastName"
              data-testid="lastName"
              name="lastName"
              type="text"
              width="95%"
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              value={formik.values.lastName}
            />
            <FormErrorMessage>{formik.errors.lastName}</FormErrorMessage>
          </FormControl>

          <FormControl data-testid="fieldset-firstname" mt={{ base: 3, md: "0" }} isInvalid={formik.touched.firstName && formik.errors.firstName}>
            <FormLabel htmlFor="firstName">Prénom *</FormLabel>
            <Input
              id="firstName"
              data-testid="firstName"
              name="firstName"
              type="text"
              width="95%"
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              value={formik.values.firstName}
            />
            <FormErrorMessage>{formik.errors.firstName}</FormErrorMessage>
          </FormControl>
        </Flex>

        {testingParameters?.simulatedRecipient && <Text>Les emails seront envoyés à {testingParameters.simulatedRecipient}</Text>}

        <Flex direction={["column", "column", "row"]} mt={[null, null, 4]}>
          <FormControl data-testid="fieldset-email" mt={{ base: 3, md: "0" }} isInvalid={formik.touched.email && formik.errors.email}>
            <FormLabel htmlFor="email">E-mail *</FormLabel>
            <Input id="email" data-testid="email" name="email" type="text" width="95%" onChange={onEmailChange} onBlur={formik.handleBlur} value={formik.values.email} />
            {suggestedEmails.length > 0 && (
              <Box mt={2} fs="12px" color="grey.600">
                <Text as="span" mr={2}>
                  Voulez vous dire ?
                </Text>
                {suggestedEmails.map((sE) => (
                  <Button
                    key={sE.corrected}
                    onClick={clickSuggestion}
                    textAlign="center"
                    fs="12px"
                    width="fit-content"
                    px="5px"
                    pb="3px"
                    mr="5px"
                    mt="3px"
                    color="bluefrance.500"
                    bg="#e3e3fd"
                    borderRadius="40px"
                  >
                    {sE.corrected}
                  </Button>
                ))}
              </Box>
            )}
            <FormErrorMessage>{formik.errors.email}</FormErrorMessage>
          </FormControl>

          <FormControl data-testid="fieldset-phone" mt={{ base: 3, md: "0" }} isInvalid={formik.touched.phone && formik.errors.phone}>
            <FormLabel htmlFor="email">Téléphone *</FormLabel>
            <Input id="phone" data-testid="phone" name="phone" type="text" width="95%" onChange={formik.handleChange} onBlur={formik.handleBlur} value={formik.values.phone} />
            <FormErrorMessage>{formik.errors.phone}</FormErrorMessage>
          </FormControl>
        </Flex>

        <CandidatureSpontaneeMessage formik={formik} kind={kind} />

        <Box mt={4}>
          <CandidatureSpontaneeFileDropzone formik={formik} setFileValue={setFileValue} />
        </Box>

        <Box mt={4}>
          <CandidatureSpontaneeMandataireMessage item={item} />
        </Box>

        <Box width="95%" my={4}>
          <Text>
            En remplissant ce formulaire, vous acceptez les{" "}
            <Link href="/cgu" color="grey.800" textDecoration="underline" target="_blank">
              Conditions générales d&apos;utilisation.
            </Link>{" "}
            du service La bonne alternance et acceptez le partage de vos informations avec l&apos;établissement {company}
          </Text>
        </Box>
      </PostulerBody>
      <PostulerFooter fromWidget={fromWidget}>
        <CandidatureSpontaneeSubmit item={item} sendingState={sendingState} />
      </PostulerFooter>
    </>
  )
}

export default CandidatureSpontaneeNominalBodyFooter
