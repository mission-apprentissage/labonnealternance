import { Box, Breadcrumb, BreadcrumbItem, BreadcrumbLink, Container, useToast } from "@chakra-ui/react"
import { useRouter } from "next/router"
import { useQuery, useQueryClient } from "react-query"

import { useAuth } from "@/context/UserContext"
import { apiPut } from "@/utils/api.utils"

import { AUTHTYPE } from "../../common/contants"
import { ArrowDropRightLine } from "../../theme/components/icons"
import { createOffre, getFormulaire, getOffre } from "../../utils/api"

import { FormulaireCreationOffre } from "./FormulaireCreationOffre/FormulaireCreationOffre"
import LoadingEmptySpace from "./LoadingEmptySpace"

export default function CreationOffre({ onSuccess, jobId, establishment_id }: { onSuccess: () => void; jobId?: string; establishment_id: string }) {
  const toast = useToast()
  const router = useRouter()
  const client = useQueryClient()
  const { user } = useAuth()

  const { data: formulaire, isLoading: isFormulaireLoading } = useQuery("formulaire", () => getFormulaire(establishment_id))

  const { data: offre, isLoading } = useQuery("offre", () => getOffre(jobId), {
    enabled: Boolean(jobId),
    cacheTime: 0,
  })

  const handleSave = async (values) => {
    // Updates an offer
    if (jobId) {
      await apiPut("/formulaire/offre/:jobId", { params: { jobId }, body: { ...values, job_update_date: new Date() } }).then(() => {
        toast({
          title: "Offre mise à jour avec succès.",
          position: "top-right",
          status: "success",
          duration: 2000,
          isClosable: true,
        })
        onSuccess()
      })
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
      onSuccess()
    }
  }

  if (isLoading || isFormulaireLoading) return <LoadingEmptySpace label="Chargement en cours" />

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
                <BreadcrumbLink textStyle="xs">{formulaire.establishment_raison_sociale}</BreadcrumbLink>
              </BreadcrumbItem>
            </Breadcrumb>
          )}
        </Breadcrumb>
      </Box>
      <FormulaireCreationOffre fromDashboard handleSave={handleSave} offre={offre} />
    </Container>
  )
}
