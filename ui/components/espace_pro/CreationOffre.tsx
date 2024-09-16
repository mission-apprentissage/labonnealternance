import { Box, Breadcrumb, BreadcrumbItem, BreadcrumbLink, Container, useToast } from "@chakra-ui/react"
import { useRouter } from "next/router"
import { useQuery, useQueryClient } from "react-query"

import { useAuth } from "@/context/UserContext"
import { apiPut } from "@/utils/api.utils"

import { AUTHTYPE } from "../../common/contants"
import { ArrowDropRightLine } from "../../theme/components/icons"
import { createOffre, getOffre } from "../../utils/api"

import { AjouterVoeux, LoadingEmptySpace } from "."

export default function CreationOffre() {
  const toast = useToast()
  const router = useRouter()
  const client = useQueryClient()
  const { user } = useAuth()

  const isOpco = router.pathname.indexOf("opco") > 0 ? true : false

  const { establishment_id, jobId } = router.query as { establishment_id: string; jobId: string }
  const isCreation = jobId === "creation"

  const { data: offre, isLoading } = useQuery("offre", () => getOffre(jobId), {
    enabled: !isCreation,
    cacheTime: 0,
  })

  const handleSave = async (values) => {
    // Updates an offer
    if (!isCreation) {
      apiPut(`/formulaire/offre/:jobId`, { params: { jobId }, body: { ...values, job_update_date: new Date() } })
        .then(() => {
          toast({
            title: "Offre mise à jour avec succès.",
            position: "top-right",
            status: "success",
            duration: 2000,
            isClosable: true,
          })
        })
        .finally(() =>
          isOpco
            ? router.push(`/espace-pro/administration/opco/entreprise/${router.query.siret_userId}/entreprise/${establishment_id}`)
            : router.push(`/espace-pro/administration/entreprise/${establishment_id}`)
        )
    } else {
      const { recruiter: formulaire } = await createOffre(establishment_id, values)
      if (user.type === AUTHTYPE.ENTREPRISE) {
        // Create the offer and return the form with the related offer created
        return {
          form: formulaire,
          offre: formulaire.jobs.slice(-1).shift(),
        }
      }
      toast({
        title: "Offre enregistrée avec succès.",
        position: "top-right",
        status: "success",
        duration: 2000,
        isClosable: true,
      })
      client.invalidateQueries("offre-liste")
      // TODO sleep before redirect ?
      router.push(`/espace-pro/administration/entreprise/${establishment_id}`)
    }
  }

  if (isLoading || !establishment_id || !jobId) return <LoadingEmptySpace label="Chargement en cours" />

  return (
    <Container maxW="container.xl" mt={5}>
      <Box mb={5}>
        <Breadcrumb separator={<ArrowDropRightLine color="grey.600" />} textStyle="xs">
          {user && user.type !== AUTHTYPE.ENTREPRISE && (
            <Breadcrumb separator={<ArrowDropRightLine color="grey.600" />} textStyle="xs">
              <BreadcrumbItem>
                <BreadcrumbLink textDecoration="underline" onClick={() => router.back()} textStyle="xs">
                  Administration des offres
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbItem>
                <BreadcrumbLink textStyle="xs">{router.query.raison_sociale}</BreadcrumbLink>
              </BreadcrumbItem>
            </Breadcrumb>
          )}
        </Breadcrumb>
      </Box>
      <AjouterVoeux fromDashboard handleSave={handleSave} offre={offre} />
    </Container>
  )
}
