"use client"

import { Box, Spinner, Text } from "@chakra-ui/react"
import { useQuery } from "@tanstack/react-query"
import { useSearchParams } from "next/navigation"

import { ContactCfaSummary } from "@/components/espace_pro/Candidat/layout/ContactCfaSummary"
import DemandeDeContact from "@/components/RDV/DemandeDeContact"
import { getPrdvContext } from "@/utils/api"

import { FormLayoutComponent } from "../../../components/espace_pro/Candidat/layout/FormLayoutComponent"

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
    <FormLayoutComponent
      headerText={
        <>
          Envoyer <br />
          une demande de contact <br />
          <Text textStyle="h2" as="span" color="grey.700">
            au centre de formation
          </Text>
        </>
      }
      bg="white"
    >
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
    </FormLayoutComponent>
  )
}
