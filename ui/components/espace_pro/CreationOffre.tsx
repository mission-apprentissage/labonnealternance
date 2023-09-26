import { Box, Breadcrumb, BreadcrumbItem, BreadcrumbLink, Container, useToast } from "@chakra-ui/react"
import { useRouter } from "next/router"
import { useQuery, useQueryClient } from "react-query"

import { AUTHTYPE } from "../../common/contants"
import useAuth from "../../common/hooks/useAuth"
import { ArrowDropRightLine } from "../../theme/components/icons"
import { getOffre, postOffre, putOffre } from "../../utils/api"

import { AjouterVoeux } from "."

export default function CreationOffre() {
  const toast = useToast()
  const router = useRouter()
  const client = useQueryClient()
  const [auth] = useAuth()

  const { establishment_id, jobId } = router.query
  const isCreation = jobId === "creation"

  const { data, isLoading } = useQuery("offre", () => getOffre(jobId), {
    enabled: !isCreation,
    cacheTime: 0,
  })

  const handleSave = (values) => {
    // Updates an offer
    if (!isCreation) {
      putOffre(jobId, values)
        .then(() => {
          toast({
            title: "Offre mise à jour avec succès.",
            position: "top-right",
            status: "success",
            duration: 2000,
            isClosable: true,
          })
        })
        .finally(() => router.push(`/espace-pro/administration/entreprise/${establishment_id}`))
    } else {
      if (auth.type === AUTHTYPE.ENTREPRISE) {
        // Create the offer and return the form with the related offer created
        return postOffre(establishment_id, values).then(({ data }: any) => ({
          form: data,
          offre: data.jobs.slice(-1).shift(),
        }))
      }

      postOffre(establishment_id, values)
        .then(() => {
          toast({
            title: "Offre enregistrée avec succès.",
            position: "top-right",
            status: "success",
            duration: 2000,
            isClosable: true,
          })
        })
        .then(() => client.invalidateQueries("offre-liste"))

        .finally(() => router.push(`/espace-pro/administration/entreprise/${establishment_id}`))
    }
  }

  if (isLoading) return "Chargement en cours..."

  return (
    <Container maxW="container.xl" mt={5}>
      <Box mb={5}>
        <Breadcrumb separator={<ArrowDropRightLine color="grey.600" />} textStyle="xs">
          {auth.sub !== "anonymous" && auth.type !== AUTHTYPE.ENTREPRISE && (
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
      <AjouterVoeux fromDashboard handleSave={handleSave} {...data?.data} />
    </Container>
  )
}
