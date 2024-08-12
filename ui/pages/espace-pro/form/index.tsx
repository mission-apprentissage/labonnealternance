import { Box, Spinner, Text } from "@chakra-ui/react"
import { useRouter } from "next/router"
import { useEffect, useState } from "react"
import { IAppointmentRequestContextCreateFormAvailableResponseSchema, IAppointmentRequestContextCreateResponseSchema } from "shared/routes/appointments.routes"

import { ContactCfaSummary } from "@/components/espace_pro/Candidat/layout/ContactCfaSummary"
import DemandeDeContact from "@/components/RDV/DemandeDeContact"
import { useLocalStorageSynchronized } from "@/services/useLocalStorageSynchronized"
import { apiPost } from "@/utils/api.utils"

import { FormLayoutComponent } from "../../../components/espace_pro/Candidat/layout/FormLayoutComponent"

/**
 * Appointment form page.
 */
export default function FormCreatePage() {
  const router = useRouter()

  const [data, setData] = useState<IAppointmentRequestContextCreateFormAvailableResponseSchema | null>(null)
  const [error, setError] = useState()
  const [loading, setLoading] = useState(false)

  const { cleMinistereEducatif, referrer } = router.query as { cleMinistereEducatif: string; referrer: string }

  const [, setHasApplied] = useLocalStorageSynchronized(`application-formation-${cleMinistereEducatif}`)
  /**
   * @description Initialize.
   */
  useEffect(() => {
    async function fetchContext() {
      try {
        setLoading(true)

        const response = (await apiPost("/appointment-request/context/create", {
          body: { idCleMinistereEducatif: cleMinistereEducatif, referrer },
        })) as IAppointmentRequestContextCreateResponseSchema

        if ("error" in response) {
          throw new Error(response?.error)
        }

        setData(response as IAppointmentRequestContextCreateFormAvailableResponseSchema)
      } catch (error) {
        setError(error.message)
      } finally {
        setLoading(false)
      }
    }
    if (referrer) fetchContext()
  }, [cleMinistereEducatif, referrer])

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
      {loading && <Spinner display="block" mx="auto" size="xl" mt="10rem" />}
      {error && (
        <Box mt="5rem" textAlign="center">
          {error}
        </Box>
      )}
      {data && (
        <>
          <ContactCfaSummary
            entrepriseRaisonSociale={data?.etablissement_formateur_entreprise_raison_sociale}
            intitule={data?.intitule_long}
            adresse={data?.lieu_formation_adresse}
            codePostal={data?.code_postal}
            ville={data?.localite}
          />
          <DemandeDeContact context={data} referrer={referrer} showInModal={false} setHasApplied={setHasApplied} />
        </>
      )}
    </FormLayoutComponent>
  )
}
