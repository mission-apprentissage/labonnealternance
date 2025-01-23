import { ExternalLinkIcon } from "@chakra-ui/icons"
import { Box, Button, Container, Flex, FormControl, FormErrorMessage, FormLabel, Input, Link, ModalBody, ModalFooter, Text } from "@chakra-ui/react"
import emailMisspelled, { top100 } from "email-misspelled"
import { useState } from "react"
import { LBA_ITEM_TYPE_OLD } from "shared/constants/lbaitem"

import InfoBanner from "@/components/InfoBanner/InfoBanner"

import CandidatureLbaFileDropzone from "./CandidatureLbaFileDropzone"
import CandidatureLbaMandataireMessage from "./CandidatureLbaMandataireMessage"
import CandidatureLbaMessage from "./CandidatureLbaMessage"
import CandidatureLbaSubmit from "./CandidatureLbaSubmit"

const emailChecker = emailMisspelled({ maxMisspelled: 3, domains: top100 })

const PostulerBody = (props) => {
  return props.fromWidget ? <Container maxW="2xl">{props.children}</Container> : <ModalBody data-testid="modalbody-nominal">{props.children}</ModalBody>
}

const PostulerFooter = (props) => {
  return props.fromWidget ? <Container maxW="2xl">{props.children}</Container> : <ModalFooter>{props.children}</ModalFooter>
}

const CandidatureLbaModalBody = ({ formik, sendingState, company, item, kind, fromWidget = false }) => {
  const setFileValue = (fileValue) => {
    formik.values.applicant_attachment_name = fileValue?.applicant_attachment_name || null
    formik.values.applicant_attachment_content = fileValue?.applicant_attachment_content || null
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
          {kind === LBA_ITEM_TYPE_OLD.MATCHA ? (
            <>
              Postuler à l&apos;offre {fromWidget ? `${item.title} ` : ""}de {company}
            </>
          ) : (
            <>Candidature spontanée{fromWidget ? ` auprès de ${company}` : ""}</>
          )}
        </Text>

        <Flex direction={["column", "column", "row"]} mt={6}>
          <FormControl data-testid="fieldset-lastname" mt={{ base: 3, md: "0" }} isInvalid={formik.touched.applicant_last_name && formik.errors.applicant_last_name}>
            <FormLabel htmlFor="lastName">Nom *</FormLabel>
            <Input
              id="lastName"
              data-testid="lastName"
              name="applicant_last_name"
              type="text"
              width="95%"
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              value={formik.values.applicant_last_name}
            />
            <FormErrorMessage>{formik.errors.applicant_last_name}</FormErrorMessage>
          </FormControl>

          <FormControl data-testid="fieldset-firstname" mt={{ base: 3, md: "0" }} isInvalid={formik.touched.applicant_first_name && formik.errors.applicant_first_name}>
            <FormLabel htmlFor="firstName">Prénom *</FormLabel>
            <Input
              id="firstName"
              data-testid="firstName"
              name="applicant_first_name"
              type="text"
              width="95%"
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              value={formik.values.applicant_first_name}
            />
            <FormErrorMessage>{formik.errors.applicant_first_name}</FormErrorMessage>
          </FormControl>
        </Flex>

        <Flex direction={["column", "column", "row"]} mt={[null, null, 4]}>
          <FormControl data-testid="fieldset-email" mt={{ base: 3, md: "0" }} isInvalid={formik.touched.applicant_email && formik.errors.applicant_email}>
            <FormLabel htmlFor="email">E-mail *</FormLabel>
            <Input
              id="email"
              data-testid="email"
              name="applicant_email"
              type="text"
              width="95%"
              onChange={onEmailChange}
              onBlur={formik.handleBlur}
              value={formik.values.applicant_email}
            />
            {suggestedEmails.length > 0 && (
              <Box mt={2} fontSize="12px" color="grey.600">
                <Text as="span" mr={2}>
                  Voulez vous dire ?
                </Text>
                {suggestedEmails.map((sE) => (
                  <Button
                    key={sE.corrected}
                    onClick={clickSuggestion}
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
                    {sE.corrected}
                  </Button>
                ))}
              </Box>
            )}
            <FormErrorMessage>{formik.errors.applicant_email}</FormErrorMessage>
          </FormControl>

          <FormControl data-testid="fieldset-phone" mt={{ base: 3, md: "0" }} isInvalid={formik.touched.applicant_phone && formik.errors.applicant_phone}>
            <FormLabel htmlFor="email">Téléphone *</FormLabel>
            <Input
              id="phone"
              data-testid="phone"
              name="applicant_phone"
              type="text"
              width="95%"
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              value={formik.values.applicant_phone}
            />
            <FormErrorMessage>{formik.errors.applicant_phone}</FormErrorMessage>
          </FormControl>
        </Flex>

        <CandidatureLbaMessage formik={formik} kind={kind} />

        <Box mt={4}>
          <CandidatureLbaFileDropzone formik={formik} setFileValue={setFileValue} />
        </Box>

        <Box mt={4}>
          <CandidatureLbaMandataireMessage item={item} />
        </Box>

        <Box width="95%" my={4}>
          <Text mb={2} fontSize="14px" color="grey.600">
            * Champs obligatoires
          </Text>
          <Text>
            En remplissant ce formulaire, vous acceptez les{" "}
            <Link href="/cgu" color="grey.800" textDecoration="underline" isExternal title="Conditions générales d'utilisation - nouvelle fenêtre">
              Conditions générales d&apos;utilisation <ExternalLinkIcon mx="2px" />
            </Link>{" "}
            du service La bonne alternance et acceptez le partage de vos informations avec l&apos;établissement {company}.
            <br />
            Pour plus d'informations sur le traitement de vos données à caractère personnel, veuillez consulter la{" "}
            <Link href="/politique-de-confidentialite" color="grey.800" textDecoration="underline" isExternal title="politique de confidentialité - nouvelle fenêtre">
              Politique de confidentialité <ExternalLinkIcon mx="2px" />
            </Link>{" "}
            de La bonne alternance.
          </Text>
        </Box>

        <InfoBanner showInfo={false} showAlert={false} showOK={false} forceEnvBanner={true} />
      </PostulerBody>
      <PostulerFooter fromWidget={fromWidget}>
        <CandidatureLbaSubmit item={item} sendingState={sendingState} />
      </PostulerFooter>
    </>
  )
}

export default CandidatureLbaModalBody
