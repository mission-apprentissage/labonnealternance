"use client"

import { Box, Container, Flex, Spinner, Text } from "@chakra-ui/react"
import { useQuery } from "@tanstack/react-query"
import { useSearchParams } from "next/navigation"
import { useState } from "react"

import { useFormationPrdvTracker } from "@/app/hooks/useFormationPrdvTracker"
import { ContactCfaSummary } from "@/components/espace_pro/Candidat/layout/ContactCfaSummary"
import { DemandeDeContactConfirmation } from "@/components/RDV/DemandeDeContactConfirmation"
import { DemandeDeContactForm } from "@/components/RDV/DemandeDeContactForm"
import { IconeLogo } from "@/theme/components/icons"
import { getPrdvContext } from "@/utils/api"

/**
 * Appointment form page.
 */
export default function PriseDeRendezVous() {
  const searchParams = useSearchParams()
  const cleMinistereEducatif = searchParams.get("cleMinistereEducatif")
  const referrer = searchParams.get("referrer")

  return (
    <Container maxWidth="82ch" mt={5}>
      <Box bg="#F9F8F6">
        <Flex alignItems="center" flexDirection={["column", "column", "row"]}>
          <Box flex="1" ml={["0", "0", "6em"]}>
            <Flex flexDirection={["column", "column", "row"]} mt={[7, 0, 0]}>
              <Text fontSize="2rem" fontWeight="bold" lineHeight="2.5rem" color="info">
                Envoyer <br />
                une demande de contact <br />
                <Text textStyle="h2" as="span" color="grey.700">
                  au centre de formation
                </Text>
              </Text>
            </Flex>
          </Box>
          <Box mr="2rem" mt={8}>
            <IconeLogo w={["0px", "0px", "300px"]} h={["0px", "0px", "174px"]} />
          </Box>
        </Flex>
      </Box>
      <PageContent cleMinistereEducatif={cleMinistereEducatif} referrer={referrer} />
    </Container>
  )
}

const PageContent = ({ cleMinistereEducatif, referrer }: { cleMinistereEducatif: string; referrer: string }) => {
  const {
    data,
    isLoading,
    error: fetchError,
    isError,
  } = useQuery({
    queryKey: ["getPrdvForm", cleMinistereEducatif],
    queryFn: () => getPrdvContext(cleMinistereEducatif, referrer),
    enabled: !!cleMinistereEducatif,
    gcTime: 0,
  })

  const { setPrdvDone } = useFormationPrdvTracker(cleMinistereEducatif)
  const [confirmation, setConfirmation] = useState<{ appointmentId: string; token: string } | null>(null)

  if (isLoading) return <Spinner display="block" mx="auto" size="xl" my="10rem" />
  let error: string | null = null
  if (fetchError) {
    error = fetchError + ""
  } else if (isError) {
    error = "Une erreur inattendue est survenue. Veuillez réessayer plus tard."
  } else if (data && "error" in data) {
    error = data.error + ""
  }
  if (error) {
    return (
      <Box my="5rem" textAlign="center">
        {error}
      </Box>
    )
  }

  if (confirmation) {
    return <DemandeDeContactConfirmation {...confirmation} />
  }
  if (!data) return null

  const { cle_ministere_educatif, etablissement_formateur_entreprise_raison_sociale } = data
  const context = { cle_ministere_educatif, etablissement_formateur_entreprise_raison_sociale }

  const localOnSuccess = (props: { appointmentId: string; token: string }) => {
    setPrdvDone()
    setConfirmation(props)
  }

  return (
    <>
      <ContactCfaSummary
        entrepriseRaisonSociale={data?.etablissement_formateur_entreprise_raison_sociale}
        intitule={data?.intitule_long}
        adresse={data?.lieu_formation_adresse}
        codePostal={data?.code_postal}
        ville={data?.localite}
      />
      <DemandeDeContactForm context={context} referrer={referrer} onRdvSuccess={localOnSuccess} />
    </>
  )
}
