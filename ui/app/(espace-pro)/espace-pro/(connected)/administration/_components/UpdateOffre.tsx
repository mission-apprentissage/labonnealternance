import { Box, Breadcrumb, BreadcrumbItem, BreadcrumbLink, Container, useToast } from "@chakra-ui/react"
import { useParams, useRouter } from "next/navigation"
import { useQuery, useQueryClient } from "react-query"
import { AUTHTYPE } from "shared/constants"

import LoadingEmptySpace from "@/app/(espace-pro)/_components/LoadingEmptySpace"
import { FormulaireEditionOffre } from "@/app/(espace-pro)/espace-pro/(connected)/administration/_components/FormulaireEditionOffre"
import { useConnectedSessionClient } from "@/app/(espace-pro)/espace-pro/contexts/userContext"
import { ArrowDropRightLine } from "@/theme/components/icons"
import { createOffre, getFormulaire, getOffre } from "@/utils/api"
import { apiPut } from "@/utils/api.utils"
import { PAGES } from "@/utils/routes.utils"

export default function UpdateOffre() {
  const router = useRouter()
  const { user } = useConnectedSessionClient()
  const { establishment_id, job_id, user_id } = useParams() as { establishment_id: string; job_id: string; user_id?: string }
  const jobId = job_id === "creation" ? undefined : job_id

  const onSuccess = () =>
    user.type === AUTHTYPE.ADMIN ? router.back() : router.push(PAGES.dynamic.successEditionOffre({ userType: user.type, establishment_id, user_id }).getPath())

  const toast = useToast()
  const client = useQueryClient()

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
      <FormulaireEditionOffre fromDashboard handleSave={handleSave} offre={offre} />
    </Container>
  )
}
