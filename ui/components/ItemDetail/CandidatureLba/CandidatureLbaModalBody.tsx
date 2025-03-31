import { ExternalLinkIcon } from "@chakra-ui/icons"
import { Box, Flex, FormControl, FormErrorMessage, FormLabel, Input, Link, Spinner, Text } from "@chakra-ui/react"
import Button from "@codegouvfr/react-dsfr/Button"
import emailMisspelled, { top100 } from "email-misspelled"
import { useFormik } from "formik"
import { useState } from "react"
import { ILbaItemLbaCompanyJson, ILbaItemLbaJobJson, ILbaItemPartnerJobJson } from "shared"
import { LBA_ITEM_TYPE, LBA_ITEM_TYPE_OLD } from "shared/constants/lbaitem"
import { toFormikValidationSchema } from "zod-formik-adapter"

import ModalCloseButton from "@/app/_components/ModalCloseButton"
import InfoBanner from "@/components/InfoBanner/InfoBanner"

import CandidatureLbaFileDropzone from "./CandidatureLbaFileDropzone"
import CandidatureLbaMandataireMessage from "./CandidatureLbaMandataireMessage"
import CandidatureLbaMessage from "./CandidatureLbaMessage"
import { CandidatureTasksChecklist } from "./CandidatureTasksChecklist"
import { ApplicationFormikSchema, getInitialSchemaValues, IApplicationSchemaInitValues } from "./services/getSchema"

const emailChecker = emailMisspelled({ maxMisspelled: 3, domains: top100 })

export const CandidatureLbaModalBody = ({
  isLoading,
  company,
  item,
  kind,
  fromWidget = false,
  onSubmit,
  onClose,
}: {
  isLoading: boolean
  company: string
  item: ILbaItemLbaJobJson | ILbaItemLbaCompanyJson | ILbaItemPartnerJobJson
  kind: LBA_ITEM_TYPE | LBA_ITEM_TYPE_OLD
  fromWidget?: boolean
  onSubmit: (values: IApplicationSchemaInitValues) => void
  onClose: () => void
}) => {
  const formik = useFormik({
    initialValues: getInitialSchemaValues(),
    validationSchema: toFormikValidationSchema(ApplicationFormikSchema),
    onSubmit,
  })

  const setFileValue = (fileValue) => {
    formik.values.applicant_attachment_name = fileValue?.applicant_attachment_name || null
    formik.values.applicant_attachment_content = fileValue?.applicant_attachment_content || null
  }

  return (
    <form onSubmit={formik.handleSubmit} style={{ display: "flex", height: "100%", alignItems: "stretch" }}>
      <Box display={["none", "none", "none", "block"]}>
        <CandidatureTasksChecklist kind={kind} />
      </Box>
      <Box marginX={[6, 8, 8, 8, "69px"]} my={4}>
        {!fromWidget && (
          <>
            <Flex justifyContent="flex-end" mr={-6}>
              <ModalCloseButton onClose={onClose} />
            </Flex>
          </>
        )}
        <Text as="h1" fontWeight={700} fontSize="24px" data-testid="CandidatureSpontaneeTitle">
          {kind === LBA_ITEM_TYPE.OFFRES_EMPLOI_LBA ? (
            <>
              Postuler à l&apos;offre {fromWidget ? `${item.title} ` : ""}de {company}
            </>
          ) : (
            <>Candidature spontanée{fromWidget ? ` auprès de ${company}` : ""}</>
          )}
        </Text>

        <CandidatureLbaMessage formik={formik} />
        <Box mt={4}>
          <CandidatureLbaFileDropzone formik={formik} setFileValue={setFileValue} />
        </Box>
        <UserFields formik={formik} />

        <Box mt={4}>
          <CandidatureLbaMandataireMessage item={item} />
        </Box>

        <Box my={4}>
          <Text mb={2} fontSize="14px" color="grey.600">
            * Champs obligatoires
          </Text>
          <Text>
            En remplissant ce formulaire, vous acceptez les{" "}
            <Link href="/cgu" color="companygrey.800" textDecoration="underline" isExternal title="Conditions générales d'utilisation - nouvelle fenêtre">
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
        <Flex my={4} justifyContent="flex-end">
          {isLoading ? (
            <Flex alignItems="center" direction="row" data-testid="candidature-currently-sending">
              <Spinner mr={4} />
              <Text>Veuillez patienter</Text>
            </Flex>
          ) : kind === LBA_ITEM_TYPE.RECRUTEURS_LBA ? (
            <Button data-tracking-id="postuler-entreprise-algo" aria-label="Envoyer la candidature spontanée" type="submit" data-testid="candidature-not-sent">
              J'envoie ma candidature spontanée
            </Button>
          ) : (
            <Button data-tracking-id="postuler-offre-lba" aria-label="Envoyer la candidature" type="submit" data-testid="candidature-not-sent">
              J'envoie ma candidature
            </Button>
          )}
        </Flex>
      </Box>
    </form>
  )
}

const UserFields = ({ formik }: { formik: any }) => {
  const [suggestedEmails, setSuggestedEmails] = useState([])

  const onEmailChange = (e) => {
    const checkedEmail = emailChecker(e.target.value)
    setSuggestedEmails(checkedEmail)
    formik.handleChange(e)
  }

  const clickSuggestion = (value) => {
    formik.setFieldValue("applicant_email", value)
    setSuggestedEmails([])
  }

  return (
    <>
      <Flex direction={["column", "column", "row"]} mt={6} gap={[0, 0, 6]}>
        <FormControl data-testid="fieldset-lastname" mt={{ base: 3, md: "0" }} isInvalid={formik.touched.applicant_last_name && formik.errors.applicant_last_name}>
          <FormLabel htmlFor="lastName">Nom *</FormLabel>
          <Input
            id="lastName"
            data-testid="lastName"
            name="applicant_last_name"
            type="text"
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
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            value={formik.values.applicant_first_name}
          />
          <FormErrorMessage>{formik.errors.applicant_first_name}</FormErrorMessage>
        </FormControl>
      </Flex>

      <Flex direction={["column", "column", "row"]} mt={[null, null, 4]} gap={[0, 0, 6]}>
        <FormControl data-testid="fieldset-email" mt={{ base: 3, md: "0" }} isInvalid={formik.touched.applicant_email && formik.errors.applicant_email}>
          <FormLabel htmlFor="email">E-mail *</FormLabel>
          <Input id="email" data-testid="email" name="applicant_email" type="text" onChange={onEmailChange} onBlur={formik.handleBlur} value={formik.values.applicant_email} />
          {suggestedEmails.length > 0 && (
            <Box mt={2} fontSize="12px" color="grey.600">
              <Text as="span" mr={2}>
                Voulez vous dire ?
              </Text>
              {suggestedEmails.map((suggestedEmail) => (
                <Button key={suggestedEmail.corrected} onClick={() => clickSuggestion(suggestedEmail.corrected)} priority="tertiary no outline" size="small">
                  {suggestedEmail.corrected}
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
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            value={formik.values.applicant_phone}
          />
          <FormErrorMessage>{formik.errors.applicant_phone}</FormErrorMessage>
        </FormControl>
      </Flex>
    </>
  )
}
