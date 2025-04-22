"use client"

import { Box, Container, Flex, Spinner, Text } from "@chakra-ui/react"
import { useQuery } from "@tanstack/react-query"
import { useSearchParams } from "next/navigation"

import { ContactCfaSummary } from "@/components/espace_pro/Candidat/layout/ContactCfaSummary"
import DemandeDeContact from "@/components/RDV/DemandeDeContact"
import { IconeLogo } from "@/theme/components/icons"
import { getPrdvContext } from "@/utils/api"

/**
 * Appointment form page.
 */
export default function PriseDeRendezVous() {
  const cleMinistereEducatif = useSearchParams().get("cleMinistereEducatif")
  const referrer = useSearchParams().get("referrer")

  const { data, isLoading } = useQuery({
    queryKey: ["getPrdvForm", cleMinistereEducatif],
    queryFn: () => getPrdvContext(cleMinistereEducatif, referrer),
    enabled: !!cleMinistereEducatif,
    gcTime: 0,
  })

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
      {isLoading && <Spinner display="block" mx="auto" size="xl" mt="10rem" />}
      {data && "error" in data && (
        <Box mt="5rem" textAlign="center">
          {data.error as string}
        </Box>
      )}
      {data && "intitule_long" in data && (
        <>
          <ContactCfaSummary
            entrepriseRaisonSociale={data?.etablissement_formateur_entreprise_raison_sociale}
            intitule={data?.intitule_long}
            adresse={data?.lieu_formation_adresse}
            codePostal={data?.code_postal}
            ville={data?.localite}
          />
          {/* @ts-ignore TODO */}
          <DemandeDeContact context={data} referrer={referrer} showInModal={false} />
        </>
      )}
    </Container>
  )
}
