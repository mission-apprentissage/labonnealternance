import { Box, Spinner, Text } from "@chakra-ui/react"
import { useRouter } from "next/router"
import { useQuery } from "react-query"

import { ContactCfaSummary } from "@/components/espace_pro/Candidat/layout/ContactCfaSummary"
import DemandeDeContact from "@/components/RDV/DemandeDeContact"
import { getPrdvContext } from "@/utils/api"

import { FormLayoutComponent } from "../../../components/espace_pro/Candidat/layout/FormLayoutComponent"

/**
 * Appointment form page.
 */
export default function FormCreatePage() {
  const router = useRouter()
  const { cleMinistereEducatif, referrer } = router.query as { cleMinistereEducatif: string; referrer: string }

  const { data, isLoading } = useQuery(["getPrdvForm", cleMinistereEducatif], () => getPrdvContext(cleMinistereEducatif, referrer), {
    enabled: !!cleMinistereEducatif,
    cacheTime: 0,
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
          {data.error}
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
          <DemandeDeContact context={data} referrer={referrer} showInModal={false} />
        </>
      )}
    </FormLayoutComponent>
  )
}
