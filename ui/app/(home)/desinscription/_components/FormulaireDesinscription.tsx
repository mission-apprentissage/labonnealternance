import { Box, Checkbox, Flex, Heading, Image, Link, Modal, ModalBody, ModalContent, ModalHeader, ModalOverlay, SimpleGrid, Spinner, Text } from "@chakra-ui/react"
import Button from "@codegouvfr/react-dsfr/Button"
import { captureException } from "@sentry/browser"
import { useMutation } from "@tanstack/react-query"
import { Form, FormikContext, useFormik } from "formik"
import { useState } from "react"
import { IUnsubscribePossibleCompany } from "shared/routes/unsubscribe.routes"
import * as Yup from "yup"

import { CustomSelect } from "@/app/(espace-pro)/_components/CustomSelect"
import { CustomFormControl } from "@/app/_components/CustomFormControl"
import CustomInput from "@/app/_components/CustomInput"
import ModalCloseButton from "@/app/_components/ModalCloseButton"
import { Warning } from "@/theme/components/icons"
import { unsubscribeCompany, unsubscribeCompanySirets } from "@/utils/api"
import { ApiError } from "@/utils/api.utils"

const unsubscribeReasons = [
  "Nous avons déjà trouvé nos alternants pour l’année en cours",
  "Les candidatures ne correspondent pas aux activités de mon entreprise",
  "J'utilise d'autres canaux pour mes recrutements d'alternants",
  "Mon entreprise n’a pas la capacité financière pour recruter un alternant",
  "Mon entreprise ne recrute pas en alternance",
  "Je m'oppose au traitement des mes données par La bonne alternance",
  "L’entreprise est fermée",
  "Autre",
]

const SupportLink = ({ subject }: { subject: string }) => {
  const fullSubject = `Candidature spontanée - Déréférencement - ${subject}`
  return (
    <Link textDecoration="underline" href={`mailto:labonnealternance@apprentissage.beta.gouv.fr?subject=${encodeURIComponent(fullSubject)}`}>
      support
    </Link>
  )
}

const errorMessages = {
  NON_RECONNU: (
    <>
      Votre établissement n’est pas reconnu. Veuillez saisir une adresse email valide. Vous pouvez aussi contacter notre <SupportLink subject="Email inconnu" />.
    </>
  ),
  ETABLISSEMENTS_MULTIPLES: (
    <>
      Plusieurs établissements correspondent à cet email, veuillez contacter notre <SupportLink subject="Plusieurs établissements" /> pour procéder au déréférencement de tout ou
      partie de ces établissements
    </>
  ),
  unexpected_error: (
    <>
      Une erreur technique s'est produite. Veuillez réessayer ultérieurement. Vous pouvez aussi contacter notre <SupportLink subject="Erreur technique" />
    </>
  ),
}

const ConfirmationDesinscription = ({
  companies,
  onSubmit,
  onClose,
}: {
  companies: IUnsubscribePossibleCompany[]
  onSubmit: (sirets: string[]) => Promise<void>
  onClose: () => void
}) => {
  const allSirets = companies.map((company) => company.siret)
  const [selectedSirets, setSelectedSirets] = useState(allSirets)
  const areAllSelected: boolean = companies.length === selectedSirets.length

  const mutation = useMutation({
    mutationFn: ({ sirets }: { sirets: string[] }) => {
      return onSubmit(sirets)
    },
  })
  const isSubmitting = mutation.isPending

  const isSiretSelected = (siret: string) => selectedSirets.includes(siret)

  const toggleSiretSelection = (siret: string) => {
    const isChecked = isSiretSelected(siret)
    if (isChecked) {
      setSelectedSirets(selectedSirets.filter((siretIte) => siretIte !== siret))
    } else {
      setSelectedSirets([...selectedSirets, siret])
    }
  }

  const toggleSelectAll = () => {
    if (areAllSelected) {
      setSelectedSirets([])
    } else {
      setSelectedSirets(allSirets)
    }
  }

  return (
    <Modal closeOnOverlayClick={false} blockScrollOnMount={true} size="3xl" isOpen={true} onClose={onClose}>
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
            {companies.map((company) => (
              <Flex key={company.siret} alignItems="center" border="1px solid #E5E5E5" mb={2} px={4} py={2}>
                <Checkbox onChange={() => toggleSiretSelection(company.siret)} isChecked={isSiretSelected(company.siret)} value={company.siret} />
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
            <Checkbox onChange={toggleSelectAll} isChecked={areAllSelected} defaultChecked>
              Tout sélectionner
            </Checkbox>
            <Button
              disabled={isSubmitting || !selectedSirets.length}
              onClick={() => {
                if (selectedSirets.length) {
                  mutation.mutate({ sirets: selectedSirets })
                }
              }}
            >
              {isSubmitting && <Spinner mr={4} />}Déréférencer
            </Button>
          </Flex>
        </ModalBody>
      </ModalContent>
    </Modal>
  )
}

export const FormulaireDesinscription = ({ companyEmail, handleUnsubscribeSuccess }: { companyEmail?: string; handleUnsubscribeSuccess: () => void }) => {
  const [errorMessage, setErrorMessage] = useState(null)
  const [possibleCompanies, setPossibleCompanies] = useState<IUnsubscribePossibleCompany[] | null>(null)

  const handleError = (error: any) => {
    if (error && error instanceof ApiError && error.isNotFoundError()) {
      setErrorMessage(errorMessages.NON_RECONNU)
    } else {
      captureException(error)
      setErrorMessage(errorMessages.unexpected_error)
    }
  }

  const onUnsubscribeSubmit = async (values: { reason: string; email: string }) => {
    setErrorMessage(null)
    try {
      const response = await unsubscribeCompany(values)
      if ("possibleCompanies" in response && response.possibleCompanies?.length) {
        setPossibleCompanies(response.possibleCompanies as IUnsubscribePossibleCompany[])
      } else {
        handleUnsubscribeSuccess()
      }
    } catch (error) {
      handleError(error)
    }
  }

  const formik = useFormik({
    validationSchema: Yup.object().shape({
      reason: Yup.string().required("Vous devez sélectionner un motif"),
      email: Yup.string().email("Veuillez saisir une adresse email valide").required("Veuillez saisir une adresse email valide"),
    }),
    initialValues: { email: companyEmail, reason: undefined },
    onSubmit: onUnsubscribeSubmit,
    enableReinitialize: true,
  })

  const onUnsubscribeSiretsSubmit = async (sirets: string[]) => {
    setErrorMessage(null)
    try {
      await unsubscribeCompanySirets({ sirets, ...formik.values })
      handleUnsubscribeSuccess()
    } catch (error) {
      handleError(error)
    }
  }

  const { isSubmitting, setFieldValue, isValid, dirty } = formik

  return (
    <Box as="section" p={3} mb={{ base: "2", md: "0" }} backgroundColor="white">
      {possibleCompanies && <ConfirmationDesinscription onClose={() => setPossibleCompanies(null)} companies={possibleCompanies} onSubmit={onUnsubscribeSiretsSubmit} />}
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
          <FormikContext value={formik}>
            <Form>
              <CustomInput
                name="email"
                type="email"
                placeholder="Adresse email de contact de la société..."
                required={true}
                label="Email de l'établissement"
                info="Indiquez l'email sur lequel sont actuellement reçues les candidatures"
              />

              <CustomFormControl name="reason" required={true} label="Motif" info="Indiquez la raison pour laquelle vous ne souhaitez plus recevoir de candidature">
                <CustomSelect name="reason" possibleValues={unsubscribeReasons} onChange={(value) => setFieldValue("reason", value, true)} />
              </CustomFormControl>

              {errorMessage && (
                <Flex direction="row" alignItems="center" color="red.500">
                  <Warning m={0} />
                  <Box ml={1}>{errorMessage}</Box>
                </Flex>
              )}

              <Flex mt={5} justifyContent="space-between">
                <Text mt={1} fontSize="12px">
                  Tous les champs sont obligatoires
                </Text>

                <Button disabled={isSubmitting || !isValid || !dirty} type="submit">
                  {isSubmitting && <Spinner mr={4} />}Confirmer
                </Button>
              </Flex>
            </Form>
          </FormikContext>
        </Box>
      </SimpleGrid>
    </Box>
  )
}
